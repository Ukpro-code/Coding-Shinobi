#!/usr/bin/env python3
"""
Manual test of Google Calendar authentication
"""

from google_calendar import GoogleCalendarService

def test_manual_auth():
    """Test manual authentication with Google Calendar"""
    
    print("🔐 Testing Google Calendar Authentication...")
    print("=" * 50)
    
    # Initialize service
    calendar_service = GoogleCalendarService()
    
    # Attempt authentication
    print("Starting authentication process...")
    print("This will open a browser window for OAuth...")
    
    try:
        success, message = calendar_service.authenticate()
        
        if success:
            print(f"✅ {message}")
            
            # Test getting events
            print("\nTesting calendar access...")
            events = calendar_service.get_events(max_results=5)
            
            if events:
                print(f"✅ Found {len(events)} events")
                for event in events:
                    title = event.get('summary', 'No title')
                    start = event.get('start', {}).get('dateTime', event.get('start', {}).get('date', 'No date'))
                    print(f"  - {title} ({start})")
            else:
                print("ℹ️  No events found (or calendar is empty)")
                
        else:
            print(f"❌ Authentication failed: {message}")
            
    except Exception as e:
        print(f"❌ Error during authentication: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_manual_auth()
