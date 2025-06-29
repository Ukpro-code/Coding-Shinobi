import time # For time tracking
from selenium import webdriver # For web automation
from selenium.webdriver.common.by import By # For locating elements
from selenium.webdriver.common.action_chains import ActionChains # For performing actions like hover
from selenium.webdriver.chrome.service import Service # For managing the ChromeDriver service
from selenium.webdriver.support.ui import WebDriverWait # For waiting for elements to load and interact with them
from selenium.webdriver.support import expected_conditions as EC # For waiting for elements to load and interact with them
import pandas as pd # For reading Excel files
import os # For checking file existence
from multiprocessing import Pool

start_time = time.time()  # Track total execution time

username = os.environ.get("FUNDSQUARE_USERNAME") # Your username for Fundsquare (set as environment variable)
password = os.environ.get("FUNDSQUARE_PASSWORD") # Your password for Fundsquare (set as environment variable)

if not username or not password:
    print("❌ Username or password environment variables not set. Please set FUNDSQUARE_USERNAME and FUNDSQUARE_PASSWORD.")
    exit(1)

#Set paths for Chrome binary, Chromedriver, and Excel file
# Update these paths according to your system
chrome_binary_path = "C:/Program Files/Google/Chrome/Application/chrome.exe" # Path to Chrome binary
chromedriver_path = r"D:\Ukesh\Coding Shinobi\Coding-Shinobi\Intern_project\Fundsquare_webscrapping Project\chromedriver.exe" # Path to Chromedriver executable
excel_path = r"D:\Ukesh\Coding Shinobi\Coding-Shinobi\Intern_project\Fundsquare_webscrapping Project\Fundsquare first test.xlsx" # Path to the Excel file containing URLs

if not os.path.exists(excel_path):
    print(f"❌ Excel file not found at: {excel_path}")
    exit(1)

try:
    df = pd.read_excel(excel_path)
    if "Fundsquare_URL" not in df.columns:
        print("❌ Column 'Fundsquare_URL' not found in Excel file.")
        print(f"Available columns: {df.columns.tolist()}")
        exit(1)
    url_list = df['Fundsquare_URL'].dropna().tolist()
    print(f"Loaded {len(url_list)} URLs from Excel.")
except Exception as e:
    print(f"❌ Error reading Excel file: {e}")
    exit(1)
# Set up Chrome options
options = webdriver.ChromeOptions() # Configure Chrome options
options.binary_location = chrome_binary_path # Set the path to the Chrome binary
options.add_argument("--no-sandbox") # Bypass OS security model
options.add_argument("--disable-dev-shm-usage") # Overcome limited resource problems
options.add_argument("--disable-gpu") # Disable GPU hardware acceleration
options.add_argument("--disable-software-rasterizer") # Disable software rasterizer
options.add_argument("--remote-debugging-port=9222") # Enable remote debugging
# options.add_argument("--headless")  # Run Chrome in headless mode (no GUI)

# Check if Chromedriver exists
if not os.path.exists(chromedriver_path):
    print(f"❌ Chromedriver not found at: {chromedriver_path}")
    exit(1)

driver = webdriver.Chrome(service=Service(chromedriver_path), options=options)
wait = WebDriverWait(driver, 10)

# XPATH dictionary for scraping
XPATHS = {
    "Fund name": '//*[@id="content"]/table[1]/tbody/tr/td[1]/span',  # XPATH for fund name
    "ISIN": '//*[@id="content"]/table[1]/tbody/tr/td[2]/span',  # XPATH for ISIN (updated to likely correct location)
    "Last NAV": '//*[@id="content"]/table[2]/tbody/tr/td[2]', # XPATH for Last NAV
    "Fund creation date": '//*[@id="blocresume"]/table/tbody/tr/td[1]/table/tbody/tr[1]/td/div[3]/table/tbody/tr[6]/td[2]', # XPATH for Fund creation date
    "Promoter(s)": '//*[@id="blocresume"]/table/tbody/tr/td[2]/table/tbody/tr[5]/td/div[3]/table/tbody/tr[1]/td[2]', # XPATH for Promoter(s)
    "Central administration": '//*[@id="blocresume"]/table/tbody/tr/td[2]/table/tbody/tr[5]/td/div[3]/table/tbody/tr[2]/td[2]', # XPATH for Central administration
    "Management company": '//*[@id="blocresume"]/table/tbody/tr/td[2]/table/tbody/tr[5]/td/div[3]/table/tbody/tr[7]/td[2]', # XPATH for Management company
    "Transfer agent": '//*[@id="blocresume"]/table/tbody/tr/td[2]/table/tbody/tr[5]/td/div[3]/table/tbody/tr[10]/td[2]/div', # XPATH for Transfer agent
    "Custodian": '//*[@id="blocresume"]/table/tbody/tr/td[2]/table/tbody/tr[5]/td/div[3]/table/tbody/tr[12]/td[2]', # XPATH for Custodian
    "Auditor": '//*[@id="blocresume"]/table/tbody/tr/td[2]/table/tbody/tr[5]/td/div[3]/table/tbody/tr[15]/td[2]', # XPATH for Auditor
    "Legal advisor": '//*[@id="blocresume"]/table/tbody/tr/td[2]/table/tbody/tr[5]/td/div[3]/table/tbody/tr[16]/td[2]', # XPATH for Legal advisor
}

import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s:%(message)s')

# Function to log in to Fundsquare
def login(driver):
    driver.get(url_list[0])
    try:
        login_hover_target = wait.until(EC.presence_of_element_located((By.XPATH, '/html/body/div[2]/div[2]/div/ul/li[1]/div/a/span')))
        ActionChains(driver).move_to_element(login_hover_target).perform()
        wait.until(EC.visibility_of_element_located((By.NAME, "loginheader"))).send_keys(username)
        driver.find_element(By.NAME, "passwordheader").send_keys(password)
        driver.find_element(By.XPATH, '//input[@type="submit"]').click()
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))  # Wait for login to complete
        print("✅ Login successful!")
    except Exception as e:
        print(f"❌ Login failed: {e}")
        driver.quit()
        exit(1)

def scrape_fund(driver, url):
    data = {"URL": url}
    driver.get(url)
    try:
        # Wait for a key element that indicates the page is loaded (e.g., Fund name)
        wait.until(EC.presence_of_element_located((By.XPATH, XPATHS["Fund name"])))
        for key, xpath in XPATHS.items():
            try:
                element = driver.find_element(By.XPATH, xpath)
                data[key] = element.text
            except Exception as e:
                logging.warning(f"Could not find {key} at {url}: {e}")
                data[key] = ""
        # logging.info(f"Scraped data: {data}")  # Use logging if needed
        return data
    except Exception as e:
        logging.error(f"Error scraping {url}: {e}")
        return None

def scrape_fund_wrapper(url):
    # Set up Chrome options
    options = webdriver.ChromeOptions() # Configure Chrome options
    options.binary_location = chrome_binary_path # Set the path to the Chrome binary
    options.add_argument("--no-sandbox") # Bypass OS security model
    options.add_argument("--disable-dev-shm-usage") # Overcome limited resource problems
    options.add_argument("--disable-gpu") # Disable GPU hardware acceleration
    options.add_argument("--disable-software-rasterizer") # Disable software rasterizer
    options.add_argument("--remote-debugging-port=9222") # Enable remote debugging
    options.add_argument("--headless")  # Run Chrome in headless mode (no GUI)

    driver = webdriver.Chrome(service=Service(chromedriver_path), options=options)
    wait = WebDriverWait(driver, 10)
    data = scrape_fund(driver, url)
    driver.quit()
    return data

# Main scraping workflow
try:
    fund_data = []
    if url_list:
        login(driver)  # Perform login before scraping
        for url in url_list:
            url_start = time.time()
            data = scrape_fund(driver, url)
            if data:
                data["Exec_time"] = round(time.time() - url_start, 2)
                fund_data.append(data)
                logging.info(f"Scraped data for: {data.get('Fund name', url)} (Exec_time: {data['Exec_time']}s)")
            else:
                logging.warning(f"Failed to scrape data for: {url}")
    else:
        logging.error("url_list is empty. Please check the Excel file and column name.")

    if fund_data:
        df_out = pd.DataFrame(fund_data)
        df_out.to_csv("fundsquare_scraped_data.csv", index=False)
        print("✅ Data saved to fundsquare_scraped_data.csv")
    else:
        logging.warning("No data scraped. Nothing to save.")

except Exception as main_err:
    logging.error(f"Error in main scraping workflow: {main_err}")

finally:
    try:
        if 'driver' in locals() and driver is not None:
            driver.quit()
    except Exception as quit_err:
        logging.error(f"Error closing driver: {quit_err}")
    total_exec_time = time.time() - start_time
    print(f"⏱️ Total execution time: {total_exec_time:.2f} seconds")

if __name__ == "__main__":
    with Pool(processes=4) as pool:  # Adjust number of processes as needed
        results = pool.map(scrape_fund_wrapper, url_list)
    df = pd.DataFrame(results)
    df.to_csv("fundsquare_scraped_data.csv", index=False)
