"""
Alternative scraper setup that handles ChromeDriver issues
"""

import os
import requests
import zipfile
import platform
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

def download_chromedriver():
    """Download the correct ChromeDriver manually"""
    system = platform.system().lower()
    architecture = platform.machine().lower()
    
    # Determine the correct download URL based on system
    if system == "windows":
        if "64" in architecture or "amd64" in architecture:
            driver_url = "https://storage.googleapis.com/chrome-for-testing-public/138.0.7204.158/win64/chromedriver-win64.zip"
            driver_filename = "chromedriver.exe"
        else:
            driver_url = "https://storage.googleapis.com/chrome-for-testing-public/138.0.7204.158/win32/chromedriver-win32.zip"
            driver_filename = "chromedriver.exe"
    elif system == "darwin":  # macOS
        driver_url = "https://storage.googleapis.com/chrome-for-testing-public/138.0.7204.158/mac-x64/chromedriver-mac-x64.zip"
        driver_filename = "chromedriver"
    else:  # Linux
        driver_url = "https://storage.googleapis.com/chrome-for-testing-public/138.0.7204.158/linux64/chromedriver-linux64.zip"
        driver_filename = "chromedriver"
    
    # Create drivers directory
    drivers_dir = os.path.join(os.getcwd(), "drivers")
    os.makedirs(drivers_dir, exist_ok=True)
    
    driver_path = os.path.join(drivers_dir, driver_filename)
    
    # Check if driver already exists
    if os.path.exists(driver_path):
        print(f"ChromeDriver already exists at {driver_path}")
        return driver_path
    
    print(f"Downloading ChromeDriver from {driver_url}")
    
    try:
        # Download the zip file
        response = requests.get(driver_url, timeout=30)
        response.raise_for_status()
        
        zip_path = os.path.join(drivers_dir, "chromedriver.zip")
        with open(zip_path, 'wb') as f:
            f.write(response.content)
        
        # Extract the zip file
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(drivers_dir)
        
        # Find the extracted chromedriver executable
        for root, dirs, files in os.walk(drivers_dir):
            if driver_filename in files:
                extracted_path = os.path.join(root, driver_filename)
                # Move to the main drivers directory
                os.rename(extracted_path, driver_path)
                break
        
        # Make executable on Unix systems
        if system != "windows":
            os.chmod(driver_path, 0o755)
        
        # Clean up
        os.remove(zip_path)
        
        print(f"ChromeDriver downloaded successfully to {driver_path}")
        return driver_path
        
    except Exception as e:
        print(f"Failed to download ChromeDriver: {e}")
        return None

def setup_chrome_driver_alternative():
    """Alternative method to setup Chrome driver"""
    try:
        # Try to download ChromeDriver manually
        driver_path = download_chromedriver()
        
        if not driver_path or not os.path.exists(driver_path):
            print("Failed to setup ChromeDriver")
            return None
        
        # Setup Chrome options
        chrome_options = Options()
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        
        # Create service
        service = Service(driver_path)
        
        # Create driver
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        print("Chrome WebDriver setup successful!")
        return driver
        
    except Exception as e:
        print(f"Failed to setup Chrome WebDriver: {e}")
        return None

if __name__ == "__main__":
    print("Testing alternative ChromeDriver setup...")
    driver = setup_chrome_driver_alternative()
    
    if driver:
        try:
            driver.get("https://www.google.com")
            print("✓ Successfully navigated to Google")
            print(f"✓ Page title: {driver.title}")
        except Exception as e:
            print(f"✗ Failed to navigate: {e}")
        finally:
            driver.quit()
    else:
        print("✗ Failed to setup driver")
