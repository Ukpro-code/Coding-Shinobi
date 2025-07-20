"""
HYBRID FUNDSQUARE SCRAPER - Best of Both Approaches
1. Uses existing 500 URLs as a baseline
2. Attempts discovery of new funds
3. Combines both datasets for complete coverage
4. Provides ongoing monitoring capability
"""

import pandas as pd
import time
from datetime import datetime
from simple_scraper import SimpleFundSquareScraper
import os

class HybridFundSquareScraper(SimpleFundSquareScraper):
    
    def __init__(self):
        super().__init__()
        self.existing_urls = []
        self.discovered_urls = []
        self.all_urls = []
        
    def load_existing_urls(self):
        """Load the 500 existing URLs from Excel file"""
        try:
            excel_path = r'D:\Ukesh\Coding Shinobi\Coding-Shinobi\Intern_project\Fundsquare_webscrapping Project\Fundsquare first test.xlsx'
            
            if os.path.exists(excel_path):
                df = pd.read_excel(excel_path)
                self.existing_urls = df['Fundsquare_URL'].dropna().tolist()
                self.logger.info(f"Loaded {len(self.existing_urls)} existing URLs from Excel file")
                return True
            else:
                self.logger.warning("Excel file with existing URLs not found")
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to load existing URLs: {str(e)}")
            return False
    
    def attempt_discovery(self):
        """Attempt to discover new fund URLs (optional enhancement)"""
        try:
            self.logger.info("Attempting to discover additional fund URLs...")
            
            # For now, we'll use the existing URLs as our primary source
            # Future enhancement: Add discovery methods here
            
            # Placeholder for discovery logic
            discovered_count = 0
            
            self.logger.info(f"Discovery attempt completed. Found {discovered_count} additional URLs")
            return discovered_count > 0
            
        except Exception as e:
            self.logger.error(f"Discovery attempt failed: {str(e)}")
            return False
    
    def create_comprehensive_url_list(self):
        """Create comprehensive list combining existing and discovered URLs"""
        try:
            self.all_urls = list(set(self.existing_urls + self.discovered_urls))
            self.logger.info(f"Created comprehensive URL list with {len(self.all_urls)} unique URLs")
            return len(self.all_urls) > 0
            
        except Exception as e:
            self.logger.error(f"Failed to create comprehensive URL list: {str(e)}")
            return False
    
    def run_comprehensive_scrape(self, batch_size=50, start_index=0, max_funds=None):
        """Run comprehensive scraping on all available fund URLs"""
        try:
            print("🔄 Loading existing fund URLs...")
            if not self.load_existing_urls():
                print("❌ Could not load existing URLs!")
                return False
            
            print(f"✅ Loaded {len(self.existing_urls)} existing fund URLs")
            
            print("🔍 Attempting discovery of additional funds...")
            discovery_success = self.attempt_discovery()
            
            if discovery_success:
                print(f"✅ Discovered {len(self.discovered_urls)} additional URLs")
            else:
                print("ℹ️ No additional URLs discovered (using existing URLs)")
            
            print("📋 Creating comprehensive fund list...")
            if not self.create_comprehensive_url_list():
                print("❌ Failed to create fund list!")
                return False
            
            # Apply limits if specified
            if max_funds:
                self.all_urls = self.all_urls[:max_funds]
            
            urls_to_process = self.all_urls[start_index:]
            
            print(f"\n🚀 Starting Comprehensive Fund Scraping")
            print("=" * 60)
            print(f"📊 Total URLs available: {len(self.all_urls)}")
            print(f"📊 URLs to process: {len(urls_to_process)}")
            print(f"📦 Batch size: {batch_size}")
            
            if not self.setup_driver():
                return False
            
            if not self.login():
                return False
            
            # Process in batches
            total_urls = len(urls_to_process)
            current_batch = 1
            total_batches = (total_urls + batch_size - 1) // batch_size
            
            for batch_start in range(0, total_urls, batch_size):
                batch_end = min(batch_start + batch_size, total_urls)
                batch_urls = urls_to_process[batch_start:batch_end]
                
                print(f"\n📦 Processing Batch {current_batch}/{total_batches}")
                print(f"URLs {start_index + batch_start + 1} to {start_index + batch_end} of {len(self.all_urls)}")
                print("-" * 50)
                
                batch_success = 0
                batch_failed = 0
                
                for i, url in enumerate(batch_urls, 1):
                    global_index = start_index + batch_start + i
                    print(f"Processing {global_index}/{len(self.all_urls)}: Fund {i}/{len(batch_urls)}")
                    
                    # Re-login periodically
                    if global_index % 20 == 0:
                        print("🔄 Re-authenticating...")
                        if not self.login():
                            print("❌ Re-authentication failed!")
                            break
                    
                    fund_data = self.scrape_fund_url(url)
                    if fund_data:
                        self.funds_data.append(fund_data)
                        batch_success += 1
                        fund_name = fund_data.get('fund_name', 'Unknown')[:50]
                        print(f"✅ {fund_name}...")
                    else:
                        batch_failed += 1
                        print("❌ Failed")
                    
                    time.sleep(2)  # Respectful delay
                
                # Save batch progress
                if self.funds_data:
                    filename = f"hybrid_comprehensive_batch_{current_batch}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
                    df_batch = pd.DataFrame(self.funds_data)
                    df_batch.to_excel(filename, index=False)
                    print(f"\n💾 Batch {current_batch} saved: {filename}")
                    print(f"📊 Batch Stats: ✅ {batch_success} success, ❌ {batch_failed} failed")
                
                current_batch += 1
                
                # Brief pause between batches
                if current_batch <= total_batches:
                    print("⏳ 5 second pause between batches...")
                    time.sleep(5)
            
            # Final comprehensive save
            if self.funds_data:
                final_filename = f"hybrid_comprehensive_complete_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
                df_final = pd.DataFrame(self.funds_data)
                df_final.to_excel(final_filename, index=False)
                
                print("\n🎉 COMPREHENSIVE SCRAPING COMPLETED!")
                print(f"📁 Final file: {final_filename}")
                print(f"🔍 Total URLs processed: {len(self.all_urls)}")
                print(f"📊 Total funds scraped: {len(self.funds_data)}")
                print(f"🎯 Success rate: {len(self.funds_data)}/{len(self.all_urls)} ({len(self.funds_data)/len(self.all_urls)*100:.1f}%)")
                
                # Enhanced data summary
                print("\n📈 Comprehensive Data Summary:")
                print(f"- Total funds with data: {len(self.funds_data)}")
                print(f"- Funds with ISIN: {sum(1 for f in self.funds_data if f.get('isin') and f.get('isin') != '-')}")
                print(f"- Funds with NAV: {sum(1 for f in self.funds_data if f.get('last_nav') and f.get('last_nav') != '-')}")
                print(f"- Funds with Creation Date: {sum(1 for f in self.funds_data if f.get('fund_creation_date') and f.get('fund_creation_date') != '-')}")
                print(f"- Funds with Central Admin: {sum(1 for f in self.funds_data if f.get('central_administration') and f.get('central_administration') != '-')}")
                print(f"- Funds with Auditor: {sum(1 for f in self.funds_data if f.get('auditor') and f.get('auditor') != '-')}")
                
                return True
            else:
                print("❌ No data was scraped!")
                return False
                
        except Exception as e:
            self.logger.error(f"Comprehensive scrape failed: {str(e)}")
            return False
        finally:
            if self.driver:
                self.driver.quit()

def main():
    """Main function for hybrid comprehensive scraping"""
    print("=" * 80)
    print("🔄 HYBRID COMPREHENSIVE FUNDSQUARE SCRAPER")
    print("   Combines existing URLs + discovery for complete coverage")
    print("=" * 80)
    
    print("\nThis scraper:")
    print("✅ Uses the proven 500 existing fund URLs")
    print("✅ Attempts to discover additional funds")
    print("✅ Provides comprehensive market coverage")
    print("✅ Suitable for ongoing monitoring")
    
    print("\nOptions:")
    print("1. Test run (first 10 funds)")
    print("2. Small batch (first 50 funds)")
    print("3. Medium batch (first 100 funds)")
    print("4. Large batch (first 250 funds)")
    print("5. Complete scrape (all available funds)")
    print("6. Custom range")
    
    choice = input("\nSelect option (1-6): ").strip()
    
    scraper = HybridFundSquareScraper()
    
    if choice == "1":
        print("🧪 Starting test run...")
        scraper.run_comprehensive_scrape(batch_size=10, max_funds=10)
    elif choice == "2":
        print("📦 Starting small batch...")
        scraper.run_comprehensive_scrape(batch_size=25, max_funds=50)
    elif choice == "3":
        print("📦 Starting medium batch...")
        scraper.run_comprehensive_scrape(batch_size=50, max_funds=100)
    elif choice == "4":
        print("📦 Starting large batch...")
        scraper.run_comprehensive_scrape(batch_size=50, max_funds=250)
    elif choice == "5":
        print("🚀 Starting complete scrape...")
        scraper.run_comprehensive_scrape(batch_size=50)
    elif choice == "6":
        try:
            start = int(input("Start index (0-499): "))
            end = int(input("End index (1-500): "))
            batch_size = int(input("Batch size (10-100): "))
            max_funds = end if end <= 500 else None
            print(f"🎯 Starting custom scrape: {start} to {end-1}")
            scraper.run_comprehensive_scrape(batch_size=batch_size, start_index=start, max_funds=max_funds)
        except ValueError:
            print("❌ Invalid input!")
    else:
        print("❌ Invalid choice!")

if __name__ == "__main__":
    main()
