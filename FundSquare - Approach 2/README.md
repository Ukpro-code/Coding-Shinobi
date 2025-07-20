# FundSquare Web Scraper

A comprehensive Python-based web scraper for extracting fund data from FundSquare.net.

## Features

- **Complete Fund Data Extraction**: Scrapes all available funds with detailed information
- **Authentication Support**: Logs in using provided credentials
- **Robust Error Handling**: Comprehensive logging and retry mechanisms
- **Multiple Output Formats**: Supports Excel, CSV, and JSON formats
- **Progress Tracking**: Saves progress periodically during scraping
- **Headless/GUI Modes**: Can run with or without browser UI
- **Rate Limiting**: Respects website with configurable delays

## Target Data Fields

The scraper extracts the following fund information:
- ISIN
- Fund Name
- Fund Creation Date
- Last NAV
- Central Administration
- Auditor
- Custodian
- Depositary
- Prime Broker
- Marketer/Promoter
- Transfer Agent
- Legal Advisor

## Installation

1. Install Python 3.8 or higher
2. Install required packages:
```bash
pip install -r requirements.txt
```

## Configuration

1. **Set up credentials**: Edit the `.env` file and add your FundSquare credentials:
```
FUNDSQUARE_USERNAME=your_username_here
FUNDSQUARE_PASSWORD=your_password_here
```

2. **Configure settings** (optional): Modify other settings in `.env`:
```
HEADLESS_MODE=False          # Set to True for headless browsing
DELAY_BETWEEN_REQUESTS=2     # Delay between requests (seconds)
OUTPUT_FORMAT=excel          # Output format: excel, csv, or json
```

## Usage

### Quick Start
```bash
python main.py
```

### Test Setup
Before running the full scraper, test your setup:
```bash
python test_scraper.py
```

### Output

Results are saved in the `output/` directory with timestamp:
- Excel: `fundsquare_final_YYYYMMDD_HHMMSS.xlsx`
- CSV: `fundsquare_final_YYYYMMDD_HHMMSS.csv`
- JSON: `fundsquare_final_YYYYMMDD_HHMMSS.json`

Logs are saved in the `logs/` directory.

## Project Structure

```
FundSquare - Approach 2/
├── main.py                 # Main execution script
├── fundsquare_scraper.py   # Core scraper class
├── config.py               # Configuration settings
├── test_scraper.py         # Testing utilities
├── requirements.txt        # Python dependencies
├── .env                   # Environment variables (credentials)
├── README.md              # This file
├── output/                # Scraped data output
└── logs/                  # Log files
```

## How It Works

1. **Setup**: Initializes Chrome WebDriver with optimized settings
2. **Authentication**: Logs into FundSquare using provided credentials
3. **Search**: Navigates to search page and performs comprehensive fund search
4. **Data Extraction**: Visits each fund detail page and extracts target information
5. **Output**: Saves data in specified format with progress tracking

## Error Handling

- Automatic retries for failed requests
- Comprehensive logging for debugging
- Progress saving every 50 processed funds
- Graceful handling of network issues and page load failures

## Monitoring and Ongoing Use

The scraper is designed for ongoing monitoring:
- Configure as scheduled task/cron job
- Progress tracking allows resuming interrupted sessions
- Detailed logs for monitoring scraping health
- Configurable delays to respect website resources

## Legal Considerations

- Ensure compliance with FundSquare's Terms of Service
- Respect rate limits and website resources
- Use appropriate delays between requests
- Consider reaching out to FundSquare for API access if available

## Troubleshooting

### Common Issues:

1. **Login Failed**: 
   - Verify credentials in `.env` file
   - Check if website structure has changed
   - Ensure you have valid FundSquare account

2. **WebDriver Issues**:
   - Update Chrome browser
   - Run `test_scraper.py` to diagnose issues

3. **No Data Extracted**:
   - Website structure may have changed
   - Check logs for specific error messages
   - Run in non-headless mode to see browser actions

4. **Slow Performance**:
   - Increase `DELAY_BETWEEN_REQUESTS` in `.env`
   - Check internet connection
   - Consider running in headless mode

## Support

For issues or questions:
1. Check the logs in `logs/` directory
2. Run `test_scraper.py` to diagnose setup issues
3. Review the configuration in `.env` and `config.py`

## Future Enhancements

- API integration if available
- Database storage options
- Real-time monitoring dashboard
- Data validation and cleaning
- Performance analytics
