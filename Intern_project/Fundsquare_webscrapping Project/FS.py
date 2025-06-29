import pandas as pd
import os
import glob
import multiprocessing
import psutil

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

def scrape_batch(url_batch, username, password, chrome_binary_path, chromedriver_path):
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.action_chains import ActionChains
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    import time
    from bs4 import BeautifulSoup

    options = webdriver.ChromeOptions()
    options.binary_location = chrome_binary_path
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--headless")  # Headless for speed

    driver = webdriver.Chrome(service=Service(chromedriver_path), options=options)
    wait = WebDriverWait(driver, 15)
    results = []
    try:
        # Login ONCE per process
        driver.get(url_batch[0])
        time.sleep(2)
        login_hover_target = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/div[2]/div[2]/div/ul/li[1]/div/a/span')))
        ActionChains(driver).move_to_element(login_hover_target).perform()
        time.sleep(1)
        wait.until(EC.presence_of_element_located((By.NAME, "loginheader"))).send_keys(username)
        driver.find_element(By.NAME, "passwordheader").send_keys(password)
        driver.find_element(By.XPATH, '//input[@type="submit"]').click()
        time.sleep(3)
        # Scrape each URL in the batch
        for idx, url in enumerate(url_batch):
            start_time = time.time()
            driver.get(url)
            time.sleep(2)
            page_source = driver.page_source
            if "loginheader" in page_source or "Username" in page_source:
                print(f"⚠️ Login page detected at {url}. Skipping.")
                continue
            soup = BeautifulSoup(page_source, 'html.parser')
            # DEBUG: Print first 500 chars of HTML and all table/div rows for the first URL in the batch
            if idx == 0:
                print("\n[DEBUG] First 500 chars of HTML:\n", page_source[:500])
                rows = soup.find_all(['tr', 'div'], class_=lambda x: x and ('row' in x or 'table-row' in x))
                print(f"[DEBUG] Found {len(rows)} rows. Printing their text:")
                for r in rows:
                    print(r.get_text(" | ", strip=True))

            # --- Extraction logic for Fundsquare ---
            # ISIN and Fund Name extraction (robust)
            isin = ''
            fund_name = ''
            # Try to extract ISIN and fund name from <td> with bold <span>
            for td in soup.find_all('td'):
                span = td.find('span', style=lambda s: s and 'font-weight: bold' in s)
                if span:
                    span_text = span.text.strip()
                    # ISIN pattern: starts with LU and is alphanumeric, else treat as missing
                    if span_text.startswith('LU') and len(span_text) > 8:
                        isin = span_text
                        fund_name = td.get_text(separator=' ', strip=True).replace(isin, '').strip()
                    else:
                        # If span is present but not a valid ISIN, treat as fund name only
                        fund_name = td.get_text(separator=' ', strip=True).replace(span_text, '').strip()
                    break  # Stop after first match
            # Fallback: If fund name still not found, try <h1> or first non-empty <td>
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

            # --- Collect all data ---
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
                'Execution time (s)': exec_time
            })
            print(f"✅ Scraped page for {url} in {exec_time}s.")
    except Exception as e:
        print(f"❌ Error in batch: {e}")
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
    optimal_processes = get_optimal_process_count()
    print(f"[INFO] Detected {psutil.virtual_memory().total // (1024**3)}GB RAM and {os.cpu_count()} CPU cores.")
    print(f"[INFO] Using {optimal_processes} parallel processes for scraping.")
    num_processes = optimal_processes
    batch_size = 3  # Set to 3 URLs per batch for testing
    url_batches = [urls[i:i+batch_size] for i in range(0, len(urls), batch_size)]
    with multiprocessing.Pool(processes=num_processes) as pool:
        all_results = pool.starmap(scrape_batch, [(batch, username, password, chrome_binary_path, chromedriver_path) for batch in url_batches])

    # Flatten results and save to CSV
    flat_results = [item for sublist in all_results for item in sublist]
    if flat_results:
        pd.DataFrame(flat_results).to_csv("Fundsquare_Scrapped.csv", index=False)
        print("[INFO] Results saved to Fundsquare_Scrapped.csv")
    else:
        print("[INFO] No data scraped.")

    # Print resource usage after scraping
    mem = psutil.virtual_memory()
    print(f"[INFO] RAM used: {mem.percent}% ({mem.used // (1024**2)}MB/{mem.total // (1024**2)}MB)")
    print(f"[INFO] CPU usage: {psutil.cpu_percent(interval=1)}% (averaged over 1 second)")