
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
