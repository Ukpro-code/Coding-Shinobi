import pandas as pd
import os
import glob
import multiprocessing
import psutil
from datetime import datetime
import re

username = "ukprowork"
password = "5b-G5s.*s4hPqEn"

chrome_binary_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
chromedriver_path = r"D:\Ukesh\Coding Shinobi\Coding-Shinobi\Intern_project\Fundsquare_webscrapping Project\chromedriver.exe"

# Read URLs from Excel file (column name must match exactly)
excel_path = r"D:\Ukesh\Coding Shinobi\Coding-Shinobi\Intern_project\Fundsquare_webscrapping Project\Fundsquare first test.xlsx"
df = pd.read_excel(excel_path)
urls = df['Fundsquare_URL'].dropna().tolist()

# Delete old fundsquare_loggedin_*.html files before scraping
for file in glob.glob("fundsquare_loggedin_*.html"):
    try:
        os.remove(file)
        print(f"Deleted old file: {file}")
    except Exception as e:
        print(f"Could not delete {file}: {e}")

def parse_date_string(date_str):
    """
    Parse various date formats and return a datetime object.
    Returns None if parsing fails.
    """
    if not date_str or date_str.strip() == "-" or "unavailable" in date_str.lower():
        return None
    
    # Clean the date string
    date_str = date_str.strip()
    
    # Common date patterns
    date_patterns = [
        r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})',  # DD/MM/YYYY or DD-MM-YYYY
        r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})',  # YYYY/MM/DD or YYYY-MM-DD
        r'(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})',  # DD Mon YYYY
        r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})',  # Mon DD, YYYY
    ]
    
    month_map = {
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
        'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    }
    
    for pattern in date_patterns:
        match = re.search(pattern, date_str, re.IGNORECASE)
        if match:
            try:
                if pattern == date_patterns[0]:  # DD/MM/YYYY
                    day, month, year = match.groups()
                    return datetime(int(year), int(month), int(day))
                elif pattern == date_patterns[1]:  # YYYY/MM/DD
                    year, month, day = match.groups()
                    return datetime(int(year), int(month), int(day))
                elif pattern == date_patterns[2]:  # DD Mon YYYY
                    day, month_str, year = match.groups()
                    month = month_map[month_str.capitalize()]
                    return datetime(int(year), month, int(day))
                elif pattern == date_patterns[3]:  # Mon DD, YYYY
                    month_str, day, year = match.groups()
                    month = month_map[month_str.capitalize()]
                    return datetime(int(year), month, int(day))
            except (ValueError, KeyError):
                continue
    
    return None

def calculate_years_difference(start_date_str, end_date_str):
    """
    Calculate the difference in years between two date strings.
    Returns the difference as a float, or None if calculation fails.
    """
    start_date = parse_date_string(start_date_str)
    end_date = parse_date_string(end_date_str)
    
    if start_date is None or end_date is None:
        return None
    
    # Calculate difference in years (including fractional years)
    years_diff = (end_date - start_date).days / 365.25
    return round(years_diff, 2)

def scrape_batch(url_batch, username, password, chrome_binary_path, chromedriver_path):
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.action_chains import ActionChains
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    import time
    from bs4 import BeautifulSoup
    import traceback

    options = webdriver.ChromeOptions()
    options.binary_location = chrome_binary_path
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--headless=new")  # Use new headless mode for Chrome v109+

    driver = webdriver.Chrome(service=Service(chromedriver_path), options=options)
    wait = WebDriverWait(driver, 15)
    results = []
    try:
        print(f"[DEBUG] Batch size: {len(url_batch)} URLs. First URL: {url_batch[0]}")
        # Login ONCE per process
        driver.get(url_batch[0])
        WebDriverWait(driver, 10).until(lambda d: d.title != "")
        try:
            login_hover_target = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/div[2]/div[2]/div/ul/li[1]/div/a/span')))
            ActionChains(driver).move_to_element(login_hover_target).perform()
            wait.until(EC.presence_of_element_located((By.NAME, "loginheader"))).send_keys(username)
            driver.find_element(By.NAME, "passwordheader").send_keys(password)
            driver.find_element(By.XPATH, '//input[@type="submit"]').click()
            WebDriverWait(driver, 10).until(lambda d: "loginheader" not in d.page_source)
            print(f"[DEBUG] Login submitted. Page title: {driver.title}")
        except Exception as e:
            print(f"[ERROR] Login step failed: {e}")
            traceback.print_exc()
        # Scrape each URL in the batch
        for idx, url in enumerate(url_batch):
            start_time = time.time()
            driver.get(url)
            try:
                WebDriverWait(driver, 10).until(lambda d: d.title != "")
            except Exception:
                print(f"[WARNING] Page did not load properly for {url}")
            print(f"[DEBUG] Scraping URL: {url} | Title: {driver.title}")
            page_source = driver.page_source
            if len(page_source) < 1000:
                print(f"[WARNING] Page source is very short for {url} (length={len(page_source)}). Possible error.")
            if "loginheader" in page_source or "Username" in page_source:
                print(f"⚠️ Login page detected at {url}. Skipping.")
                continue
            soup = BeautifulSoup(page_source, 'html.parser')
            # ISIN and Fund Name extraction (robust)
            isin = ''
            fund_name = ''
            for td in soup.find_all('td'):
                span = td.find('span', style=lambda s: s and 'font-weight: bold' in s)
                if span:
                    span_text = span.text.strip()
                    if span_text.startswith('LU') and len(span_text) > 8:
                        isin = span_text
                        fund_name = td.get_text(separator=' ', strip=True).replace(isin, '').strip()
                    else:
                        fund_name = td.get_text(separator=' ', strip=True).replace(span_text, '').strip()
                    break
            if not fund_name:
                h1 = soup.find('h1')
                if h1:
                    fund_name = h1.get_text(strip=True)
                else:
                    for td in soup.find_all('td'):
                        text = td.get_text(strip=True)
                        if text:
                            fund_name = text
                            break
            # --- Central Administration extraction ---
            def extract_central_admin():
                for tr in soup.find_all('tr'):
                    tds = tr.find_all('td')
                    if len(tds) >= 2 and "central administration" == tds[0].get_text(strip=True).lower():
                        div = tds[1].find('div')
                        if div:
                            value = div.get_text(strip=True)
                        else:
                            value = tds[1].get_text(strip=True)
                        if "unavailable" in value.lower():
                            return "-"
                        return value
                return "-"
            # --- Auditor extraction ---
            def extract_auditor():
                for tr in soup.find_all('tr'):
                    tds = tr.find_all('td')
                    if len(tds) >= 2 and "auditor" == tds[0].get_text(strip=True).lower():
                        value = tds[1].get_text(strip=True)
                        if "unavailable" in value.lower():
                            return "-"
                        return value
                return "-"
            # --- Custodian extraction ---
            def extract_custodian():
                for tr in soup.find_all('tr'):
                    tds = tr.find_all('td')
                    if len(tds) >= 2 and "custodian" == tds[0].get_text(strip=True).lower():
                        value = tds[1].get_text(strip=True)
                        if "unavailable" in value.lower():
                            return "-"
                        return value
                return "-"
            # --- Transfer Agent extraction ---
            def extract_transfer_agent():
                for tr in soup.find_all('tr'):
                    tds = tr.find_all('td')
                    if len(tds) >= 2 and "transfer agent" == tds[0].get_text(strip=True).lower():
                        value = tds[1].get_text(strip=True)
                        if "unavailable" in value.lower():
                            return "-"
                        return value
                return "-"
            # --- Management Company extraction ---
            def extract_management_company():
                for tr in soup.find_all('tr'):
                    tds = tr.find_all('td')
                    if len(tds) >= 2 and "management company" == tds[0].get_text(strip=True).lower():
                        value = tds[1].get_text(strip=True)
                        if "unavailable" in value.lower():
                            return "-"
                        return value
                return "-"
            # --- Promoter(s) extraction ---
            def extract_promoters():
                for tr in soup.find_all('tr'):
                    tds = tr.find_all('td')
                    if len(tds) >= 2 and "promoter(s)" == tds[0].get_text(strip=True).lower():
                        value = tds[1].get_text(strip=True)
                        if "unavailable" in value.lower():
                            return "-"
                        return value
                return "-"
            # --- Legal Advisor extraction ---
            def extract_legal_advisor():
                for tr in soup.find_all('tr'):
                    tds = tr.find_all('td')
                    if len(tds) >= 2 and "legal advisor" == tds[0].get_text(strip=True).lower():
                        value = tds[1].get_text(strip=True)
                        if "unavailable" in value.lower():
                            return "-"
                        return value
                return "-"
            # --- Last NAV extraction ---
            def extract_last_nav():
                for tr in soup.find_all('tr'):
                    tds = tr.find_all('td')
                    if len(tds) >= 2 and "last nav" in tds[0].get_text(strip=True).lower():
                        value = tds[1].get_text(strip=True)
                        if "unavailable" in value.lower():
                            return "-"
                        return value
                return "-"
            # --- Fund Creation Date extraction ---
            def extract_fund_creation_date():
                for tr in soup.find_all('tr'):
                    tds = tr.find_all('td')
                    if len(tds) >= 2 and "fund creation date" == tds[0].get_text(strip=True).lower():
                        value = tds[1].get_text(strip=True)
                        if "unavailable" in value.lower():
                            return "-"
                        return value
                return "-"
            # --- NAV Calculation Frequency extraction (exact label match) ---
            def extract_nav_calc_frequency(driver, wait):
                # Click the "Overview" tab if not already active
                try:
                    overview_tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(., 'Overview')]")))
                    overview_tab.click()
                    time.sleep(1.5)  # Wait for tab content to load
                except Exception:
                    pass  # Tab may already be active or not found

                soup_overview = BeautifulSoup(driver.page_source, 'html.parser')
                # Look for all <td> elements, but only those whose text matches exactly (case-insensitive, stripped)
                for td in soup_overview.find_all('td'):
                    label = td.get_text(strip=True).lower()
                    if label == "nav calculation frequency":
                        next_td = td.find_next_sibling('td')
                        if next_td:
                            value = next_td.get_text(strip=True)
                            if "unavailable" in value.lower():
                                return "-"
                            return value
                return "-"

            central_admin = extract_central_admin()
            auditor = extract_auditor()
            custodian = extract_custodian()
            transfer_agent = extract_transfer_agent()
            management_company = extract_management_company()
            promoters = extract_promoters()
            fund_creation_date = extract_fund_creation_date()
            legal_advisor = extract_legal_advisor()
            last_nav = extract_last_nav()
            nav_calc_frequency = extract_nav_calc_frequency(driver, wait)
            
            # Calculate time series - years between fund creation and last NAV
            fund_age_years = calculate_years_difference(fund_creation_date, last_nav)
            
            exec_time = round(time.time() - start_time, 2)
            results.append({
                'URL': url,
                'Management Company': management_company,
                'ISIN': isin,
                'Fund name': fund_name,
                'Central Administration': central_admin,
                'Auditor': auditor,
                'Custodian': custodian,
                'Promoter(s)': promoters,
                'Transfer agent': transfer_agent,
                'Legal Advisor': legal_advisor,
                'Fund Creation date': fund_creation_date,
                'Last NAV': last_nav,
                'NAV calculation frequency': nav_calc_frequency,
                'Fund Age (Years)': fund_age_years,
                'Execution time (s)': exec_time
            })
            print(f"✅ Scraped page for {url} in {exec_time}s.")
        print(f"[DEBUG] Batch finished. Results in batch: {len(results)}")
    except Exception as e:
        print(f"❌ Error in batch: {e}")
        traceback.print_exc()
    finally:
        driver.quit()
    return results

def get_optimal_process_count():
    total_ram_gb = psutil.virtual_memory().total / (1024 ** 3)
    # Estimate 1.5GB per Selenium process (adjust as needed)
    max_processes_by_ram = int(total_ram_gb // 1.5)
    cpu_count = os.cpu_count() or 4
    # Use the lower of RAM-based or CPU-based limit, but at least 1
    return max(1, min(max_processes_by_ram, cpu_count))

if __name__ == "__main__":
    import time
    start_time = time.time()
    optimal_processes = get_optimal_process_count()
    print(f"[INFO] Detected {psutil.virtual_memory().total // (1024**3)}GB RAM and {os.cpu_count()} CPU cores.")
    print(f"[INFO] Using {optimal_processes} parallel processes for scraping.")
    num_processes = optimal_processes
    batch_size = 3  # Set to 3 URLs per batch for testing
    url_batches = [urls[i:i+batch_size] for i in range(0, len(urls), batch_size)]
    print(f"[DEBUG] Total batches: {len(url_batches)}")
    with multiprocessing.Pool(processes=num_processes) as pool:
        all_results = pool.starmap(scrape_batch, [(batch, username, password, chrome_binary_path, chromedriver_path) for batch in url_batches])

    # Flatten results and save to CSV
    flat_results = [item for sublist in all_results for item in sublist]
    print(f"[DEBUG] Total results scraped: {len(flat_results)}")
    if flat_results:
        pd.DataFrame(flat_results).to_csv("Fundsquare_Scrapped.csv", index=False)
        print("[INFO] Results saved to Fundsquare_Scrapped.csv")
    else:
        print("[INFO] No data scraped.")

    # Print resource usage after scraping
    mem = psutil.virtual_memory()
    print(f"[INFO] RAM used: {mem.percent}% ({mem.used // (1024**2)}MB/{mem.total // (1024**2)}MB)")
    print(f"[INFO] CPU usage: {psutil.cpu_percent(interval=1)}% (averaged over 1 second)")

    # Print time taken for the entire scraping process
    end_time = time.time()
    print("[INFO] Scraping completed.")
    print(f"[INFO] Total execution time: {round(end_time - start_time, 2)} seconds")
    print("[INFO] Script finished successfully.")
    print("[INFO] All tasks completed.")

# End of script
# Note: Ensure you have the required libraries installed:
# pip install pandas selenium beautifulsoup4 psutil
# Also, ensure that the Chrome browser and ChromeDriver versions are compatible.
# Adjust the batch size and number of processes based on your system's capabilities.
# This script is designed to scrape data from Fundsquare URLs in batches using Selenium and multiprocessing.
# It handles login, scraping, and data extraction robustly, with error handling and logging.
# The results are saved to a CSV file for further analysis. 
# Make sure to run this script in an environment where you have the necessary permissions and resources.
# The script is designed to be run as a standalone Python program.
# It uses multiprocessing to scrape multiple URLs in parallel, optimizing resource usage.
# The script also includes detailed debug and info messages to track progress and issues.
# The script is structured to be modular, allowing for easy adjustments to batch sizes and process counts.
# The script is designed to be robust against common web scraping issues, such as page load failures and missing elements.
# It includes comprehensive error handling to ensure that scraping continues even if some URLs fail.
# The script is intended for educational and research purposes. Ensure compliance with the website's terms of service before scraping.
# The script is designed to be run in a Python environment with access to the necessary libraries and web drivers.
# The script is structured to be efficient, using multiprocessing to maximize CPU and RAM usage.
# The script is designed to be flexible, allowing for easy modifications to the scraping logic and data
# extraction methods.
# The script is intended to be run in a controlled environment where the necessary dependencies are installed.
# The script is designed to be user-friendly, with clear output messages and error handling.
# The script is structured to be maintainable, with clear function definitions and modular code.
# Happy scraping! Remember to respect the website's terms of service and robots.txt rules.