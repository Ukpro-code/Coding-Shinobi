"""
FundSquare Web Scraper Configuration
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Credentials
    USERNAME = os.getenv('FUNDSQUARE_USERNAME', '')
    PASSWORD = os.getenv('FUNDSQUARE_PASSWORD', '')
    
    # URLs
    BASE_URL = 'https://www.fundsquare.net'
    LOGIN_URL = f'{BASE_URL}/login'
    SEARCH_URL = f'{BASE_URL}/search'
    HOMEPAGE_URL = f'{BASE_URL}/homepage'
    
    # Browser settings
    HEADLESS_MODE = os.getenv('HEADLESS_MODE', 'False').lower() == 'true'
    IMPLICIT_WAIT = int(os.getenv('IMPLICIT_WAIT', 10))
    PAGE_LOAD_TIMEOUT = int(os.getenv('PAGE_LOAD_TIMEOUT', 30))
    
    # Scraping settings
    DELAY_BETWEEN_REQUESTS = int(os.getenv('DELAY_BETWEEN_REQUESTS', 2))
    MAX_RETRIES = int(os.getenv('MAX_RETRIES', 3))
    OUTPUT_FORMAT = os.getenv('OUTPUT_FORMAT', 'excel')
    
    # Data fields to extract
    TARGET_FIELDS = [
        'isin',
        'fund_name',
        'fund_creation_date',
        'last_nav',
        'central_administration',
        'auditor',
        'custodian',
        'depositary',
        'prime_broker',
        'marketer_promoter',
        'transfer_agent',
        'legal_advisor'
    ]
    
    # Output settings
    OUTPUT_DIR = 'output'
    LOG_DIR = 'logs'
