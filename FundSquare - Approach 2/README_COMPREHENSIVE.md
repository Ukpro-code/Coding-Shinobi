# FundSquare Comprehensive Discovery System

A comprehensive solution for extracting service providers, discovering funds, and monitoring changes on the FundSquare platform.

## 🚀 Features

### 1. Service Provider Extraction
- **Automated Dropdown Extraction**: Extract all service providers from FundSquare's advanced search dropdowns
- **Dual Extraction Methods**: JavaScript and HTML parsing for maximum reliability
- **Categorized Output**: Service providers organized by categories (Auditors, Custodians, etc.)
- **Validation**: Match dropdown values with actual search terms

### 2. Multi-Strategy Fund Discovery
- **Service Provider Search**: Systematic search using extracted service providers
- **ISIN Pattern Search**: Discovery using country code patterns (LU*, IE*, FR*, etc.)
- **Legal Structure Search**: Search by fund legal structures (SICAV, UCITS, etc.)
- **Strategy Performance Tracking**: Comprehensive analytics on strategy effectiveness

### 3. Change Detection & Monthly Monitoring
- **URL-Based Comparison**: Track new/removed funds by URL
- **ISIN-Based Comparison**: Cross-reference using ISIN codes for validation
- **Service Provider Changes**: Detect changes in fund service providers
- **Data Changes**: Monitor updates to fund information
- **Monthly Automation**: Automated monthly comparison with archiving

### 4. Comprehensive Data Extraction
- **12 Key Fields**: ISIN, Fund Name, Creation Date, Last NAV, Central Administration, Auditor, Custodian, Depositary, Prime Broker, Marketer/Promoter, Transfer Agent, Legal Advisor
- **Batch Processing**: Handle large numbers of fund URLs efficiently
- **Deduplication**: URL and ISIN-based duplicate detection
- **Progress Tracking**: Real-time progress monitoring

## 📁 File Structure

```
FundSquare - Approach 2/
├── comprehensive_controller.py      # Main system controller
├── sp_extraction_system.py          # Service provider extraction
├── multi_strategy_discovery.py      # Multi-strategy discovery engine
├── change_detection_system.py       # Change detection and monitoring
├── simple_scraper.py               # Core fund data scraper
├── config.py                       # Configuration management
├── .env                           # Credentials (USERNAME/PASSWORD)
├── drivers/                       # ChromeDriver directory
├── output/                        # All output files
├── logs/                         # System logs
└── monthly_monitoring/           # Monthly data archives
```

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
pip install selenium pandas beautifulsoup4 lxml openpyxl python-dotenv
```

### 2. Configure ChromeDriver
- ChromeDriver is automatically managed by `alternative_driver_setup.py`
- Supports Windows, macOS, and Linux
- Auto-downloads version 138.0.7204.158

### 3. Set Credentials
Create/update `.env` file:
```
FUNDSQUARE_USERNAME=your_username
FUNDSQUARE_PASSWORD=your_password
```

### 4. Run the System
```bash
python comprehensive_controller.py
```

## 📊 Usage Guide

### Quick Start - Complete Pipeline
1. Run `python comprehensive_controller.py`
2. Select option **5** (Run Complete Pipeline)
3. System will:
   - Extract service providers (if not done before)
   - Run all discovery strategies
   - Scrape fund details
   - Generate analytics and reports

### Service Provider Extraction
- **Frequency**: Once (service providers are relatively stable)
- **Output**: `service_providers_master.csv`
- **Method**: Automated dropdown extraction with both JS and HTML parsing

### Monthly Discovery Process
1. **Service Provider Discovery**: Search using all extracted SPs
2. **ISIN Pattern Discovery**: Country code-based search
3. **Legal Structure Discovery**: Structure type-based search
4. **Deduplication**: Remove duplicates by URL and ISIN
5. **Analytics**: Strategy performance metrics

### Change Detection
- **Both URL and ISIN-based**: Comprehensive comparison approach
- **Change Types**: New funds, removed funds, SP changes, data changes
- **Output Formats**: Summary reports AND detailed change logs
- **Monthly Automation**: Automatic archiving and comparison

## 📈 Strategy Tracking

### Granularity Options
- **Individual SP Tracking**: Track performance by specific service provider
- **SP Category Tracking**: Track by service provider categories
- **Combined Analytics**: Overall strategy performance

### Metrics Tracked
- **URLs Found**: Total URLs discovered per strategy
- **Success Rate**: Percentage of successful extractions
- **Overlap Analysis**: Identify duplicate discoveries across strategies
- **Execution Time**: Performance monitoring
- **Unique Funds**: Count of unique fund discoveries

### Output Formats
- **Separate CSV per Strategy**: Individual strategy results
- **Combined Analytics File**: Comprehensive performance overview
- **Strategy Comparison**: Head-to-head strategy analysis

## 🔄 Monthly Monitoring Workflow

### Automated Process
1. **Current Month Discovery**: Run all strategies for current month
2. **Data Archiving**: Archive current results with timestamp
3. **Previous Month Lookup**: Automatically find previous month's data
4. **Change Detection**: Compare current vs previous
5. **Report Generation**: Summary and detailed change reports

### Change Types Detected
- **New Funds**: Funds discovered this month but not last month
- **Removed Funds**: Funds from last month not found this month
- **SP Changes**: Service provider modifications
- **Data Changes**: Updates to fund information

### Report Formats
- **Summary Report**: High-level change overview
- **Detailed Change Log**: Line-by-line change tracking
- **Excel Reports**: Multi-sheet detailed analysis

## 🎯 Advanced Features

### Strategy Performance Analytics
```python
# Example analytics output
Strategy: SP_Search_Auditor
  URLs Found: 145
  Success Rate: 94.5%
  Unique Funds: 132
  Avg Time: 45.2s

Strategy: ISIN_Pattern_Search
  URLs Found: 89
  Success Rate: 87.6%
  Unique Funds: 76
  Avg Time: 23.1s
```

### Deduplication System
- **Primary**: URL-based deduplication
- **Validation**: ISIN-based cross-check
- **Conflict Resolution**: Configurable preference rules

### Error Handling
- **Comprehensive Logging**: Detailed log files for all operations
- **Graceful Degradation**: Continue processing despite individual failures
- **Recovery Mechanisms**: Automatic retry logic for failed operations

## 📋 Configuration Options

### Service Provider Extraction
```python
# Extract dropdown options via JavaScript or HTML parsing
extraction_method = "both"  # "js", "html", or "both"

# Validation approach
validate_terms = True  # Match dropdown values with search terms
```

### Strategy Configuration
```python
# ISIN patterns to search
country_codes = ['LU', 'IE', 'FR', 'DE', 'GB', 'NL', 'AT', 'BE', 'CH', 'IT']

# Legal structures to search
structures = ['SICAV', 'FCP', 'UCITS', 'AIF', 'ETF', 'OEIC']
```

### Change Detection Settings
```python
# Comparison basis
comparison_methods = ["url", "isin"]  # Both URL and ISIN-based

# Change types to detect
change_types = ["new_funds", "removed_funds", "sp_changes", "data_changes"]

# Report formats
report_formats = ["summary", "detailed"]  # Both for beta stage
```

## 🔧 Troubleshooting

### Common Issues

1. **ChromeDriver Issues**
   - Run `alternative_driver_setup.py` to auto-download correct version
   - Ensure Chrome browser is updated

2. **Login Failures**
   - Verify credentials in `.env` file
   - Check for spaces or special characters in password

3. **No Service Providers Found**
   - Ensure you're logged in successfully
   - Check if advanced search page structure has changed

4. **Discovery Returns No Results**
   - Verify service providers were extracted first
   - Check FundSquare search restrictions (minimum 3 characters)

### Debug Mode
```bash
# Enable detailed logging
export LOG_LEVEL=DEBUG
python comprehensive_controller.py
```

## 📊 Expected Results

### Service Provider Extraction
- **Typical Output**: 500-1000+ service providers across 8-12 categories
- **File Size**: ~50-200KB CSV file
- **Processing Time**: 2-5 minutes

### Discovery Results
- **URLs Discovered**: 1000-5000+ unique fund URLs
- **Strategy Overlap**: 10-30% overlap between strategies
- **Processing Time**: 30-90 minutes for complete discovery

### Monthly Changes
- **Typical Changes**: 5-20% of funds show some change monthly
- **New Funds**: 2-10% new funds per month
- **SP Changes**: 1-5% of funds change service providers

## 🚀 Performance Optimization

### Parallel Processing
- Service provider searches can be parallelized
- Implement rate limiting to avoid overwhelming FundSquare

### Caching
- Cache service provider lists (update monthly)
- Store successful URL patterns for optimization

### Incremental Updates
- Track last discovery date per strategy
- Implement incremental discovery for large datasets

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Service provider extraction
- ✅ Multi-strategy discovery
- ✅ Change detection system
- ✅ Strategy analytics

### Phase 2 (Planned)
- 🔄 Real-time monitoring
- 🔄 API integration
- 🔄 Machine learning pattern detection
- 🔄 Automated report distribution

### Phase 3 (Future)
- 🔮 Predictive analytics
- 🔮 Integration with other data sources
- 🔮 Advanced visualization dashboard
- 🔮 Mobile monitoring app

## 📞 Support

For issues, questions, or feature requests:
1. Check the logs in `logs/` directory
2. Review configuration in `config.py`
3. Verify credentials in `.env` file
4. Check ChromeDriver setup with `alternative_driver_setup.py`

## 🔒 Security Notes

- Store credentials securely in `.env` file
- Never commit credentials to version control
- Use dedicated FundSquare account for automation
- Implement appropriate rate limiting to respect FundSquare's servers
