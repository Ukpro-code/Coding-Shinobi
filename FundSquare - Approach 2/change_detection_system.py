"""
Change Detection System for Monthly Fund Monitoring
Tracks changes in funds and service providers between monthly runs
"""

import pandas as pd
import os
from datetime import datetime
from dataclasses import dataclass
from typing import Optional
import logging

@dataclass
class FundRecord:
    """Data structure for fund information"""
    url: str
    isin: str
    fund_name: str
    fund_creation_date: str
    last_nav: str
    central_administration: str
    auditor: str
    custodian: str
    depositary: str
    prime_broker: str
    marketer_promoter: str
    transfer_agent: str
    legal_advisor: str
    extraction_date: str

@dataclass
class ChangeRecord:
    """Data structure for tracking changes"""
    change_type: str  # 'NEW', 'REMOVED', 'SP_CHANGED', 'DATA_CHANGED'
    fund_identifier: str  # URL or ISIN
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    detection_date: Optional[str] = None

class ChangeDetectionSystem:
    def __init__(self, output_dir="output"):
        self.output_dir = output_dir
        self.current_funds = {}  # URL -> FundRecord
        self.previous_funds = {}  # URL -> FundRecord
        self.changes = []  # List of ChangeRecord
        self.setup_logging()
        
    def setup_logging(self):
        """Setup logging configuration"""
        os.makedirs("logs", exist_ok=True)
        
        log_filename = f"logs/change_detection_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_filename),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def load_current_funds(self, file_path):
        """Load current month's fund data"""
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith('.xlsx'):
                df = pd.read_excel(file_path)
            else:
                raise ValueError("Unsupported file format. Use CSV or Excel.")
            
            self.current_funds = {}
            
            for _, row in df.iterrows():
                fund_record = FundRecord(
                    url=str(row.get('URL', '')),
                    isin=str(row.get('ISIN', '')),
                    fund_name=str(row.get('Fund Name', '')),
                    fund_creation_date=str(row.get('Fund Creation Date', '')),
                    last_nav=str(row.get('Last NAV', '')),
                    central_administration=str(row.get('Central Administration', '')),
                    auditor=str(row.get('Auditor', '')),
                    custodian=str(row.get('Custodian', '')),
                    depositary=str(row.get('Depositary', '')),
                    prime_broker=str(row.get('Prime Broker', '')),
                    marketer_promoter=str(row.get('Marketer/Promoter', '')),
                    transfer_agent=str(row.get('Transfer Agent', '')),
                    legal_advisor=str(row.get('Legal Advisor', '')),
                    extraction_date=str(row.get('Extraction Date', ''))
                )
                
                if fund_record.url:
                    self.current_funds[fund_record.url] = fund_record
            
            self.logger.info(f"Loaded {len(self.current_funds)} current funds from {file_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to load current funds: {str(e)}")
            return False
    
    def load_previous_funds(self, file_path):
        """Load previous month's fund data"""
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith('.xlsx'):
                df = pd.read_excel(file_path)
            else:
                raise ValueError("Unsupported file format. Use CSV or Excel.")
            
            self.previous_funds = {}
            
            for _, row in df.iterrows():
                fund_record = FundRecord(
                    url=str(row.get('URL', '')),
                    isin=str(row.get('ISIN', '')),
                    fund_name=str(row.get('Fund Name', '')),
                    fund_creation_date=str(row.get('Fund Creation Date', '')),
                    last_nav=str(row.get('Last NAV', '')),
                    central_administration=str(row.get('Central Administration', '')),
                    auditor=str(row.get('Auditor', '')),
                    custodian=str(row.get('Custodian', '')),
                    depositary=str(row.get('Depositary', '')),
                    prime_broker=str(row.get('Prime Broker', '')),
                    marketer_promoter=str(row.get('Marketer/Promoter', '')),
                    transfer_agent=str(row.get('Transfer Agent', '')),
                    legal_advisor=str(row.get('Legal Advisor', '')),
                    extraction_date=str(row.get('Extraction Date', ''))
                )
                
                if fund_record.url:
                    self.previous_funds[fund_record.url] = fund_record
            
            self.logger.info(f"Loaded {len(self.previous_funds)} previous funds from {file_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to load previous funds: {str(e)}")
            return False
    
    def detect_new_removed_funds(self):
        """Detect new and removed funds based on URLs"""
        current_urls = set(self.current_funds.keys())
        previous_urls = set(self.previous_funds.keys())
        
        # New funds
        new_urls = current_urls - previous_urls
        for url in new_urls:
            fund = self.current_funds[url]
            change = ChangeRecord(
                change_type='NEW',
                fund_identifier=url,
                new_value=fund.fund_name,
                detection_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            )
            self.changes.append(change)
        
        # Removed funds
        removed_urls = previous_urls - current_urls
        for url in removed_urls:
            fund = self.previous_funds[url]
            change = ChangeRecord(
                change_type='REMOVED',
                fund_identifier=url,
                old_value=fund.fund_name,
                detection_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            )
            self.changes.append(change)
        
        self.logger.info(f"Detected {len(new_urls)} new funds and {len(removed_urls)} removed funds")
        return len(new_urls), len(removed_urls)
    
    def detect_isin_changes(self):
        """Detect changes using ISIN-based comparison"""
        # Create ISIN mappings for both datasets
        current_isin_map = {}
        previous_isin_map = {}
        
        for url, fund in self.current_funds.items():
            if fund.isin and fund.isin != 'nan':
                current_isin_map[fund.isin] = fund
        
        for url, fund in self.previous_funds.items():
            if fund.isin and fund.isin != 'nan':
                previous_isin_map[fund.isin] = fund
        
        current_isins = set(current_isin_map.keys())
        previous_isins = set(previous_isin_map.keys())
        
        # New ISINs
        new_isins = current_isins - previous_isins
        for isin in new_isins:
            fund = current_isin_map[isin]
            change = ChangeRecord(
                change_type='NEW',
                fund_identifier=isin,
                new_value=fund.fund_name,
                detection_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            )
            self.changes.append(change)
        
        # Removed ISINs
        removed_isins = previous_isins - current_isins
        for isin in removed_isins:
            fund = previous_isin_map[isin]
            change = ChangeRecord(
                change_type='REMOVED',
                fund_identifier=isin,
                old_value=fund.fund_name,
                detection_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            )
            self.changes.append(change)
        
        self.logger.info(f"ISIN-based: {len(new_isins)} new, {len(removed_isins)} removed")
        return len(new_isins), len(removed_isins)
    
    def detect_service_provider_changes(self):
        """Detect changes in service providers"""
        sp_fields = [
            'central_administration', 'auditor', 'custodian', 'depositary',
            'prime_broker', 'marketer_promoter', 'transfer_agent', 'legal_advisor'
        ]
        
        sp_changes = 0
        
        # Check funds that exist in both datasets
        common_urls = set(self.current_funds.keys()) & set(self.previous_funds.keys())
        
        for url in common_urls:
            current_fund = self.current_funds[url]
            previous_fund = self.previous_funds[url]
            
            for field in sp_fields:
                current_value = getattr(current_fund, field, '').strip()
                previous_value = getattr(previous_fund, field, '').strip()
                
                if current_value != previous_value and current_value and previous_value:
                    change = ChangeRecord(
                        change_type='SP_CHANGED',
                        fund_identifier=url,
                        field_name=field,
                        old_value=previous_value,
                        new_value=current_value,
                        detection_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    )
                    self.changes.append(change)
                    sp_changes += 1
        
        self.logger.info(f"Detected {sp_changes} service provider changes")
        return sp_changes
    
    def detect_data_changes(self):
        """Detect other data changes (excluding service providers)"""
        data_fields = ['fund_name', 'fund_creation_date', 'last_nav']
        data_changes = 0
        
        # Check funds that exist in both datasets
        common_urls = set(self.current_funds.keys()) & set(self.previous_funds.keys())
        
        for url in common_urls:
            current_fund = self.current_funds[url]
            previous_fund = self.previous_funds[url]
            
            for field in data_fields:
                current_value = getattr(current_fund, field, '').strip()
                previous_value = getattr(previous_fund, field, '').strip()
                
                if current_value != previous_value and current_value and previous_value:
                    change = ChangeRecord(
                        change_type='DATA_CHANGED',
                        fund_identifier=url,
                        field_name=field,
                        old_value=previous_value,
                        new_value=current_value,
                        detection_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    )
                    self.changes.append(change)
                    data_changes += 1
        
        self.logger.info(f"Detected {data_changes} data changes")
        return data_changes
    
    def run_change_detection(self):
        """Run complete change detection analysis"""
        self.logger.info("Starting change detection analysis...")
        self.changes = []  # Reset changes
        
        # Detect new/removed funds by URL
        new_funds_url, removed_funds_url = self.detect_new_removed_funds()
        
        # Detect new/removed funds by ISIN
        new_funds_isin, removed_funds_isin = self.detect_isin_changes()
        
        # Detect service provider changes
        sp_changes = self.detect_service_provider_changes()
        
        # Detect other data changes
        data_changes = self.detect_data_changes()
        
        total_changes = len(self.changes)
        
        self.logger.info(f"Change detection completed. Total changes: {total_changes}")
        
        return {
            'total_changes': total_changes,
            'new_funds_url': new_funds_url,
            'removed_funds_url': removed_funds_url,
            'new_funds_isin': new_funds_isin,
            'removed_funds_isin': removed_funds_isin,
            'sp_changes': sp_changes,
            'data_changes': data_changes
        }
    
    def generate_summary_report(self, stats):
        """Generate summary change report"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_lines = [
            "FUND CHANGE DETECTION SUMMARY",
            "=" * 50,
            f"Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"Current Funds: {len(self.current_funds)}",
            f"Previous Funds: {len(self.previous_funds)}",
            "",
            "CHANGE SUMMARY:",
            "-" * 30,
            f"Total Changes Detected: {stats['total_changes']}",
            "",
            "URL-Based Analysis:",
            f"  New Funds: {stats['new_funds_url']}",
            f"  Removed Funds: {stats['removed_funds_url']}",
            "",
            "ISIN-Based Analysis:",
            f"  New Funds: {stats['new_funds_isin']}",
            f"  Removed Funds: {stats['removed_funds_isin']}",
            "",
            "Service Provider Changes: {stats['sp_changes']}",
            f"Other Data Changes: {stats['data_changes']}",
            "",
            "=" * 50
        ]
        
        report_content = "\n".join(report_lines)
        
        # Save summary report
        summary_file = f"{self.output_dir}/change_summary_{timestamp}.txt"
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(report_content)
        
        return summary_file, report_content
    
    def generate_detailed_change_log(self):
        """Generate detailed change log"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Convert changes to DataFrame
        change_data = []
        for change in self.changes:
            change_data.append({
                'Change_Type': change.change_type,
                'Fund_Identifier': change.fund_identifier,
                'Field_Name': change.field_name or '',
                'Old_Value': change.old_value or '',
                'New_Value': change.new_value or '',
                'Detection_Date': change.detection_date
            })
        
        if change_data:
            df = pd.DataFrame(change_data)
            
            # Save as CSV
            csv_file = f"{self.output_dir}/detailed_changes_{timestamp}.csv"
            df.to_csv(csv_file, index=False, encoding='utf-8')
            
            # Save as Excel with multiple sheets
            excel_file = f"{self.output_dir}/detailed_changes_{timestamp}.xlsx"
            
            with pd.ExcelWriter(excel_file) as writer:
                # All changes
                df.to_excel(writer, sheet_name='All_Changes', index=False)
                
                # Changes by type
                for change_type in df['Change_Type'].unique():
                    type_df = df[df['Change_Type'] == change_type]
                    sheet_name = change_type.replace('_', ' ').title()
                    type_df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            return csv_file, excel_file
        
        return None, None
    
    def run_complete_analysis(self, current_file, previous_file):
        """Run complete change detection analysis"""
        try:
            self.logger.info("Starting complete change detection analysis...")
            
            # Load data files
            if not self.load_current_funds(current_file):
                return False
            
            if not self.load_previous_funds(previous_file):
                return False
            
            # Run change detection
            stats = self.run_change_detection()
            
            # Generate reports
            summary_file, summary_content = self.generate_summary_report(stats)
            csv_file, excel_file = self.generate_detailed_change_log()
            
            # Print summary
            print("\n" + summary_content)
            
            print("\nReports Generated:")
            print(f"  Summary: {summary_file}")
            if csv_file:
                print(f"  Detailed CSV: {csv_file}")
            if excel_file:
                print(f"  Detailed Excel: {excel_file}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Complete analysis failed: {str(e)}")
            return False

class MonthlyMonitoringSystem:
    """System for managing monthly fund monitoring"""
    
    def __init__(self, base_dir="monthly_monitoring"):
        self.base_dir = base_dir
        os.makedirs(base_dir, exist_ok=True)
        self.setup_logging()
    
    def setup_logging(self):
        """Setup logging configuration"""
        os.makedirs("logs", exist_ok=True)
        
        log_filename = f"logs/monthly_monitoring_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_filename),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def archive_monthly_data(self, data_file, month_year=None):
        """Archive current month's data"""
        if not month_year:
            month_year = datetime.now().strftime('%Y_%m')
        
        archive_dir = os.path.join(self.base_dir, month_year)
        os.makedirs(archive_dir, exist_ok=True)
        
        # Copy data file to archive
        import shutil
        filename = os.path.basename(data_file)
        archived_file = os.path.join(archive_dir, filename)
        shutil.copy2(data_file, archived_file)
        
        self.logger.info(f"Archived {data_file} to {archived_file}")
        return archived_file
    
    def find_previous_month_data(self, current_month_year=None):
        """Find previous month's data file"""
        if not current_month_year:
            current_date = datetime.now()
        else:
            current_date = datetime.strptime(current_month_year, '%Y_%m')
        
        # Calculate previous month
        if current_date.month == 1:
            prev_month_year = f"{current_date.year - 1}_12"
        else:
            prev_month_year = f"{current_date.year}_{current_date.month - 1:02d}"
        
        prev_dir = os.path.join(self.base_dir, prev_month_year)
        
        if os.path.exists(prev_dir):
            # Look for data files
            for file in os.listdir(prev_dir):
                if file.endswith(('.csv', '.xlsx')) and 'fund' in file.lower():
                    return os.path.join(prev_dir, file)
        
        return None
    
    def run_monthly_comparison(self, current_data_file):
        """Run monthly comparison with previous month"""
        try:
            # Archive current month's data
            current_month_year = datetime.now().strftime('%Y_%m')
            archived_file = self.archive_monthly_data(current_data_file, current_month_year)
            
            # Find previous month's data
            previous_file = self.find_previous_month_data(current_month_year)
            
            if not previous_file:
                self.logger.warning("No previous month data found. This might be the first run.")
                print("No previous month data found for comparison.")
                return True
            
            # Run change detection
            change_detector = ChangeDetectionSystem(self.base_dir)
            success = change_detector.run_complete_analysis(archived_file, previous_file)
            
            if success:
                print("\n✓ Monthly comparison completed successfully!")
                print(f"Current: {archived_file}")
                print(f"Previous: {previous_file}")
            
            return success
            
        except Exception as e:
            self.logger.error(f"Monthly comparison failed: {str(e)}")
            return False

if __name__ == "__main__":
    print("Change Detection System")
    print("=" * 50)
    
    choice = input("\nSelect operation:\n1. Run Change Detection\n2. Setup Monthly Monitoring\n3. Test with Sample Data\n\nEnter choice (1-3): ")
    
    if choice == "1":
        current_file = input("Enter current month data file path: ").strip()
        previous_file = input("Enter previous month data file path: ").strip()
        
        if os.path.exists(current_file) and os.path.exists(previous_file):
            detector = ChangeDetectionSystem()
            success = detector.run_complete_analysis(current_file, previous_file)
            
            if success:
                print("✓ Change detection completed successfully!")
            else:
                print("✗ Change detection failed!")
        else:
            print("✗ One or both files do not exist!")
    
    elif choice == "2":
        current_file = input("Enter current month fund data file path: ").strip()
        
        if os.path.exists(current_file):
            monitoring = MonthlyMonitoringSystem()
            success = monitoring.run_monthly_comparison(current_file)
            
            if success:
                print("✓ Monthly monitoring setup completed!")
            else:
                print("✗ Monthly monitoring setup failed!")
        else:
            print("✗ Current data file does not exist!")
    
    elif choice == "3":
        print("Creating sample data for testing...")
        
        # Create sample current data
        current_sample = pd.DataFrame({
            'URL': [
                'https://fundsquare.net/fund1',
                'https://fundsquare.net/fund2',
                'https://fundsquare.net/fund3'
            ],
            'ISIN': ['LU123456789', 'IE987654321', 'FR456789123'],
            'Fund Name': ['Fund A', 'Fund B Updated', 'Fund C'],
            'Central Administration': ['Admin A', 'Admin B', 'Admin C'],
            'Auditor': ['Auditor X', 'Auditor Y Changed', 'Auditor Z']
        })
        
        # Create sample previous data
        previous_sample = pd.DataFrame({
            'URL': [
                'https://fundsquare.net/fund1',
                'https://fundsquare.net/fund2',
                'https://fundsquare.net/fund4'  # This one was removed
            ],
            'ISIN': ['LU123456789', 'IE987654321', 'DE111222333'],
            'Fund Name': ['Fund A', 'Fund B', 'Fund D'],
            'Central Administration': ['Admin A', 'Admin B', 'Admin D'],
            'Auditor': ['Auditor X', 'Auditor Y', 'Auditor W']
        })
        
        current_sample.to_csv('sample_current.csv', index=False)
        previous_sample.to_csv('sample_previous.csv', index=False)
        
        # Run change detection on samples
        detector = ChangeDetectionSystem()
        success = detector.run_complete_analysis('sample_current.csv', 'sample_previous.csv')
        
        if success:
            print("✓ Sample change detection completed!")
        else:
            print("✗ Sample change detection failed!")
    
    else:
        print("Invalid choice!")
