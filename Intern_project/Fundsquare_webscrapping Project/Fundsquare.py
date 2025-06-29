# Fundsquare.py
import time # For time tracking
from selenium import webdriver # For web automation
from selenium.webdriver.common.by import By # For locating elements
from selenium.webdriver.common.action_chains import ActionChains # For performing actions like hover
from selenium.webdriver.chrome.service import Service # For managing the ChromeDriver service
from selenium.webdriver.support.ui import WebDriverWait # For waiting for elements to load and interact with them
from selenium.webdriver.support import expected_conditions as EC # For waiting for elements to load and interact with them
import pandas as pd # For reading Excel files
import os # For checking file existence
import logging
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
# Function to get Chrome options
def get_chrome_options(headless=True):
    options = webdriver.ChromeOptions()
    options.binary_location = chrome_binary_path
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-software-rasterizer")
    options.add_argument("--remote-debugging-port=9222")
    if headless:
        options.add_argument("--headless")
    return options

options = get_chrome_options(headless=True)

# driver = webdriver.Chrome(service=Service(chromedriver_path), options=options)
# The driver will be created and managed in the __main__ block.
if not os.path.exists(chromedriver_path):
    print(f"❌ Chromedriver not found at: {chromedriver_path}")
    exit(1)

driver = webdriver.Chrome(service=Service(chromedriver_path), options=options)

# XPATH dictionary for scraping
# WARNING: The XPATHs below are hardcoded and may break if the Fundsquare website structure changes.
# To make the script more robust, consider moving these XPATHs to a separate configuration file (e.g., JSON or YAML)
# and loading them at runtime. This allows easier updates if the site layout changes.
# Example for loading from a JSON file:
# import json
# with open('fundsquare_xpaths.json', 'r') as f:
#     XPATHS = json.load(f)
XPATHS = {
    "Fund name": '//*[@id="content"]/table[1]/tbody/tr/td[1]/span',  # XPATH for fund name
    "ISIN": '//*[@id="content"]/table[1]/tbody/tr/td[2]/span',  # XPATH for ISIN (updated to likely correct location)
    "Last NAV": '//*[@id="content"]/table[2]/tbody/tr/td[2]', # XPATH for Last NAV
    "Fund creation date": '//*[@id="blocresume"]/table/tbody/tr/td[1]/table/tbody/tr[1]/td/div[3]/table/tbody/tr[6]/td[2]', # XPATH for Fund creation date
    "Promoter(s)": '//*[@id="blocresume"]/table/tbody/tr/td[2]/table/tbody/tr[5]/td/div[3]/table/tbody/tr[1]/td[2]', # XPATH for Promoter(s)
    "Central administration": '//*[@id="blocresume"]/table/tbody/tr/td[2]/table/tbody/tr[5]/td/div[3]/table/tbody/tr[2]/td[2]' # XPATH for Central administration
}
# Function to log in to Fundsquare
def login(driver):
    """
    Logs into the Fundsquare website using the provided Selenium WebDriver instance.
    Navigates to the first URL in url_list, performs the login sequence, and waits for the login to complete.
    Exits the script if login fails.
    """
    wait = WebDriverWait(driver, 10)
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
def scrape_fund(driver, url):
    """
    Scrapes fund data from a given Fundsquare URL using the provided Selenium WebDriver instance.

    Args:
        driver (webdriver.Chrome): The Selenium WebDriver instance.
        url (str): The Fundsquare URL to scrape.

    Returns:
        dict or None: A dictionary containing scraped fund data if successful, otherwise None.
    """
    wait = WebDriverWait(driver, 10)
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
        # logging.info(f"Scraped data: {data}")  # Use logging if needed
        return data
    except Exception as e:
        logging.error(f"Error scraping {url}: {e}")
        return None
    fund_data = []
    try:
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
        try:
            driver.quit()
            print("✅ Driver closed successfully.")
        except Exception as quit_err:
            logging.error(f"Error closing driver: {quit_err}")
if __name__ == "__main__":
    # Sequential scraping using a single driver instance to avoid resource exhaustion
    options = webdriver.ChromeOptions()  # Ensure options is defined in this scope
if __name__ == "__main__":
    # Sequential scraping using a single driver instance to avoid resource exhaustion
    options = get_chrome_options(headless=False)  # Set headless as needed

    driver = webdriver.Chrome(service=Service(chromedriver_path), options=options)
    wait = WebDriverWait(driver, 10)
    fund_data = []
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

    if fund_data:
        df_out = pd.DataFrame(fund_data)
        df_out.to_csv("fundsquare_scraped_data.csv", index=False)
        print("✅ Data saved to fundsquare_scraped_data.csv")
    else:
        logging.warning("No data scraped. Nothing to save.")

    total_exec_time = time.time() - start_time
    print(f"⏱️ Total execution time: {total_exec_time:.2f} seconds")
    driver.quit()
    print("✅ Driver closed successfully.")
else:
    print("This script is intended to be run as a standalone program.")
    print("Please run it directly to execute the scraping process.")
