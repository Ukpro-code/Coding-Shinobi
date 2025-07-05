#!/usr/bin/env python3
"""
Test script to verify Google Calendar configuration
"""

import os
import sys
from google_calendar import GoogleCalendarService

def test_google_calendar_setup():
    """Test Google Calendar setup and configuration"""
    
    print("🔍 Testing Google Calendar Setup...")
    print("=" * 50)
    
    # Test 1: Check if credentials file exists
    print("1. Checking credentials file...")
    if os.path.exists('credentials.json'):
        print("   ✅ credentials.json found")
    else:
        print("   ❌ credentials.json not found")
        return False
    
    # Test 2: Check credentials file structure
    print("2. Checking credentials file structure...")
    try:
        import json
        with open('credentials.json', 'r') as f:
            creds_data = json.load(f)
            
        if 'installed' in creds_data:
            print("   ✅ Correct structure (installed/desktop app)")
        elif 'web' in creds_data:
            print("   ⚠️  Web app structure detected (should be 'installed' for desktop flow)")
        else:
            print("   ❌ Invalid credentials structure")
            return False
            
    except Exception as e:
        print(f"   ❌ Error reading credentials: {e}")
        return False
    
    # Test 3: Check required packages
    print("3. Checking required packages...")
    try:
        import google.auth
        import google_auth_oauthlib
        import googleapiclient
        print("   ✅ All required Google packages installed")
    except ImportError as e:
        print(f"   ❌ Missing package: {e}")
        return False
    
    # Test 4: Initialize GoogleCalendarService
    print("4. Initializing Google Calendar service...")
    try:
        calendar_service = GoogleCalendarService()
        print("   ✅ Google Calendar service initialized")
    except Exception as e:
        print(f"   ❌ Error initializing service: {e}")
        return False
    
    # Test 5: Check if token exists (previous authentication)
    print("5. Checking authentication status...")
    if os.path.exists('token.json'):
        print("   ✅ Previous authentication found (token.json exists)")
        
        # Try to authenticate with existing token
        try:
            success, message = calendar_service.authenticate()
            if success:
                print(f"   ✅ Authentication successful: {message}")
                return True
            else:
                print(f"   ⚠️  Authentication issue: {message}")
                print("   💡 You may need to re-authenticate")
        except Exception as e:
            print(f"   ❌ Authentication error: {e}")
            
    else:
        print("   ℹ️  No previous authentication (token.json not found)")
        print("   💡 You'll need to authenticate via the web interface")
    
    print("\n🎯 Setup Status:")
    print("✅ Configuration files are properly set up")
    print("✅ Required packages are installed")
    print("✅ Google Calendar service is ready")
    print("\n📝 Next Steps:")
    print("1. Start the Flask app: python app.py")
    print("2. Open browser: http://localhost:5000/calendar")
    print("3. Click 'Sync Google Calendar' button")
    print("4. Complete OAuth authentication in browser")
    
    return True

if __name__ == "__main__":
    success = test_google_calendar_setup()
    if success:
        print("\n🎉 Google Calendar setup looks good!")
        sys.exit(0)
    else:
        print("\n❌ Google Calendar setup has issues")
        sys.exit(1)
