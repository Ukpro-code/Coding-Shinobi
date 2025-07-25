"""
Enhanced Service Provider Extraction System
Improved navigation and search page detection
"""

import time
import logging
import pandas as pd
import os
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import NoSuchElementException
from config import Config

class EnhancedServiceProviderExtractor:
    def __init__(self):
        self.config = Config()
        self.driver = None
        self.service_providers = {}
        self.page_screenshots = []
        self.setup_logging()
        
    def setup_logging(self):
        """Setup logging configuration"""
        os.makedirs(self.config.LOG_DIR, exist_ok=True)
        
        log_filename = f"{self.config.LOG_DIR}/enhanced_sp_extractor_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
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
            driver_path = os.path.join(os.getcwd(), "drivers", "chromedriver.exe")
            
            chrome_options = Options()
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            
            service = Service(driver_path)
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
            
            self.driver.get("https://www.fundsquare.net/homepage")
            time.sleep(3)
            
            # Take screenshot for debugging
            self.take_screenshot("after_homepage_load")
            
            # Hover over login area
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
            
            submit_button = self.driver.find_element(By.XPATH, '//input[@type="submit"]')
            submit_button.click()
            
            time.sleep(5)
            
            # Take screenshot after login
            self.take_screenshot("after_login")
            
            if "loginheader" not in self.driver.page_source:
                self.logger.info("Login successful!")
                return True
            else:
                self.logger.error("Login failed")
                return False
                
        except Exception as e:
            self.logger.error(f"Login failed: {str(e)}")
            return False
    
    def take_screenshot(self, name):
        """Take screenshot for debugging"""
        try:
            screenshot_path = f"debug_{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            self.driver.save_screenshot(screenshot_path)
            self.page_screenshots.append(screenshot_path)
            self.logger.info(f"Screenshot saved: {screenshot_path}")
        except Exception as e:
            self.logger.error(f"Failed to take screenshot: {str(e)}")
    
    def explore_site_navigation(self):
        """Explore the site to find search functionality"""
        try:
            self.logger.info("Exploring site navigation...")
            
            # Get current URL
            current_url = self.driver.current_url
            self.logger.info(f"Current URL: {current_url}")
            
            # Look for navigation elements
            nav_elements = []
            
            # Try different navigation selectors
            nav_selectors = [
                "nav a",
                ".menu a", 
                ".navigation a",
                "header a",
                ".nav a",
                ".navbar a",
                "ul li a",
                "[role='navigation'] a"
            ]
            
            for selector in nav_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        text = element.text.strip()
                        href = element.get_attribute('href')
                        if text and href:
                            nav_elements.append({'text': text, 'href': href, 'selector': selector})
                except Exception:
                    continue
            
            self.logger.info(f"Found {len(nav_elements)} navigation elements")
            
            # Look for search-related links
            search_keywords = ['search', 'find', 'lookup', 'query', 'advanced', 'filter']
            search_links = []
            
            for element in nav_elements:
                text_lower = element['text'].lower()
                if any(keyword in text_lower for keyword in search_keywords):
                    search_links.append(element)
                    self.logger.info(f"Found search-related link: {element['text']} -> {element['href']}")
            
            return search_links
            
        except Exception as e:
            self.logger.error(f"Failed to explore navigation: {str(e)}")
            return []
    
    def try_direct_search_urls(self):
        """Try common search URL patterns"""
        search_urls = [
            "https://www.fundsquare.net/search",
            "https://www.fundsquare.net/advanced-search",
            "https://www.fundsquare.net/fund-search",
            "https://www.fundsquare.net/find",
            "https://www.fundsquare.net/securities/search",
            "https://www.fundsquare.net/security/search"
        ]
        
        for url in search_urls:
            try:
                self.logger.info(f"Trying direct URL: {url}")
                self.driver.get(url)
                time.sleep(3)
                
                # Check if page has select elements
                select_elements = self.driver.find_elements(By.TAG_NAME, "select")
                if select_elements:
                    self.logger.info(f"Found {len(select_elements)} select elements at {url}")
                    self.take_screenshot(f"search_page_{url.split('/')[-1]}")
                    return True
                    
            except Exception as e:
                self.logger.warning(f"Failed to load {url}: {str(e)}")
                continue
        
        return False
    
    def find_search_interface(self):
        """Comprehensive search for the search interface"""
        try:
            self.logger.info("Starting comprehensive search for search interface...")
            
            # Method 1: Explore current page navigation
            search_links = self.explore_site_navigation()
            
            # Method 2: Try clicking on search-related links
            for link in search_links[:3]:  # Try first 3 search links
                try:
                    self.logger.info(f"Trying to navigate to: {link['text']} -> {link['href']}")
                    self.driver.get(link['href'])
                    time.sleep(3)
                    
                    select_elements = self.driver.find_elements(By.TAG_NAME, "select")
                    if select_elements:
                        self.logger.info(f"Found search interface with {len(select_elements)} dropdowns")
                        self.take_screenshot("found_search_interface")
                        return True
                        
                except Exception as e:
                    self.logger.warning(f"Failed to navigate to {link['href']}: {str(e)}")
                    continue
            
            # Method 3: Try direct search URLs
            if self.try_direct_search_urls():
                return True
            
            # Method 4: Look for search forms on current page
            search_forms = self.driver.find_elements(By.CSS_SELECTOR, "form")
            for form in search_forms:
                select_elements = form.find_elements(By.TAG_NAME, "select")
                if select_elements:
                    self.logger.info(f"Found form with {len(select_elements)} select elements")
                    self.take_screenshot("found_search_form")
                    return True
            
            self.logger.warning("Could not find search interface")
            return False
            
        except Exception as e:
            self.logger.error(f"Failed to find search interface: {str(e)}")
            return False
    
    def analyze_page_content(self):
        """Analyze current page content for debugging"""
        try:
            self.logger.info("Analyzing current page content...")
            
            # Get page title
            title = self.driver.title
            self.logger.info(f"Page title: {title}")
            
            # Get current URL
            url = self.driver.current_url
            self.logger.info(f"Current URL: {url}")
            
            # Count different element types
            forms = len(self.driver.find_elements(By.TAG_NAME, "form"))
            inputs = len(self.driver.find_elements(By.TAG_NAME, "input"))
            selects = len(self.driver.find_elements(By.TAG_NAME, "select"))
            links = len(self.driver.find_elements(By.TAG_NAME, "a"))
            
            self.logger.info(f"Page elements: {forms} forms, {inputs} inputs, {selects} selects, {links} links")
            
            # Look for specific text content
            page_text = self.driver.page_source.lower()
            search_indicators = ['search', 'filter', 'find', 'advanced', 'criteria']
            
            found_indicators = []
            for indicator in search_indicators:
                if indicator in page_text:
                    found_indicators.append(indicator)
            
            self.logger.info(f"Search indicators found: {found_indicators}")
            
            return {
                'title': title,
                'url': url,
                'forms': forms,
                'inputs': inputs,
                'selects': selects,
                'links': links,
                'search_indicators': found_indicators
            }
            
        except Exception as e:
            self.logger.error(f"Failed to analyze page content: {str(e)}")
            return {}
    
    def extract_available_dropdowns(self):
        """Extract all available dropdown menus on current page"""
        try:
            self.logger.info("Extracting all available dropdown menus...")
            
            select_elements = self.driver.find_elements(By.TAG_NAME, "select")
            
            if not select_elements:
                self.logger.warning("No select elements found on current page")
                return False
            
            self.logger.info(f"Found {len(select_elements)} select elements")
            
            for i, select_element in enumerate(select_elements):
                try:
                    # Get basic info about the select
                    select_id = select_element.get_attribute('id') or f"select_{i}"
                    select_name = select_element.get_attribute('name') or f"name_{i}"
                    
                    # Try to find label
                    label = self.get_select_label(select_element, i)
                    
                    # Get options
                    select_obj = Select(select_element)
                    options = []
                    
                    for option in select_obj.options:
                        option_value = option.get_attribute('value')
                        option_text = option.text.strip()
                        
                        if option_value and option_text:
                            options.append({
                                'value': option_value,
                                'text': option_text
                            })
                    
                    if options:
                        dropdown_info = {
                            'id': select_id,
                            'name': select_name,
                            'label': label,
                            'options': options
                        }
                        
                        self.service_providers[label] = options
                        
                        self.logger.info(f"Dropdown {i+1}: {label} ({len(options)} options)")
                        
                        # Log first few options as sample
                        sample_options = options[:3]
                        for opt in sample_options:
                            self.logger.info(f"  Sample option: {opt['value']} -> {opt['text']}")
                        
                        if len(options) > 3:
                            self.logger.info(f"  ... and {len(options) - 3} more options")
                    
                except Exception as e:
                    self.logger.error(f"Failed to extract dropdown {i}: {str(e)}")
                    continue
            
            return len(self.service_providers) > 0
            
        except Exception as e:
            self.logger.error(f"Failed to extract dropdowns: {str(e)}")
            return False
    
    def get_select_label(self, select_element, index):
        """Get a meaningful label for a select element"""
        try:
            # Method 1: Look for associated label
            select_id = select_element.get_attribute('id')
            if select_id:
                try:
                    label_element = self.driver.find_element(By.XPATH, f"//label[@for='{select_id}']")
                    return label_element.text.strip()
                except NoSuchElementException:
                    pass
            
            # Method 2: Use name attribute
            name = select_element.get_attribute('name')
            if name:
                return name.replace('_', ' ').replace('-', ' ').title()
            
            # Method 3: Use id attribute
            if select_id:
                return select_id.replace('_', ' ').replace('-', ' ').title()
            
            # Method 4: Look for nearby text
            try:
                parent = select_element.find_element(By.XPATH, "./..")
                parent_text = parent.text.strip()
                if parent_text and len(parent_text) < 100:
                    return parent_text[:50]
            except Exception:
                pass
            
            # Fallback
            return f"Dropdown_{index + 1}"
            
        except Exception:
            return f"Unknown_Dropdown_{index + 1}"
    
    def save_results(self):
        """Save extraction results"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            if self.service_providers:
                # Save as CSV
                csv_data = []
                for category, options in self.service_providers.items():
                    for option in options:
                        csv_data.append({
                            'Category': category,
                            'Value': option['value'],
                            'Text': option['text']
                        })
                
                df = pd.DataFrame(csv_data)
                csv_filename = f"{self.config.OUTPUT_DIR}/service_providers_{timestamp}.csv"
                df.to_csv(csv_filename, index=False, encoding='utf-8')
                
                # Also save as master reference
                master_filename = f"{self.config.OUTPUT_DIR}/service_providers_master.csv"
                df.to_csv(master_filename, index=False, encoding='utf-8')
                
                self.logger.info(f"Service providers saved to {csv_filename} and {master_filename}")
                
                print(f"\n✅ Service Provider Extraction Results:")
                print(f"📁 Categories found: {len(self.service_providers)}")
                print(f"📊 Total options: {len(csv_data)}")
                print(f"💾 Saved to: {csv_filename}")
                
                return True
            else:
                self.logger.warning("No service providers found to save")
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to save results: {str(e)}")
            return False
    
    def run_enhanced_extraction(self):
        """Run the enhanced extraction process"""
        try:
            print("🔍 Enhanced Service Provider Extraction")
            print("=" * 50)
            
            # Setup
            if not self.setup_driver():
                return False
            
            # Login
            if not self.login():
                return False
            
            # Analyze current page
            page_info = self.analyze_page_content()
            print(f"\n📄 Current Page Analysis:")
            print(f"   Title: {page_info.get('title', 'Unknown')}")
            print(f"   Forms: {page_info.get('forms', 0)}")
            print(f"   Select elements: {page_info.get('selects', 0)}")
            
            # Try to find search interface
            if page_info.get('selects', 0) == 0:
                print("\n🔍 No dropdowns found, searching for search interface...")
                if self.find_search_interface():
                    print("✅ Found search interface!")
                else:
                    print("❌ Could not find search interface")
                    print("\n📸 Screenshots taken for debugging:")
                    for screenshot in self.page_screenshots:
                        print(f"   📷 {screenshot}")
                    return False
            
            # Extract dropdowns
            print("\n📋 Extracting dropdown menus...")
            if self.extract_available_dropdowns():
                print("✅ Dropdown extraction successful!")
                
                # Save results
                if self.save_results():
                    print("✅ Results saved successfully!")
                    return True
                else:
                    print("❌ Failed to save results")
                    return False
            else:
                print("❌ No dropdowns found or extracted")
                return False
                
        except Exception as e:
            self.logger.error(f"Enhanced extraction failed: {str(e)}")
            print(f"❌ Extraction failed: {str(e)}")
            return False
        finally:
            if self.driver:
                self.driver.quit()
            
            # Clean up screenshots
            print(f"\n🧹 Cleaning up {len(self.page_screenshots)} debug screenshots...")
            for screenshot in self.page_screenshots:
                try:
                    if os.path.exists(screenshot):
                        os.remove(screenshot)
                except Exception:
                    pass

if __name__ == "__main__":
    print("🔍 Enhanced Service Provider Extraction System")
    print("=" * 55)
    
    extractor = EnhancedServiceProviderExtractor()
    
    print("\nThis enhanced system will:")
    print("• Navigate through FundSquare to find search interface")
    print("• Take screenshots for debugging")
    print("• Analyze page content to locate dropdowns")
    print("• Extract all available service provider options")
    print("• Save results for use in discovery strategies")
    
    confirm = input("\nProceed with enhanced extraction? (y/N): ").strip().lower()
    
    if confirm == 'y':
        success = extractor.run_enhanced_extraction()
        if success:
            print("\n🎉 Enhanced extraction completed successfully!")
        else:
            print("\n❌ Enhanced extraction failed!")
    else:
        print("❌ Extraction cancelled.")
