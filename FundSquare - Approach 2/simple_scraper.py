"""
Simple working FundSquare scraper
"""

import time
import logging
import pandas as pd
import os
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.service import Service
from bs4 import BeautifulSoup
from config import Config

class SimpleFundSquareScraper:
    def __init__(self):
        self.config = Config()
        self.driver = None
        self.funds_data = []
        self.setup_logging()
        
    def setup_logging(self):
        """Setup logging configuration"""
        os.makedirs(self.config.LOG_DIR, exist_ok=True)
        
        log_filename = f"{self.config.LOG_DIR}/simple_scraper_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_filename),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def setup_driver(self):
        """Setup Chrome WebDriver"""
        try:
            # Use existing chromedriver
            driver_path = os.path.join(os.getcwd(), "drivers", "chromedriver.exe")
            
            chrome_options = Options()
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            
            # Setup service
            service = Service(driver_path)
            
            # Initialize driver
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.implicitly_wait(10)
            self.driver.set_page_load_timeout(30)
            
            self.logger.info("Chrome WebDriver setup completed successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to setup WebDriver: {str(e)}")
            return False
    
    def login(self):
        """Login to FundSquare website"""
        try:
            self.logger.info("Attempting to login to FundSquare...")
            
            # Navigate to homepage
            self.driver.get("https://www.fundsquare.net/homepage")
            time.sleep(3)
            
            # Hover over login element
            xpath = '/html/body/div[2]/div[2]/div/ul/li[1]/div/a/span'
            login_hover_target = WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )
            ActionChains(self.driver).move_to_element(login_hover_target).perform()
            time.sleep(2)
            
            # Enter credentials
            username_field = WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.NAME, "loginheader"))
            )
            username_field.send_keys(self.config.USERNAME)
            
            password_field = self.driver.find_element(By.NAME, "passwordheader")
            password_field.send_keys(self.config.PASSWORD)
            
            # Submit
            submit_button = self.driver.find_element(By.XPATH, '//input[@type="submit"]')
            submit_button.click()
            
            # Wait for login to complete
            time.sleep(5)
            
            # Check success
            if "loginheader" not in self.driver.page_source:
                self.logger.info("Login successful!")
                return True
            else:
                self.logger.error("Login failed")
                return False
                
        except Exception as e:
            self.logger.error(f"Login failed: {str(e)}")
            return False
    
    def scrape_fund_url(self, fund_url):
        """Scrape a single fund URL"""
        try:
            self.logger.info(f"Scraping: {fund_url}")
            
            # Navigate to fund page
            self.driver.get(fund_url)
            time.sleep(3)
            
            # Check if logged out
            if "loginheader" in self.driver.page_source:
                self.logger.warning(f"Logged out, skipping {fund_url}")
                return None
            
            # Parse page
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # Extract data using FS.py methods
            fund_data = {
                'url': fund_url,
                'scraped_at': datetime.now().isoformat()
            }
            
            # Extract ISIN and Fund Name
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
            
            fund_data['isin'] = isin
            fund_data['fund_name'] = fund_name
            fund_data['central_administration'] = self.extract_table_value(soup, "central administration")
            fund_data['auditor'] = self.extract_table_value(soup, "auditor")
            fund_data['custodian'] = self.extract_table_value(soup, "custodian")
            fund_data['depositary'] = self.extract_table_value(soup, "depositary")
            fund_data['prime_broker'] = self.extract_table_value(soup, "prime broker")
            fund_data['marketer_promoter'] = self.extract_table_value(soup, "promoter(s)")
            fund_data['transfer_agent'] = self.extract_table_value(soup, "transfer agent")
            fund_data['legal_advisor'] = self.extract_table_value(soup, "legal advisor")
            fund_data['fund_creation_date'] = self.extract_table_value(soup, "fund creation date")
            fund_data['last_nav'] = self.extract_table_value(soup, "last nav")
            
            return fund_data
            
        except Exception as e:
            self.logger.error(f"Failed to scrape {fund_url}: {str(e)}")
            return None
    
    def extract_table_value(self, soup, field_name):
        """Extract value from table structure"""
        try:
            for tr in soup.find_all('tr'):
                tds = tr.find_all('td')
                if len(tds) >= 2 and field_name.lower() == tds[0].get_text(strip=True).lower():
                    div = tds[1].find('div')
                    if div:
                        value = div.get_text(strip=True)
                    else:
                        value = tds[1].get_text(strip=True)
                    
                    if "unavailable" in value.lower():
                        return "-"
                    return value
            return "-"
        except Exception:
            return "-"
    
    def run_test_scrape(self, urls_to_test):
        """Run a test scrape on a few URLs"""
        try:
            if not self.setup_driver():
                return False
            
            if not self.login():
                return False
            
            print(f"\nTesting scraping on {len(urls_to_test)} URLs...")
            
            for i, url in enumerate(urls_to_test, 1):
                print(f"Processing {i}/{len(urls_to_test)}: {url}")
                
                fund_data = self.scrape_fund_url(url)
                if fund_data:
                    self.funds_data.append(fund_data)
                    print(f"✓ Scraped: {fund_data.get('fund_name', 'Unknown')}")
                else:
                    print("✗ Failed to scrape")
                
                time.sleep(2)  # Be respectful
            
            # Save results
            if self.funds_data:
                df = pd.DataFrame(self.funds_data)
                filename = f"test_scrape_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
                df.to_excel(filename, index=False)
                print(f"\n✓ Results saved to {filename}")
                print(f"Total funds scraped: {len(self.funds_data)}")
                
                # Display sample data
                print("\nSample data:")
                for i, fund in enumerate(self.funds_data[:3]):
                    print(f"{i+1}. {fund.get('fund_name', 'N/A')} - ISIN: {fund.get('isin', 'N/A')}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Test scrape failed: {str(e)}")
            return False
        finally:
            if self.driver:
                self.driver.quit()

def main():
    """Main function to test the scraper"""
    print("=" * 60)
    print("FundSquare Simple Scraper - Test Run")
    print("=" * 60)
    
    scraper = SimpleFundSquareScraper()
    
    # First, let's just test login and basic functionality
    if scraper.setup_driver():
        print("✓ Driver setup successful")
        
        if scraper.login():
            print("✓ Login successful")
            print("\n🎉 Scraper is ready to use!")
            print("\nTo use this scraper:")
            print("1. Add actual fund URLs to the test_urls list")
            print("2. Run scraper.run_test_scrape(test_urls)")
            print("3. Results will be saved to Excel file")
        else:
            print("✗ Login failed")
        
        if scraper.driver:
            scraper.driver.quit()
    else:
        print("✗ Driver setup failed")

if __name__ == "__main__":
    main()
