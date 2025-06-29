import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pandas as pd
import os

start_time = time.time()  # <-- Move this here, right after imports

username = "ukprowork"
password = "5b-G5s.*s4hPqEn"

chrome_binary_path = "C:/Program Files/Google/Chrome/Application/chrome.exe"
chromedriver_path = r"D:\Ukesh\Coding Shinobi\Coding-Shinobi\Intern_project\Fundsquare_webscrapping Project\chromedriver.exe"
excel_path = r"D:\Ukesh\Coding Shinobi\Coding-Shinobi\Intern_project\Fundsquare_webscrapping Project\Fundsquare first test.xlsx"

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

options = webdriver.ChromeOptions()
options.binary_location = chrome_binary_path
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-gpu")
options.add_argument("--disable-software-rasterizer")
options.add_argument("--remote-debugging-port=9222")
# options.add_argument("--headless=new")  # Uncomment to run headless

if not os.path.exists(chromedriver_path):
    print(f"❌ Chromedriver not found at: {chromedriver_path}")
    exit(1)

driver = webdriver.Chrome(service=Service(chromedriver_path), options=options)
wait = WebDriverWait(driver, 10)

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
    XPATHS = {
        "Fund name": 'XPATH_FOR_FUND_NAME',
        "Last NAV": 'XPATH_FOR_LAST_NAV',
        "Fund creation date": 'XPATH_FOR_CREATION_DATE',
        "Promoter(s)": 'XPATH_FOR_PROMOTERS',
        "Central administration": 'XPATH_FOR_CENTRAL_ADMIN',
        "Management company": 'XPATH_FOR_MANAGEMENT_COMPANY',
        "Transfer agent": 'XPATH_FOR_TRANSFER_AGENT',
        "Custodian": 'XPATH_FOR_CUSTODIAN',
        "Auditor": 'XPATH_FOR_AUDITOR',
        "Legal advisor": 'XPATH_FOR_LEGAL_ADVISOR'
    }
    data = {"URL": url}
    driver.get(url)
    try:
        for key, xpath in XPATHS.items():
            try:
                data[key] = wait.until(EC.presence_of_element_located((By.XPATH, xpath))).text
            except Exception:
                data[key] = ""
        return data
    except Exception as e:
        print(f"❌ Error scraping {url}: {e}")
        return None

try:
    if url_list:
        login(driver)
        fund_data = []
        for url in url_list:
            url_start = time.time()
            data = scrape_fund(driver, url)
            if data:
                data["Exec_time"] = round(time.time() - url_start, 2)
                fund_data.append(data)
                print(f"✅ Scraped data for: {data.get('Fund name', url)} (Exec_time: {data['Exec_time']}s)")
    else:
        print("❌ url_list is empty. Please check the Excel file and column name.")

    if fund_data:
        df_out = pd.DataFrame(fund_data)
        df_out.to_excel("fundsquare_scraped_data.xlsx", index=False)
        df_out.to_csv("fundsquare_scraped_data.csv", index=False)
        print("✅ Data saved to fundsquare_scraped_data.xlsx and fundsquare_scraped_data.csv")

except Exception as e:
    print(f"❌ Error occurred: {e}")

finally:
    driver.quit()
    total_exec_time = time.time() - start_time
    print(f"⏱️ Total execution time: {total_exec_time:.2f} seconds")
