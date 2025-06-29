from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.service import Service
import time
from bs4 import BeautifulSoup
import pandas as pd

username = "ukprowork"
password = "5b-G5s.*s4hPqEn"

chrome_binary_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"  # Update this path if Chrome is installed elsewhere
chromedriver_path = r"D:\Ukesh\Coding Shinobi\Coding-Shinobi\Intern_project\Fundsquare_webscrapping Project\chromedriver.exe" # Update this path to your chromedriver.exe

# Read URLs from Excel file (assume the file is named 'urls.xlsx' and URLs are in a column named 'url')
excel_path = r"D:\Ukesh\Coding Shinobi\Coding-Shinobi\Intern_project\Fundsquare_webscrapping Project\Fundsquare first test.xlsx"
df = pd.read_excel(excel_path)
urls = df['url'].tolist()

options = webdriver.ChromeOptions()
options.binary_location = chrome_binary_path
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-gpu")
# ✅ Launch Chrome with correct paths
driver = webdriver.Chrome(service=Service(chromedriver_path), options=options)

try:
    # Login ONCE before scraping all URLs
    driver.get(urls[0])
    time.sleep(3)

    # Hover login
    login_hover_target = driver.find_element(By.XPATH, '/html/body/div[2]/div[2]/div/ul/li[1]/div/a/span')
    ActionChains(driver).move_to_element(login_hover_target).perform()
    time.sleep(1.5)

    driver.find_element(By.NAME, "loginheader").send_keys(username)
    driver.find_element(By.NAME, "passwordheader").send_keys(password)
    driver.find_element(By.XPATH, '//input[@type="submit"]').click()
    time.sleep(3)

    # Now scrape each URL (already logged in)
    for idx, url in enumerate(urls):
        driver.get(url)
        time.sleep(2)
        filename = f"fundsquare_loggedin_{idx}.html"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        print(f"✅ Scraped and saved HTML for {url} as {filename}.")

except Exception as e:
    print(f"❌ Error occurred: {e}")

finally:
    driver.quit()