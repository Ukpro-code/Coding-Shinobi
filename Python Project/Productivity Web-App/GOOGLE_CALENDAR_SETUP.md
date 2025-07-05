# Google Calendar API Setup Instructions

## Overview
This productivity dashboard includes Google Calendar integration to sync and display your Google Calendar events alongside local events. Follow these steps to set up the integration.

## Prerequisites
- Python environment with required packages installed
- Google account with Calendar access
- Google Cloud Console project

## Setup Steps

### 1. Install Required Packages
```bash
pip install -r requirements.txt
```

### 2. Create Google Cloud Console Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 3. Create Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure OAuth consent screen if prompted:
   - User Type: External (for testing)
   - App name: "Productivity Dashboard"
   - User support email: your email
   - Developer contact: your email
4. Application type: Desktop application
5. Name: "Productivity Dashboard"
6. Download the credentials JSON file

### 4. Setup Credentials File
1. Rename the downloaded file to `credentials.json`
2. Place it in the same directory as `app.py`
3. The file should contain:
   ```json
   {
     "installed": {
       "client_id": "your-client-id",
       "project_id": "your-project-id",
       "auth_uri": "https://accounts.google.com/o/oauth2/auth",
       "token_uri": "https://oauth2.googleapis.com/token",
       "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
       "client_secret": "your-client-secret",
       "redirect_uris": ["http://localhost"]
     }
   }
   ```

### 5. First-Time Authentication
1. Start the Flask application: `python app.py`
2. Navigate to the Calendar page
3. Click "Sync Google Calendar" button
4. Your browser will open for Google OAuth authentication
5. Grant permission to access your calendar
6. A `token.json` file will be created automatically

### 6. Verify Integration
- Check the Calendar page for Google Calendar events
- Events should display with a Google badge
- Dashboard should show today's Google Calendar events

## Features

### Calendar Page
- **Sync Button**: Manual sync with Google Calendar
- **Event Display**: Combined view of local and Google Calendar events
- **Event Source**: Visual indicators for local vs Google events
- **Google Links**: Direct links to Google Calendar for Google events

### Dashboard Widget
- **Today's Schedule**: Shows today's events from both sources
- **Google Badge**: Indicates Google Calendar events
- **Real-time Updates**: Refreshes when syncing

## API Endpoints

### `/calendar/sync`
- **Method**: GET
- **Description**: Manually sync with Google Calendar
- **Response**: Redirects to calendar page with success/error message

### `/calendar/google/events`
- **Method**: GET
- **Description**: Get Google Calendar events as JSON
- **Response**: JSON with events array

### `/calendar/google/create`
- **Method**: POST
- **Description**: Create event in Google Calendar
- **Payload**: JSON with event details
- **Response**: JSON with success status

## Troubleshooting

### Common Issues

1. **"Google Calendar integration is not enabled"**
   - Check if `credentials.json` exists
   - Verify required packages are installed
   - Restart the application

2. **"An error occurred: invalid_grant"**
   - Delete `token.json` file
   - Re-authenticate using sync button

3. **"Google Calendar credentials file not found"**
   - Ensure `credentials.json` is in the correct location
   - Verify file permissions

4. **No Google Calendar events showing**
   - Check if you have events in your Google Calendar
   - Verify the time range (shows next 7 days by default)
   - Try manual sync

### Debug Mode
- Enable debug logging in `google_calendar.py`
- Check browser console for JavaScript errors
- Verify API responses in network tab

## Security Notes
- Keep `credentials.json` and `token.json` secure
- Add these files to `.gitignore`
- Use environment variables for production deployment
- Regularly review OAuth permissions

## Limitations
- Read-only access to Google Calendar (create events functionality included)
- Limited to primary calendar
- Requires internet connection for sync
- OAuth token expires and needs refresh

## Future Enhancements
- Multiple calendar support
- Two-way sync (edit Google events from dashboard)
- Automatic periodic sync
- Calendar selection interface
- Event categories and colors
