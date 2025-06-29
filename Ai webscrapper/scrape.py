import selenium.webdriver as webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import time

def scrape_website(website_url):
    print("Launching web browser...")

    # Set up the Chrome driver service
    # Update the path to the ChromeDriver executable as needed.
    chrome_driver_path = r"D:\Ukesh\Coding Shinobi\Coding-Shinobi\Ai webscrapper\chromedriver.exe"
    # Otherwise, provide the absolute path, e.g.:
    # chrome_driver_path = r"D:\Ukesh\Coding Shinobi\Coding-Shinobi\Ai webscrapper\chromedriver.exe"
    options = Options()
    driver = webdriver.Chrome(service=Service(chrome_driver_path), options=options)
    driver = webdriver.Chrome(service=Service(chrome_driver_path), options=options)

    try:
        driver.get(website_url)
        print("Page loaded..")
        html = driver.page_source
        time.sleep(2)  # Wait for the page to load completely
        print("HTML content retrieved.")
        return html
    finally:
        driver.quit()
        print("Web browser closed.")