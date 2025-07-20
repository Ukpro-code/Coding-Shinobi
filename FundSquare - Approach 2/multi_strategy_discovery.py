"""
Multi-Strategy Fund Discovery System
Implements multiple discovery strategies with performance tracking and deduplication
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
from sp_extraction_system import ServiceProviderExtractor, StrategyTracker

class MultiStrategyDiscoverySystem:
    def __init__(self):
        self.config = Config()
        self.driver = None
        self.strategy_tracker = StrategyTracker()
        self.discovered_urls = set()
        self.fund_data = []
        self.service_providers = {}
        self.setup_logging()
        
    def setup_logging(self):
        """Setup logging configuration"""
        os.makedirs(self.config.LOG_DIR, exist_ok=True)
        
        log_filename = f"{self.config.LOG_DIR}/multi_strategy_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
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
    
    def load_service_providers(self):
        """Load service providers from master file"""
        try:
            sp_file = f"{self.config.OUTPUT_DIR}/service_providers_master.csv"
            if os.path.exists(sp_file):
                df = pd.read_csv(sp_file)
                
                # Group by category
                for category in df['Category'].unique():
                    category_sps = df[df['Category'] == category]
                    self.service_providers[category] = [
                        {'value': row['Value'], 'text': row['Text']}
                        for _, row in category_sps.iterrows()
                    ]
                
                self.logger.info(f"Loaded {len(df)} service providers from {len(self.service_providers)} categories")
                return True
            else:
                self.logger.warning("Service providers master file not found. Run SP extraction first.")
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to load service providers: {str(e)}")
            return False
    
    def search_by_service_provider(self, category, provider):
        """Search for funds by specific service provider"""
        start_time = time.time()
        found_urls = []
        
        try:
            self.logger.info(f"Searching by {category}: {provider['text']}")
            
            # Navigate to search page (implementation depends on site structure)
            # This is a placeholder - you'll need to implement based on actual site navigation
            search_url = "https://www.fundsquare.net/search"  # Replace with actual search URL
            self.driver.get(search_url)
            time.sleep(2)
            
            # Look for service provider dropdown
            try:
                # Find the dropdown for this category
                dropdown = self.driver.find_element(By.NAME, category.lower())
                select = Select(dropdown)
                select.select_by_value(provider['value'])
                
                # Submit search
                search_button = self.driver.find_element(By.XPATH, "//input[@type='submit' or @type='button']")
                search_button.click()
                time.sleep(3)
                
                # Extract fund URLs from results
                fund_links = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/security/information')]")
                
                for link in fund_links:
                    url = link.get_attribute('href')
                    if url and url not in self.discovered_urls:
                        found_urls.append(url)
                        self.discovered_urls.add(url)
                
            except NoSuchElementException:
                self.logger.warning(f"Could not find dropdown for category: {category}")
            
        except Exception as e:
            self.logger.error(f"Error searching by {category} - {provider['text']}: {str(e)}")
        
        execution_time = time.time() - start_time
        strategy_name = f"SP_Search_{category}"
        
        self.strategy_tracker.track_result(
            strategy_name,
            len(found_urls),
            len(found_urls),  # Assume all found URLs are successful for now
            execution_time,
            [url.split('/')[-1] for url in found_urls]  # Extract fund IDs from URLs
        )
        
        return found_urls
    
    def search_by_isin_pattern(self, pattern):
        """Search for funds using ISIN patterns"""
        start_time = time.time()
        found_urls = []
        
        try:
            self.logger.info(f"Searching by ISIN pattern: {pattern}")
            
            # Navigate to search page
            search_url = "https://www.fundsquare.net/search"
            self.driver.get(search_url)
            time.sleep(2)
            
            # Look for ISIN search field
            try:
                isin_field = self.driver.find_element(By.NAME, "isin")
                isin_field.clear()
                isin_field.send_keys(pattern)
                
                # Submit search
                search_button = self.driver.find_element(By.XPATH, "//input[@type='submit' or @type='button']")
                search_button.click()
                time.sleep(3)
                
                # Extract fund URLs from results
                fund_links = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/security/information')]")
                
                for link in fund_links:
                    url = link.get_attribute('href')
                    if url and url not in self.discovered_urls:
                        found_urls.append(url)
                        self.discovered_urls.add(url)
                
            except NoSuchElementException:
                self.logger.warning("Could not find ISIN search field")
            
        except Exception as e:
            self.logger.error(f"Error searching by ISIN pattern {pattern}: {str(e)}")
        
        execution_time = time.time() - start_time
        
        self.strategy_tracker.track_result(
            "ISIN_Pattern_Search",
            len(found_urls),
            len(found_urls),
            execution_time,
            [url.split('/')[-1] for url in found_urls]
        )
        
        return found_urls
    
    def search_by_legal_structure(self, structure):
        """Search for funds by legal structure"""
        start_time = time.time()
        found_urls = []
        
        try:
            self.logger.info(f"Searching by legal structure: {structure}")
            
            # Navigate to search page
            search_url = "https://www.fundsquare.net/search"
            self.driver.get(search_url)
            time.sleep(2)
            
            # Look for legal structure dropdown
            try:
                structure_dropdown = self.driver.find_element(By.NAME, "legal_structure")
                select = Select(structure_dropdown)
                select.select_by_visible_text(structure)
                
                # Submit search
                search_button = self.driver.find_element(By.XPATH, "//input[@type='submit' or @type='button']")
                search_button.click()
                time.sleep(3)
                
                # Extract fund URLs from results
                fund_links = self.driver.find_elements(By.XPATH, "//a[contains(@href, '/security/information')]")
                
                for link in fund_links:
                    url = link.get_attribute('href')
                    if url and url not in self.discovered_urls:
                        found_urls.append(url)
                        self.discovered_urls.add(url)
                
            except NoSuchElementException:
                self.logger.warning("Could not find legal structure dropdown")
            
        except Exception as e:
            self.logger.error(f"Error searching by legal structure {structure}: {str(e)}")
        
        execution_time = time.time() - start_time
        
        self.strategy_tracker.track_result(
            "Legal_Structure_Search",
            len(found_urls),
            len(found_urls),
            execution_time,
            [url.split('/')[-1] for url in found_urls]
        )
        
        return found_urls
    
    def run_service_provider_discovery(self):
        """Run discovery using all service providers"""
        if not self.service_providers:
            self.logger.warning("No service providers loaded. Skipping SP discovery.")
            return []
        
        all_urls = []
        
        for category, providers in self.service_providers.items():
            self.logger.info(f"Running discovery for category: {category}")
            
            # Register strategy for this category
            self.strategy_tracker.register_strategy(
                f"SP_Search_{category}",
                f"Search by {category} service providers",
                "Service Provider"
            )
            
            for provider in providers:
                if provider['value'] and provider['text'].strip():
                    urls = self.search_by_service_provider(category, provider)
                    all_urls.extend(urls)
                    
                    # Add delay between searches to avoid overwhelming the server
                    time.sleep(1)
        
        return all_urls
    
    def run_isin_pattern_discovery(self):
        """Run discovery using ISIN patterns"""
        # Common ISIN country codes for European funds
        country_codes = ['LU', 'IE', 'FR', 'DE', 'GB', 'NL', 'AT', 'BE', 'CH', 'IT']
        
        # Register strategy
        self.strategy_tracker.register_strategy(
            "ISIN_Pattern_Search",
            "Search using ISIN country code patterns",
            "Pattern-Based"
        )
        
        all_urls = []
        
        for country_code in country_codes:
            # Search with wildcards - adjust pattern based on site capabilities
            pattern = f"{country_code}*"
            urls = self.search_by_isin_pattern(pattern)
            all_urls.extend(urls)
            time.sleep(1)
        
        return all_urls
    
    def run_legal_structure_discovery(self):
        """Run discovery using legal structures"""
        # Common legal structures for funds
        structures = [
            'SICAV', 'FCP', 'UCITS', 'AIF', 'ETF', 'OEIC', 'Unit Trust',
            'Investment Trust', 'Mutual Fund', 'Hedge Fund'
        ]
        
        # Register strategy
        self.strategy_tracker.register_strategy(
            "Legal_Structure_Search",
            "Search by legal structure types",
            "Structure-Based"
        )
        
        all_urls = []
        
        for structure in structures:
            urls = self.search_by_legal_structure(structure)
            all_urls.extend(urls)
            time.sleep(1)
        
        return all_urls
    
    def run_comprehensive_discovery(self):
        """Run all discovery strategies"""
        try:
            self.logger.info("Starting comprehensive fund discovery...")
            
            all_discovered_urls = []
            
            # Strategy 1: Service Provider Discovery
            self.logger.info("=== Running Service Provider Discovery ===")
            sp_urls = self.run_service_provider_discovery()
            all_discovered_urls.extend(sp_urls)
            self.logger.info(f"Service Provider Discovery found {len(sp_urls)} URLs")
            
            # Strategy 2: ISIN Pattern Discovery
            self.logger.info("=== Running ISIN Pattern Discovery ===")
            isin_urls = self.run_isin_pattern_discovery()
            all_discovered_urls.extend(isin_urls)
            self.logger.info(f"ISIN Pattern Discovery found {len(isin_urls)} URLs")
            
            # Strategy 3: Legal Structure Discovery
            self.logger.info("=== Running Legal Structure Discovery ===")
            structure_urls = self.run_legal_structure_discovery()
            all_discovered_urls.extend(structure_urls)
            self.logger.info(f"Legal Structure Discovery found {len(structure_urls)} URLs")
            
            # Remove duplicates
            unique_urls = list(self.discovered_urls)
            
            self.logger.info(f"Total unique URLs discovered: {len(unique_urls)}")
            self.logger.info(f"Total URLs found (with duplicates): {len(all_discovered_urls)}")
            self.logger.info(f"Deduplication saved: {len(all_discovered_urls) - len(unique_urls)} duplicates")
            
            return unique_urls
            
        except Exception as e:
            self.logger.error(f"Comprehensive discovery failed: {str(e)}")
            return []
    
    def save_discovery_results(self, urls):
        """Save discovery results to files"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Save URLs
            url_df = pd.DataFrame({'URLs': urls})
            url_filename = f"{self.config.OUTPUT_DIR}/discovered_urls_{timestamp}.csv"
            url_df.to_csv(url_filename, index=False)
            
            # Save strategy analytics
            json_file, csv_file = self.strategy_tracker.save_analytics(self.config.OUTPUT_DIR)
            
            self.logger.info("Discovery results saved:")
            self.logger.info(f"  URLs: {url_filename}")
            self.logger.info(f"  Analytics: {csv_file}")
            
            return url_filename, csv_file
            
        except Exception as e:
            self.logger.error(f"Failed to save discovery results: {str(e)}")
            return None, None
    
    def run_discovery_pipeline(self):
        """Run the complete discovery pipeline"""
        try:
            self.logger.info("Starting Multi-Strategy Discovery Pipeline...")
            
            # Setup
            if not self.setup_driver():
                return False
            
            if not self.login():
                return False
            
            # Load service providers
            self.load_service_providers()
            
            # Run discovery
            discovered_urls = self.run_comprehensive_discovery()
            
            if not discovered_urls:
                self.logger.warning("No URLs discovered!")
                return False
            
            # Save results
            url_file, analytics_file = self.save_discovery_results(discovered_urls)
            
            # Print summary
            analytics = self.strategy_tracker.get_strategy_analytics()
            
            print("\n" + "="*80)
            print("DISCOVERY SUMMARY")
            print("="*80)
            print(f"Total URLs Discovered: {len(discovered_urls)}")
            print("\nStrategy Performance:")
            print("-" * 50)
            
            for strategy, metrics in analytics.items():
                print(f"\n{strategy}:")
                print(f"  URLs Found: {metrics['total_urls_found']}")
                print(f"  Success Rate: {metrics['success_rate']:.1f}%")
                print(f"  Unique Funds: {metrics['unique_funds_count']}")
                print(f"  Avg Time: {metrics['avg_execution_time']:.1f}s")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Discovery pipeline failed: {str(e)}")
            return False
        finally:
            if self.driver:
                self.driver.quit()

if __name__ == "__main__":
    print("Multi-Strategy Fund Discovery System")
    print("=" * 50)
    
    discovery_system = MultiStrategyDiscoverySystem()
    
    choice = input("\nSelect operation:\n1. Run Complete Discovery Pipeline\n2. Extract Service Providers First\n\nEnter choice (1-2): ")
    
    if choice == "1":
        success = discovery_system.run_discovery_pipeline()
        if success:
            print("\n✓ Discovery pipeline completed successfully!")
        else:
            print("\n✗ Discovery pipeline failed!")
    
    elif choice == "2":
        print("\nExtracting service providers first...")
        extractor = ServiceProviderExtractor()
        
        if extractor.run_extraction():
            print("✓ Service providers extracted successfully!")
            print("\nNow you can run the discovery pipeline with option 1.")
        else:
            print("✗ Service provider extraction failed!")
    
    else:
        print("Invalid choice!")
