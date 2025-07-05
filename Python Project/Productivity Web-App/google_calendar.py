# Google Calendar API Configuration
import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timedelta

# Scopes for Google Calendar API
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']

class GoogleCalendarService:
    def __init__(self):
        self.service = None
        self.credentials = None
        self.credentials_file = 'credentials.json'
        self.token_file = 'token.json'
        
    def authenticate(self):
        """Authenticate with Google Calendar API"""
        creds = None
        
        # Check if token file exists
        if os.path.exists(self.token_file):
            creds = Credentials.from_authorized_user_file(self.token_file, SCOPES)
        
        # If no valid credentials, get new ones
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if not os.path.exists(self.credentials_file):
                    return False, "Google Calendar credentials file not found. Please add credentials.json"
                
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_file, SCOPES)
                creds = flow.run_local_server(port=0)
            
            # Save credentials for next run
            with open(self.token_file, 'w') as token:
                token.write(creds.to_json())
        
        self.credentials = creds
        self.service = build('calendar', 'v3', credentials=creds)
        return True, "Successfully authenticated with Google Calendar"
    
    def get_events(self, max_results=10, time_min=None, time_max=None):
        """Get events from Google Calendar"""
        if not self.service:
            success, message = self.authenticate()
            if not success:
                return None, message
        
        try:
            # Default time range: next 7 days
            if not time_min:
                time_min = datetime.utcnow().isoformat() + 'Z'
            if not time_max:
                time_max = (datetime.utcnow() + timedelta(days=7)).isoformat() + 'Z'
            
            events_result = self.service.events().list(
                calendarId='primary',
                timeMin=time_min,
                timeMax=time_max,
                maxResults=max_results,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            
            # Format events for our app
            formatted_events = []
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                
                # Parse datetime
                if 'T' in start:
                    start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                    end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
                else:
                    start_dt = datetime.fromisoformat(start)
                    end_dt = datetime.fromisoformat(end)
                
                formatted_events.append({
                    'id': event['id'],
                    'title': event.get('summary', 'No Title'),
                    'description': event.get('description', ''),
                    'start_date': start_dt,
                    'end_date': end_dt,
                    'location': event.get('location', ''),
                    'attendees': event.get('attendees', []),
                    'link': event.get('htmlLink', ''),
                    'source': 'google_calendar'
                })
            
            return formatted_events, "Successfully retrieved Google Calendar events"
            
        except HttpError as error:
            return None, f"An error occurred: {error}"
    
    def create_event(self, title, description, start_datetime, end_datetime, location=None):
        """Create a new event in Google Calendar"""
        if not self.service:
            success, message = self.authenticate()
            if not success:
                return False, message
        
        try:
            event = {
                'summary': title,
                'description': description,
                'start': {
                    'dateTime': start_datetime.isoformat(),
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': end_datetime.isoformat(),
                    'timeZone': 'UTC',
                },
            }
            
            if location:
                event['location'] = location
            
            event = self.service.events().insert(calendarId='primary', body=event).execute()
            return True, f"Event created: {event.get('htmlLink')}"
            
        except HttpError as error:
            return False, f"An error occurred: {error}"
    
    def get_calendars(self):
        """Get list of available calendars"""
        if not self.service:
            success, message = self.authenticate()
            if not success:
                return None, message
        
        try:
            calendars_result = self.service.calendarList().list().execute()
            calendars = calendars_result.get('items', [])
            
            formatted_calendars = []
            for calendar in calendars:
                formatted_calendars.append({
                    'id': calendar['id'],
                    'name': calendar['summary'],
                    'primary': calendar.get('primary', False),
                    'access_role': calendar.get('accessRole', ''),
                    'color': calendar.get('backgroundColor', '#3174ad')
                })
            
            return formatted_calendars, "Successfully retrieved calendars"
            
        except HttpError as error:
            return None, f"An error occurred: {error}"

# Global instance
google_calendar = GoogleCalendarService()
