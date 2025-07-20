"""
Service Provider Extraction and Discovery System
Comprehensive solution for extracting service providers and discovering funds
"""

import time
import logging
import pandas as pd
import os
import json
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

class ServiceProviderExtractor:
    def __init__(self):
        self.config = Config()
        self.driver = None
        self.service_providers = {}
        self.extraction_results = {}
        self.setup_logging()
        
    def setup_logging(self):
        """Setup logging configuration"""
        os.makedirs(self.config.LOG_DIR, exist_ok=True)
        
        log_filename = f"{self.config.LOG_DIR}/sp_extractor_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
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
            
            if "loginheader" not in self.driver.page_source:
                self.logger.info("Login successful!")
                return True
            else:
                self.logger.error("Login failed")
                return False
                
        except Exception as e:
            self.logger.error(f"Login failed: {str(e)}")
            return False
    
    def navigate_to_advanced_search(self):
        """Navigate to advanced search page"""
        try:
            # Look for advanced search link
            search_patterns = [
                "//a[contains(text(), 'Advanced Search')]",
                "//a[contains(text(), 'advanced search')]", 
                "//a[contains(text(), 'Search')]",
                "//a[contains(@href, 'search')]",
                "//a[contains(@href, 'advanced')]"
            ]
            
            for pattern in search_patterns:
                try:
                    search_link = self.driver.find_element(By.XPATH, pattern)
                    search_link.click()
                    time.sleep(3)
                    self.logger.info(f"Navigated to advanced search using pattern: {pattern}")
                    return True
                except NoSuchElementException:
                    continue
            
            # If no direct link found, try to find search page through navigation
            self.logger.info("Searching for advanced search page through navigation...")
            
            # Look for navigation menus
            nav_elements = self.driver.find_elements(By.CSS_SELECTOR, "nav a, .menu a, .navigation a, header a")
            
            for element in nav_elements:
                try:
                    text = element.text.lower()
                    if any(word in text for word in ['search', 'find', 'lookup', 'query']):
                        element.click()
                        time.sleep(3)
                        self.logger.info(f"Found search page via navigation: {text}")
                        return True
                except Exception:
                    continue
            
            self.logger.warning("Could not find advanced search page")
            return False
            
        except Exception as e:
            self.logger.error(f"Failed to navigate to advanced search: {str(e)}")
            return False
    
    def extract_dropdown_options_js(self, select_element):
        """Extract dropdown options using JavaScript"""
        try:
            options = self.driver.execute_script("""
                var select = arguments[0];
                var options = [];
                for (var i = 0; i < select.options.length; i++) {
                    options.push({
                        value: select.options[i].value,
                        text: select.options[i].text
                    });
                }
                return options;
            """, select_element)
            return options
        except Exception as e:
            self.logger.error(f"JS extraction failed: {str(e)}")
            return []
    
    def extract_dropdown_options_html(self, select_element):
        """Extract dropdown options using HTML parsing"""
        try:
            select_obj = Select(select_element)
            options = []
            for option in select_obj.options:
                options.append({
                    'value': option.get_attribute('value'),
                    'text': option.text
                })
            return options
        except Exception as e:
            self.logger.error(f"HTML extraction failed: {str(e)}")
            return []
    
    def extract_service_providers_from_dropdowns(self):
        """Extract all service providers from dropdown menus"""
        try:
            self.logger.info("Starting service provider extraction from dropdowns...")
            
            # Look for all select elements on the page
            select_elements = self.driver.find_elements(By.TAG_NAME, "select")
            
            if not select_elements:
                self.logger.warning("No select elements found on page")
                return False
            
            self.logger.info(f"Found {len(select_elements)} select elements")
            
            for i, select_element in enumerate(select_elements):
                try:
                    # Get the select element's label or nearby text
                    label = self.get_select_label(select_element)
                    
                    self.logger.info(f"Processing dropdown {i+1}: {label}")
                    
                    # Try both extraction methods
                    js_options = self.extract_dropdown_options_js(select_element)
                    html_options = self.extract_dropdown_options_html(select_element)
                    
                    # Use the method that returns more options
                    options = js_options if len(js_options) > len(html_options) else html_options
                    
                    if options:
                        # Filter out empty options
                        filtered_options = [opt for opt in options if opt['value'] and opt['text'].strip()]
                        
                        if filtered_options:
                            self.service_providers[label] = filtered_options
                            self.logger.info(f"Extracted {len(filtered_options)} options from {label}")
                        
                except Exception as e:
                    self.logger.error(f"Failed to extract from dropdown {i+1}: {str(e)}")
                    continue
            
            self.logger.info(f"Total service provider categories extracted: {len(self.service_providers)}")
            return len(self.service_providers) > 0
            
        except Exception as e:
            self.logger.error(f"Failed to extract service providers: {str(e)}")
            return False
    
    def get_select_label(self, select_element):
        """Get label for a select element"""
        try:
            # Try to find label by various methods
            
            # Method 1: Look for label element
            select_id = select_element.get_attribute('id')
            if select_id:
                try:
                    label_element = self.driver.find_element(By.XPATH, f"//label[@for='{select_id}']")
                    return label_element.text.strip()
                except Exception:
                    pass
            
            # Method 2: Look for name or id attribute
            name = select_element.get_attribute('name')
            if name:
                return name.replace('_', ' ').title()
            
            if select_id:
                return select_id.replace('_', ' ').title()
            
            # Method 3: Look for preceding text
            try:
                parent = select_element.find_element(By.XPATH, "./..")
                parent_text = parent.text.strip()
                if parent_text:
                    # Extract text before the dropdown
                    select_text = select_element.text
                    if select_text in parent_text:
                        label = parent_text.replace(select_text, '').strip()
                        if label:
                            return label
            except Exception:
                pass
            
            # Method 4: Look for preceding sibling
            try:
                prev_element = self.driver.execute_script("""
                    var element = arguments[0];
                    var prev = element.previousElementSibling;
                    while (prev && !prev.textContent.trim()) {
                        prev = prev.previousElementSibling;
                    }
                    return prev ? prev.textContent : null;
                """, select_element)
                
                if prev_element:
                    return prev_element.strip()
            except Exception:
                pass
            
            return f"Dropdown_{int(time.time())}"
            
        except Exception:
            return f"Unknown_Dropdown_{int(time.time())}"
    
    def save_service_providers(self):
        """Save extracted service providers to files"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Save as JSON for detailed structure
            json_filename = f"{self.config.OUTPUT_DIR}/service_providers_{timestamp}.json"
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(self.service_providers, f, indent=2, ensure_ascii=False)
            
            # Save as CSV for easy analysis
            csv_data = []
            for category, options in self.service_providers.items():
                for option in options:
                    csv_data.append({
                        'Category': category,
                        'Value': option['value'],
                        'Text': option['text']
                    })
            
            if csv_data:
                df = pd.DataFrame(csv_data)
                csv_filename = f"{self.config.OUTPUT_DIR}/service_providers_{timestamp}.csv"
                df.to_csv(csv_filename, index=False, encoding='utf-8')
                
                # Also save as master reference file
                master_filename = f"{self.config.OUTPUT_DIR}/service_providers_master.csv"
                df.to_csv(master_filename, index=False, encoding='utf-8')
                
                self.logger.info(f"Service providers saved to {csv_filename} and {master_filename}")
                return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Failed to save service providers: {str(e)}")
            return False
    
    def run_extraction(self):
        """Run the complete service provider extraction process"""
        try:
            self.logger.info("Starting service provider extraction process...")
            
            # Setup driver
            if not self.setup_driver():
                return False
            
            # Login
            if not self.login():
                return False
            
            # Navigate to advanced search
            if not self.navigate_to_advanced_search():
                # Try to find search functionality on current page
                self.logger.info("Checking current page for search dropdowns...")
            
            # Extract service providers
            if not self.extract_service_providers_from_dropdowns():
                return False
            
            # Save results
            if not self.save_service_providers():
                return False
            
            self.logger.info("Service provider extraction completed successfully!")
            return True
            
        except Exception as e:
            self.logger.error(f"Extraction process failed: {str(e)}")
            return False
        finally:
            if self.driver:
                self.driver.quit()

class StrategyTracker:
    def __init__(self):
        self.strategies = {}
        self.results = {}
        
    def register_strategy(self, strategy_name, description, category=None):
        """Register a discovery strategy"""
        self.strategies[strategy_name] = {
            'description': description,
            'category': category,
            'urls_found': 0,
            'success_count': 0,
            'total_attempts': 0,
            'unique_funds': set(),
            'execution_times': []
        }
    
    def track_result(self, strategy_name, urls_found, success_count, execution_time, fund_ids=None):
        """Track results for a strategy"""
        if strategy_name not in self.strategies:
            self.register_strategy(strategy_name, "Auto-registered")
        
        strategy = self.strategies[strategy_name]
        strategy['urls_found'] += urls_found
        strategy['success_count'] += success_count
        strategy['total_attempts'] += 1
        strategy['execution_times'].append(execution_time)
        
        if fund_ids:
            strategy['unique_funds'].update(fund_ids)
    
    def get_strategy_analytics(self):
        """Get comprehensive strategy analytics"""
        analytics = {}
        
        for name, data in self.strategies.items():
            analytics[name] = {
                'description': data['description'],
                'category': data['category'],
                'total_urls_found': data['urls_found'],
                'total_success_count': data['success_count'],
                'total_attempts': data['total_attempts'],
                'success_rate': (data['success_count'] / max(data['total_attempts'], 1)) * 100,
                'unique_funds_count': len(data['unique_funds']),
                'avg_execution_time': sum(data['execution_times']) / max(len(data['execution_times']), 1),
                'urls_per_attempt': data['urls_found'] / max(data['total_attempts'], 1)
            }
        
        return analytics
    
    def save_analytics(self, output_dir):
        """Save strategy analytics to files"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Detailed analytics
        analytics = self.get_strategy_analytics()
        
        # Save as JSON
        json_filename = f"{output_dir}/strategy_analytics_{timestamp}.json"
        with open(json_filename, 'w') as f:
            json.dump(analytics, f, indent=2, default=str)
        
        # Save as CSV
        csv_data = []
        for strategy, metrics in analytics.items():
            csv_data.append({
                'Strategy': strategy,
                'Description': metrics['description'],
                'Category': metrics['category'],
                'URLs_Found': metrics['total_urls_found'],
                'Success_Count': metrics['total_success_count'],
                'Success_Rate': round(metrics['success_rate'], 2),
                'Unique_Funds': metrics['unique_funds_count'],
                'Avg_Execution_Time': round(metrics['avg_execution_time'], 2),
                'URLs_Per_Attempt': round(metrics['urls_per_attempt'], 2)
            })
        
        df = pd.DataFrame(csv_data)
        csv_filename = f"{output_dir}/strategy_analytics_{timestamp}.csv"
        df.to_csv(csv_filename, index=False)
        
        return json_filename, csv_filename

if __name__ == "__main__":
    print("Service Provider Extraction System")
    print("=" * 50)
    
    extractor = ServiceProviderExtractor()
    
    choice = input("\nSelect operation:\n1. Extract Service Providers\n2. Test Strategy Tracker\n\nEnter choice (1-2): ")
    
    if choice == "1":
        success = extractor.run_extraction()
        if success:
            print("✓ Service provider extraction completed successfully!")
        else:
            print("✗ Service provider extraction failed!")
    
    elif choice == "2":
        tracker = StrategyTracker()
        
        # Register some test strategies
        tracker.register_strategy("Service_Provider_Search", "Search by individual service providers", "Provider-Based")
        tracker.register_strategy("ISIN_Pattern_Search", "Search using ISIN patterns", "Pattern-Based")
        tracker.register_strategy("Legal_Structure_Search", "Search by legal structures", "Structure-Based")
        
        # Add some test data
        tracker.track_result("Service_Provider_Search", 50, 45, 120.5, [f"fund_{i}" for i in range(45)])
        tracker.track_result("ISIN_Pattern_Search", 30, 28, 85.2, [f"fund_{i}" for i in range(20, 48)])
        tracker.track_result("Legal_Structure_Search", 25, 22, 95.8, [f"fund_{i}" for i in range(40, 62)])
        
        analytics = tracker.get_strategy_analytics()
        
        print("\nStrategy Analytics:")
        print("-" * 80)
        for strategy, metrics in analytics.items():
            print(f"\nStrategy: {strategy}")
            print(f"  Success Rate: {metrics['success_rate']:.2f}%")
            print(f"  Unique Funds: {metrics['unique_funds_count']}")
            print(f"  URLs per Attempt: {metrics['urls_per_attempt']:.2f}")
            print(f"  Avg Execution Time: {metrics['avg_execution_time']:.2f}s")
        
        # Save analytics
        json_file, csv_file = tracker.save_analytics("output")
        print(f"\n✓ Analytics saved to {csv_file}")
    
    else:
        print("Invalid choice!")
