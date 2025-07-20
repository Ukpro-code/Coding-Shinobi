"""
Comprehensive FundSquare Discovery and Monitoring System
Main controller for service provider extraction, multi-strategy discovery, and change detection
"""

import os
import time
from datetime import datetime
import pandas as pd
from sp_extraction_system import ServiceProviderExtractor
from multi_strategy_discovery import MultiStrategyDiscoverySystem
from change_detection_system import ChangeDetectionSystem, MonthlyMonitoringSystem
from simple_scraper import SimpleFundSquareScraper
import logging

class FundSquareController:
    def __init__(self):
        self.setup_logging()
        self.output_dir = "output"
        os.makedirs(self.output_dir, exist_ok=True)
        
    def setup_logging(self):
        """Setup logging configuration"""
        os.makedirs("logs", exist_ok=True)
        
        log_filename = f"logs/controller_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_filename),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def extract_service_providers(self):
        """Extract service providers from FundSquare dropdowns"""
        try:
            self.logger.info("=== Starting Service Provider Extraction ===")
            print("🔍 Extracting service providers from FundSquare...")
            
            extractor = ServiceProviderExtractor()
            success = extractor.run_extraction()
            
            if success:
                print("✓ Service providers extracted successfully!")
                
                # Check if master file was created
                master_file = f"{self.output_dir}/service_providers_master.csv"
                if os.path.exists(master_file):
                    df = pd.read_csv(master_file)
                    print(f"📊 Extracted {len(df)} service providers from {df['Category'].nunique()} categories")
                    
                    # Show category breakdown
                    category_counts = df['Category'].value_counts()
                    print("\n📋 Service Provider Categories:")
                    for category, count in category_counts.items():
                        print(f"  • {category}: {count} providers")
                
                return True
            else:
                print("❌ Service provider extraction failed!")
                return False
                
        except Exception as e:
            self.logger.error(f"Service provider extraction failed: {str(e)}")
            print(f"❌ Error during service provider extraction: {str(e)}")
            return False
    
    def run_discovery_strategies(self):
        """Run multi-strategy fund discovery"""
        try:
            self.logger.info("=== Starting Multi-Strategy Discovery ===")
            print("🚀 Running multi-strategy fund discovery...")
            
            discovery_system = MultiStrategyDiscoverySystem()
            success = discovery_system.run_discovery_pipeline()
            
            if success:
                print("✓ Multi-strategy discovery completed successfully!")
                
                # Show strategy analytics
                analytics = discovery_system.strategy_tracker.get_strategy_analytics()
                
                print("\n📈 Strategy Performance Summary:")
                print("-" * 60)
                
                total_urls = 0
                total_unique_funds = 0
                
                for strategy, metrics in analytics.items():
                    print(f"\n🎯 {strategy}:")
                    print(f"   URLs Found: {metrics['total_urls_found']}")
                    print(f"   Success Rate: {metrics['success_rate']:.1f}%")
                    print(f"   Unique Funds: {metrics['unique_funds_count']}")
                    print(f"   Avg Time: {metrics['avg_execution_time']:.1f}s")
                    
                    total_urls += metrics['total_urls_found']
                    total_unique_funds += metrics['unique_funds_count']
                
                print("\n🎊 Overall Results:")
                print(f"   Total URLs Found: {total_urls}")
                print(f"   Total Unique Funds: {total_unique_funds}")
                
                return True
            else:
                print("❌ Multi-strategy discovery failed!")
                return False
                
        except Exception as e:
            self.logger.error(f"Multi-strategy discovery failed: {str(e)}")
            print(f"❌ Error during discovery: {str(e)}")
            return False
    
    def scrape_discovered_funds(self, urls_file):
        """Scrape fund details from discovered URLs"""
        try:
            self.logger.info("=== Starting Fund Data Scraping ===")
            print("📊 Scraping fund details from discovered URLs...")
            
            # Load discovered URLs
            if not os.path.exists(urls_file):
                print(f"❌ URLs file not found: {urls_file}")
                return False
            
            df_urls = pd.read_csv(urls_file)
            urls = df_urls['URLs'].tolist() if 'URLs' in df_urls.columns else df_urls.iloc[:, 0].tolist()
            
            print(f"📋 Found {len(urls)} URLs to scrape")
            
            # Use simple scraper to scrape all URLs
            scraper = SimpleFundSquareScraper()
            
            if not scraper.setup_driver():
                return False
            
            if not scraper.login():
                return False
            
            successful_funds = []
            failed_urls = []
            
            print("🔄 Starting fund scraping...")
            
            for i, url in enumerate(urls, 1):
                try:
                    print(f"   Scraping {i}/{len(urls)}: {url.split('/')[-1]}")
                    
                    fund_data = scraper.scrape_fund_url(url)
                    if fund_data:
                        fund_data['URL'] = url
                        fund_data['Extraction_Date'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        successful_funds.append(fund_data)
                    else:
                        failed_urls.append(url)
                    
                    # Add delay between requests
                    time.sleep(2)
                    
                except Exception as e:
                    self.logger.error(f"Failed to scrape {url}: {str(e)}")
                    failed_urls.append(url)
                    continue
            
            scraper.cleanup()
            
            # Save results
            if successful_funds:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                output_file = f"{self.output_dir}/comprehensive_fund_data_{timestamp}.xlsx"
                
                df_results = pd.DataFrame(successful_funds)
                df_results.to_excel(output_file, index=False)
                
                print(f"✓ Scraped {len(successful_funds)} funds successfully!")
                print(f"💾 Results saved to: {output_file}")
                
                if failed_urls:
                    print(f"⚠️  Failed to scrape {len(failed_urls)} URLs")
                
                return output_file
            else:
                print("❌ No funds were scraped successfully!")
                return False
                
        except Exception as e:
            self.logger.error(f"Fund scraping failed: {str(e)}")
            print(f"❌ Error during fund scraping: {str(e)}")
            return False
    
    def run_change_detection(self, current_file, previous_file=None):
        """Run change detection analysis"""
        try:
            self.logger.info("=== Starting Change Detection ===")
            print("🔍 Running change detection analysis...")
            
            if previous_file:
                # Manual change detection
                detector = ChangeDetectionSystem(self.output_dir)
                success = detector.run_complete_analysis(current_file, previous_file)
                
                if success:
                    print("✓ Change detection completed successfully!")
                    return True
                else:
                    print("❌ Change detection failed!")
                    return False
            else:
                # Monthly monitoring system
                monitoring = MonthlyMonitoringSystem()
                success = monitoring.run_monthly_comparison(current_file)
                
                if success:
                    print("✓ Monthly monitoring completed successfully!")
                    return True
                else:
                    print("❌ Monthly monitoring failed!")
                    return False
                
        except Exception as e:
            self.logger.error(f"Change detection failed: {str(e)}")
            print(f"❌ Error during change detection: {str(e)}")
            return False
    
    def run_complete_pipeline(self):
        """Run the complete discovery and monitoring pipeline"""
        try:
            print("🚀 FUNDSQUARE COMPREHENSIVE DISCOVERY PIPELINE")
            print("=" * 60)
            
            # Step 1: Extract Service Providers (only if not already done)
            sp_master_file = f"{self.output_dir}/service_providers_master.csv"
            if not os.path.exists(sp_master_file):
                print("\n📥 Step 1: Extracting Service Providers")
                if not self.extract_service_providers():
                    print("❌ Pipeline failed at service provider extraction!")
                    return False
            else:
                print("\n✓ Step 1: Service providers already extracted")
                df_sp = pd.read_csv(sp_master_file)
                print(f"   Found {len(df_sp)} service providers from {df_sp['Category'].nunique()} categories")
            
            # Step 2: Run Discovery Strategies
            print("\n🎯 Step 2: Running Discovery Strategies")
            if not self.run_discovery_strategies():
                print("❌ Pipeline failed at discovery strategies!")
                return False
            
            # Step 3: Find the latest discovered URLs file
            discovered_files = [f for f in os.listdir(self.output_dir) if f.startswith('discovered_urls_')]
            if not discovered_files:
                print("❌ No discovered URLs file found!")
                return False
            
            latest_urls_file = sorted(discovered_files)[-1]
            urls_file_path = os.path.join(self.output_dir, latest_urls_file)
            
            print(f"\n📊 Step 3: Scraping Fund Details from {latest_urls_file}")
            scraped_file = self.scrape_discovered_funds(urls_file_path)
            
            if not scraped_file:
                print("❌ Pipeline failed at fund scraping!")
                return False
            
            # Step 4: Change Detection (if applicable)
            print("\n🔍 Step 4: Running Change Detection")
            self.run_change_detection(scraped_file)
            
            print("\n🎉 PIPELINE COMPLETED SUCCESSFULLY!")
            print("=" * 60)
            print(f"📁 All results saved in: {self.output_dir}/")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Complete pipeline failed: {str(e)}")
            print(f"❌ Pipeline failed: {str(e)}")
            return False
    
    def run_monthly_monitoring_mode(self):
        """Run in monthly monitoring mode"""
        try:
            print("📅 MONTHLY MONITORING MODE")
            print("=" * 40)
            
            # Check if we have previous month's data
            monitoring = MonthlyMonitoringSystem()
            
            # Run discovery and scraping
            print("\n🔄 Running current month discovery...")
            
            # Step 1: Discovery
            if not self.run_discovery_strategies():
                return False
            
            # Step 2: Scraping
            discovered_files = [f for f in os.listdir(self.output_dir) if f.startswith('discovered_urls_')]
            if discovered_files:
                latest_urls_file = sorted(discovered_files)[-1]
                urls_file_path = os.path.join(self.output_dir, latest_urls_file)
                scraped_file = self.scrape_discovered_funds(urls_file_path)
                
                if scraped_file:
                    # Step 3: Monthly comparison
                    print("\n📊 Running monthly comparison...")
                    success = monitoring.run_monthly_comparison(scraped_file)
                    
                    if success:
                        print("✓ Monthly monitoring completed successfully!")
                        return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Monthly monitoring failed: {str(e)}")
            print(f"❌ Monthly monitoring failed: {str(e)}")
            return False

def main():
    """Main function with user interface"""
    controller = FundSquareController()
    
    print("🏦 FUNDSQUARE COMPREHENSIVE DISCOVERY SYSTEM")
    print("=" * 55)
    print("Welcome to the comprehensive fund discovery and monitoring system!")
    print("\nThis system provides the following capabilities:")
    print("• Extract service providers from FundSquare dropdowns")
    print("• Multi-strategy fund discovery (SP, ISIN, Legal Structure)")
    print("• Comprehensive fund data scraping")
    print("• Change detection and monthly monitoring")
    print("• Strategy performance analytics")
    
    while True:
        print("\n" + "="*55)
        print("SELECT OPERATION:")
        print("-" * 25)
        print("1. 🔧 Extract Service Providers Only")
        print("2. 🎯 Run Discovery Strategies Only")
        print("3. 📊 Scrape Specific URLs File")
        print("4. 🔍 Run Change Detection")
        print("5. 🚀 Run Complete Pipeline")
        print("6. 📅 Monthly Monitoring Mode")
        print("7. ❌ Exit")
        
        choice = input("\nEnter your choice (1-7): ").strip()
        
        if choice == "1":
            controller.extract_service_providers()
        
        elif choice == "2":
            controller.run_discovery_strategies()
        
        elif choice == "3":
            urls_file = input("Enter path to URLs file: ").strip()
            if os.path.exists(urls_file):
                controller.scrape_discovered_funds(urls_file)
            else:
                print("❌ File not found!")
        
        elif choice == "4":
            current_file = input("Enter current data file path: ").strip()
            previous_file = input("Enter previous data file path (or press Enter for auto-detect): ").strip()
            
            if os.path.exists(current_file):
                if previous_file and not os.path.exists(previous_file):
                    print("❌ Previous file not found!")
                    continue
                controller.run_change_detection(current_file, previous_file if previous_file else None)
            else:
                print("❌ Current file not found!")
        
        elif choice == "5":
            controller.run_complete_pipeline()
        
        elif choice == "6":
            controller.run_monthly_monitoring_mode()
        
        elif choice == "7":
            print("👋 Thank you for using FundSquare Discovery System!")
            break
        
        else:
            print("❌ Invalid choice! Please enter 1-7.")
        
        input("\nPress Enter to continue...")

if __name__ == "__main__":
    main()
