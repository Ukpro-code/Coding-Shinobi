"""
Cleanup Script for FundSquare Project
Removes redundant files and organizes the project structure
"""

import os
from datetime import datetime

def create_cleanup_plan():
    """Create a plan for cleaning up the project"""
    
    # Files to keep (core functionality)
    keep_files = {
        # Core scrapers
        'simple_scraper.py',           # Working scraper - KEEP
        'hybrid_scraper.py',           # Production scraper - KEEP
        
        # New comprehensive system
        'sp_extraction_system.py',     # Service provider extraction - KEEP
        'multi_strategy_discovery.py', # Multi-strategy discovery - KEEP
        'change_detection_system.py',  # Change detection - KEEP
        'comprehensive_controller.py', # Main controller - KEEP
        
        # Configuration and setup
        'config.py',                   # Configuration - KEEP
        '.env',                        # Environment variables - KEEP
        'requirements.txt',            # Dependencies - KEEP
        'alternative_driver_setup.py', # ChromeDriver setup - KEEP
        
        # Documentation
        'README.md',                   # Documentation - KEEP
        
        # Data files with results
        'hybrid_comprehensive_batch_1_20250721_001332.xlsx',
        'hybrid_comprehensive_complete_20250721_001332.xlsx',
        'test_scrape_results_20250720_234041.xlsx'
    }
    
    # Files to remove (redundant/obsolete)
    remove_files = {
        # Old/redundant scrapers
        'fundsquare_scraper.py',       # Superseded by simple_scraper.py
        'production_scraper.py',       # Superseded by hybrid_scraper.py
        'comprehensive_scraper.py',    # Superseded by new system
        'intelligent_discovery.py',   # Superseded by multi_strategy_discovery.py
        'structure_explorer.py',      # Functionality moved to new system
        
        # Test/debug files
        'check_login_elements.py',    # Debug file
        'comprehensive_login_test.py', # Debug file
        'debug_login.py',             # Debug file
        'detailed_login_test.py',     # Debug file
        'investigate_login.py',       # Debug file
        'quick_test.py',              # Debug file
        'test_real_urls.py',          # Debug file
        'test_scraper.py',            # Debug file
        'test_working_pattern.py',   # Debug file
        
        # Old setup files
        'main.py',                    # Superseded by comprehensive_controller.py
        'setup.py',                   # Not needed
        
        # HTML/image debug files
        'after_login.html',
        'after_login.png',
        'current_page.png',
        'current_page_source.html',
        
        # Other
        'Fundsquare-Approach 2',     # Unclear file
        'README_COMPREHENSIVE.md'    # Duplicate README
    }
    
    return keep_files, remove_files

def cleanup_logs():
    """Clean up old log files, keeping only recent ones"""
    logs_dir = "logs"
    if not os.path.exists(logs_dir):
        return
    
    log_files = os.listdir(logs_dir)
    print(f"\n📂 Found {len(log_files)} log files")
    
    # Keep only logs from today and yesterday
    today = datetime.now().strftime('%Y%m%d')
    yesterday = (datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)).strftime('%Y%m%d')
    
    kept_logs = []
    removed_logs = []
    
    for log_file in log_files:
        # Extract date from filename (format: name_YYYYMMDD_HHMMSS.log)
        try:
            parts = log_file.split('_')
            if len(parts) >= 2:
                date_part = parts[-2]  # Second to last part should be date
                if date_part in [today, yesterday]:
                    kept_logs.append(log_file)
                else:
                    removed_logs.append(log_file)
            else:
                removed_logs.append(log_file)
        except:
            removed_logs.append(log_file)
    
    return kept_logs, removed_logs

def perform_cleanup(dry_run=True):
    """Perform the actual cleanup"""
    keep_files, remove_files = create_cleanup_plan()
    kept_logs, removed_logs = cleanup_logs()
    
    print("🧹 FUNDSQUARE PROJECT CLEANUP")
    print("=" * 40)
    
    if dry_run:
        print("🔍 DRY RUN MODE - No files will be deleted")
    else:
        print("⚠️  LIVE MODE - Files will be permanently deleted!")
    
    print(f"\n📊 CLEANUP SUMMARY:")
    print(f"   Files to keep: {len(keep_files)}")
    print(f"   Files to remove: {len(remove_files)}")
    print(f"   Log files to keep: {len(kept_logs)}")
    print(f"   Log files to remove: {len(removed_logs)}")
    
    # Show files to be removed
    print(f"\n❌ FILES TO BE REMOVED:")
    print("-" * 30)
    for file in sorted(remove_files):
        if os.path.exists(file):
            size = os.path.getsize(file)
            print(f"   🗑️  {file} ({size:,} bytes)")
    
    print(f"\n❌ OLD LOG FILES TO BE REMOVED:")
    print("-" * 35)
    for log_file in sorted(removed_logs):
        log_path = os.path.join("logs", log_file)
        if os.path.exists(log_path):
            size = os.path.getsize(log_path)
            print(f"   🗑️  {log_file} ({size:,} bytes)")
    
    # Show files to be kept
    print(f"\n✅ CORE FILES TO KEEP:")
    print("-" * 25)
    for file in sorted(keep_files):
        if os.path.exists(file):
            size = os.path.getsize(file)
            print(f"   📁 {file} ({size:,} bytes)")
    
    print(f"\n✅ RECENT LOG FILES TO KEEP:")
    print("-" * 30)
    for log_file in sorted(kept_logs):
        log_path = os.path.join("logs", log_file)
        if os.path.exists(log_path):
            size = os.path.getsize(log_path)
            print(f"   📁 {log_file} ({size:,} bytes)")
    
    # Calculate space savings
    total_removed_size = 0
    for file in remove_files:
        if os.path.exists(file):
            total_removed_size += os.path.getsize(file)
    
    for log_file in removed_logs:
        log_path = os.path.join("logs", log_file)
        if os.path.exists(log_path):
            total_removed_size += os.path.getsize(log_path)
    
    print(f"\n💾 SPACE SAVINGS: {total_removed_size:,} bytes ({total_removed_size/1024/1024:.2f} MB)")
    
    if not dry_run:
        print(f"\n🗑️  PERFORMING CLEANUP...")
        
        removed_count = 0
        
        # Remove files
        for file in remove_files:
            if os.path.exists(file):
                try:
                    os.remove(file)
                    print(f"   ✓ Removed {file}")
                    removed_count += 1
                except Exception as e:
                    print(f"   ❌ Failed to remove {file}: {e}")
        
        # Remove old log files
        for log_file in removed_logs:
            log_path = os.path.join("logs", log_file)
            if os.path.exists(log_path):
                try:
                    os.remove(log_path)
                    print(f"   ✓ Removed {log_file}")
                    removed_count += 1
                except Exception as e:
                    print(f"   ❌ Failed to remove {log_file}: {e}")
        
        print(f"\n🎉 CLEANUP COMPLETED!")
        print(f"   Removed {removed_count} files")
        print(f"   Saved {total_removed_size:,} bytes")
    
    return len(remove_files) + len(removed_logs), total_removed_size

def create_project_structure_doc():
    """Create documentation of the final project structure"""
    structure = """
# FundSquare Comprehensive Discovery System

## 📁 Project Structure

### Core System Files
```
📦 FundSquare-Approach-2/
├── 🔧 Core Scrapers
│   ├── simple_scraper.py           # Basic working scraper
│   └── hybrid_scraper.py           # Production scraper with existing URLs
│
├── 🚀 Comprehensive Discovery System
│   ├── sp_extraction_system.py     # Extract service providers from dropdowns
│   ├── multi_strategy_discovery.py # Multi-strategy fund discovery
│   ├── change_detection_system.py  # Monthly change detection
│   └── comprehensive_controller.py # Main system controller
│
├── ⚙️ Configuration & Setup
│   ├── config.py                   # Configuration management
│   ├── .env                        # Environment variables
│   ├── requirements.txt            # Python dependencies
│   └── alternative_driver_setup.py # ChromeDriver setup utility
│
├── 📊 Data & Results
│   ├── output/                     # Generated results and reports
│   ├── logs/                       # Application logs
│   └── *.xlsx                      # Historical results
│
└── 📖 Documentation
    └── README.md                   # Project documentation
```

### System Capabilities

1. **Service Provider Extraction**
   - Extract all service providers from FundSquare dropdown menus
   - Support both JavaScript and HTML parsing methods
   - Generate master CSV for reference

2. **Multi-Strategy Discovery**
   - Service Provider-based search
   - ISIN pattern search
   - Legal structure search
   - Strategy performance analytics

3. **Change Detection & Monitoring**
   - URL-based and ISIN-based comparison
   - Service provider change tracking
   - Monthly monitoring with archival
   - Detailed change reports

4. **Comprehensive Controller**
   - Complete pipeline automation
   - Monthly monitoring mode
   - User-friendly interface
   - Error handling and logging

### Usage Examples

```bash
# Run complete pipeline
python comprehensive_controller.py

# Extract service providers only
python sp_extraction_system.py

# Run multi-strategy discovery
python multi_strategy_discovery.py

# Perform change detection
python change_detection_system.py
```
"""
    
    with open("PROJECT_STRUCTURE.md", "w", encoding="utf-8") as f:
        f.write(structure)
    
    print("📋 Created PROJECT_STRUCTURE.md with final project documentation")

if __name__ == "__main__":
    print("🧹 FundSquare Project Cleanup Utility")
    print("=" * 45)
    
    # First, show what would be cleaned up
    print("\n🔍 Analyzing project structure...")
    file_count, total_size = perform_cleanup(dry_run=True)
    
    # Ask for confirmation
    if file_count > 0:
        print(f"\n⚠️  This will remove {file_count} files and free up {total_size/1024/1024:.2f} MB of space.")
        confirm = input("\nProceed with cleanup? (y/N): ").strip().lower()
        
        if confirm == 'y':
            print(f"\n🗑️  Performing cleanup...")
            perform_cleanup(dry_run=False)
            
            # Create project structure documentation
            create_project_structure_doc()
            
            print(f"\n✨ Cleanup completed successfully!")
            print(f"📋 Check PROJECT_STRUCTURE.md for the final project layout")
        else:
            print(f"\n❌ Cleanup cancelled.")
    else:
        print(f"\n✅ No files need to be cleaned up!")
