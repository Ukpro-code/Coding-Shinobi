# Google Calendar API Setup Instructions

## Overview
This productivity dashboard includes Google Calendar integration to sync and display your Google Calendar events alongside local events. Follow these steps to set up the integration.

## 🎯 For Your Personal Google Account

**Good News**: You can absolutely use your own Google account and calendar! Here's what you need to know:

### ✅ **What You Get**
- Access to **your own Google Calendar** events
- Display your personal calendar events in the dashboard
- Sync your real calendar with the productivity app
- **Completely FREE** - no charges from Google

### ✅ **What You Need**
- Your regular Google account (Gmail account)
- 5 minutes to set up API credentials
- No special developer account required

### ✅ **How It Works**
1. **You create API credentials** (like a secure key)
2. **Your app asks Google** "Can I access this user's calendar?"
3. **Google asks you** "Do you want to allow this?"
4. **You say yes** and your app can now read your calendar
5. **Your events appear** in the productivity dashboard

### ❌ **What You DON'T Need**
- A special Google developer account
- Payment to Google
- Complex setup
- Technical expertise

---

## 🚀 For Publishing Your Web App (Multi-User)

**Great News**: The same setup works for publishing your app for **multiple users**!

### ✅ **How Multi-User Works**
1. **You create ONE set of API credentials** (as the app developer)
2. **Each user signs in with their own Google account**
3. **Each user sees only their own calendar**
4. **Users can revoke access independently**
5. **You don't see other users' calendar data**

### ✅ **Publishing Scenarios**

#### **Scenario 1: Personal Use**
- You use your own Google account to create credentials
- Only you can access your calendar through the app
- Perfect for personal productivity dashboard

#### **Scenario 2: Family/Team Use**
- You create credentials once
- Family members/team members sign in with their own Google accounts
- Each person sees only their own calendar
- Perfect for shared productivity dashboard

#### **Scenario 3: Public Web App**
- You create credentials as the app developer
- Any user can sign in with their Google account
- Each user's calendar data is private to them
- Perfect for SaaS productivity platform

### ✅ **What This Means for Publishing**
- **One credential setup** serves unlimited users
- **Each user authenticates individually** with their own Google account
- **Privacy maintained** - users only see their own data
- **Scalable** - works for 1 user or 1000+ users

### ⚠️ **Important for Publishing**

#### **OAuth Consent Screen Setup**
When publishing for multiple users, you'll need to configure:
1. **User Type**: External (allows any Google user)
2. **App Domain**: Your actual domain (e.g., myproductivityapp.com)
3. **Privacy Policy**: Required for public apps
4. **Terms of Service**: Recommended for public apps

#### **Production Considerations**
- **Domain Verification**: Verify your domain with Google
- **OAuth Scopes**: Clearly define what calendar permissions you need
- **Rate Limits**: Google has usage limits (generous for most apps)
- **Security**: Use HTTPS for production deployment

---

## Prerequisites
- Python environment with required packages installed
- **Your personal Google account** (the one with your calendar)
- No special Google account needed - just your regular Gmail/Google account

## Setup Steps

### 1. Install Required Packages
```bash
pip install -r requirements.txt
```

### 2. Create Google Cloud Console Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Sign in with your personal Google account** (the one with your calendar)
3. Create a new project or select an existing one
   - Project name: "My Productivity Dashboard" (or any name you like)
   - This is just for organization - it's still free
4. Enable the Google Calendar API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 3. Create Credentials (For Your Personal Use)
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure OAuth consent screen if prompted:
   - User Type: **External** (this allows you to use your personal account)
   - App name: "My Productivity Dashboard"
   - User support email: **your personal email**
   - Developer contact: **your personal email**
   - You can leave most other fields blank for personal use
4. Application type: **Desktop application**
5. Name: "My Productivity Dashboard"
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

### 5. First-Time Authentication (One-Time Setup)
1. Start the Flask application: `python app.py`
2. Navigate to the Calendar page
3. Click "Sync Google Calendar" button
4. **Your browser will open** asking you to sign in to Google
5. **Sign in with your personal Google account**
6. Google will ask: "Allow My Productivity Dashboard to access your calendar?"
7. **Click "Allow"**
8. A `token.json` file will be created automatically
9. **You're done!** Your calendar events will now appear in the dashboard

### 6. Verify Integration
- Check the Calendar page for **your Google Calendar events**
- Events should display with a Google badge
- Dashboard should show **today's events from your Google Calendar**

## 💡 **What This Means for You**

### ✅ **Your Personal Data**
- The app will show **your actual calendar events**
- Meetings, appointments, personal events - everything from your Google Calendar
- Events appear alongside your local tasks in one unified view

### ✅ **Privacy & Security**
- Only **you** can access your calendar data
- The credentials file is stored **locally on your computer**
- Google's OAuth ensures secure access
- You can revoke access anytime from your Google account settings

### ✅ **Real-World Usage**
- See your work meetings alongside your personal tasks
- Get a complete view of your day
- Never miss an appointment or deadline
- Sync automatically when you click the sync button

---

## 🌐 **Multi-User Authentication Flow**

### How It Works for Multiple Users:

```
App Developer (You)
    ↓
Creates OAuth Credentials (One Time)
    ↓
Publishes Web App
    ↓
User 1 → Signs in with their Google Account → Sees their calendar
User 2 → Signs in with their Google Account → Sees their calendar  
User 3 → Signs in with their Google Account → Sees their calendar
```

### **Key Points:**
1. **One credential setup** enables unlimited users
2. **Each user authenticates separately** with their own Google account
3. **Data isolation** - users never see each other's calendars
4. **Independent access** - users can revoke access individually

### **Example User Flow:**
1. User visits your productivity web app
2. User clicks "Connect Google Calendar"
3. User signs in with **their own Google account**
4. Google asks: "Allow [Your App] to access your calendar?"
5. User clicks "Allow"
6. User sees **their own calendar events** in your app
7. Other users see **only their own calendars**

### **For Different Deployment Scenarios:**

#### **Local/Personal Use:**
- Run on localhost
- Only you can access
- Perfect for personal productivity

#### **Family/Team Server:**
- Deploy on local network
- Family/team members access via IP
- Each person signs in with their Google account

#### **Public Web App:**
- Deploy to cloud (Heroku, AWS, etc.)
- Anyone can sign up and use
- Each user's data remains private

---

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

---

## ⚠️ **Common Mistakes to Avoid**

### **1. OAuth Configuration Errors**

#### **❌ Wrong Application Type**
- **Mistake**: Choosing "Desktop application" instead of "Web application"
- **Problem**: OAuth flow won't work properly with Flask web app
- **Solution**: Always choose "Web application" for Flask apps

#### **❌ Incorrect JavaScript Origins**
```
❌ Wrong: http://localhost:5000/calendar
❌ Wrong: localhost:5000
❌ Wrong: https://localhost:5000 (for local dev)
✅ Correct: http://localhost:5000 (for local dev)
✅ Correct: https://yourdomain.com (for production)
```

#### **❌ Missing or Wrong Redirect URIs**
```
❌ Wrong: http://localhost:5000
❌ Wrong: http://localhost:5000/auth
❌ Wrong: http://localhost:5000/callback
✅ Correct: http://localhost:5000/oauth2callback
```

### **2. File Setup Errors**

#### **❌ Wrong Credentials File Structure**
- **Mistake**: Using "installed" instead of "web" in credentials.json
- **Problem**: Happens when you accidentally choose "Desktop application"
- **Solution**: Re-create credentials as "Web application"

```json
❌ Wrong (Desktop app structure):
{
  "installed": {
    "client_id": "...",
    "redirect_uris": ["http://localhost"]
  }
}

✅ Correct (Web app structure):
{
  "web": {
    "client_id": "...",
    "redirect_uris": ["http://localhost:5000/oauth2callback"]
  }
}
```

#### **❌ Wrong File Names or Locations**
```
❌ Wrong: client_secret.json
❌ Wrong: oauth_credentials.json
❌ Wrong: putting file in Downloads folder
✅ Correct: credentials.json (in same directory as app.py)
```

### **3. Authentication Flow Errors**

#### **❌ Skipping OAuth Consent Screen Setup**
- **Mistake**: Not configuring the OAuth consent screen
- **Problem**: Users see "This app isn't verified" error
- **Solution**: Complete OAuth consent screen configuration

#### **❌ Wrong User Type Selection**
```
❌ Wrong: Internal (only for Google Workspace organizations)
✅ Correct: External (allows any Google user)
```

### **4. Port and URL Mismatches**

#### **❌ Running Flask on Different Port**
- **Mistake**: Flask runs on port 5001 but OAuth configured for 5000
- **Problem**: Redirect URI mismatch error
- **Solution**: Either:
  - Change Flask to run on port 5000: `app.run(port=5000)`
  - Or update OAuth settings to match your port

#### **❌ HTTP vs HTTPS Confusion**
```
Local Development:
❌ Wrong: https://localhost:5000
✅ Correct: http://localhost:5000

Production:
❌ Wrong: http://yourdomain.com
✅ Correct: https://yourdomain.com
```

### **5. Environment and Dependencies**

#### **❌ Missing Required Packages**
- **Mistake**: Not installing Google API libraries
- **Problem**: Import errors when running the app
- **Solution**: Run `pip install -r requirements.txt`

#### **❌ Python Version Issues**
- **Mistake**: Using Python 2.7 or very old Python 3 versions
- **Problem**: Compatibility issues with Google libraries
- **Solution**: Use Python 3.7+ (recommended: Python 3.9+)

### **6. Scope and Permissions**

#### **❌ Insufficient Calendar Permissions**
- **Mistake**: Using read-only scope when app needs write access
- **Problem**: Can't create events in Google Calendar
- **Solution**: Use full calendar scope: `https://www.googleapis.com/auth/calendar`

#### **❌ Not Understanding Multi-User Privacy**
- **Mistake**: Worrying that users will see each other's calendars
- **Reality**: Each user only sees their own calendar data
- **Google OAuth handles user separation automatically**

### **7. Testing and Debugging**

#### **❌ Not Testing Authentication Flow**
- **Mistake**: Assuming OAuth works without testing
- **Problem**: Users can't authenticate
- **Solution**: Test the complete flow:
  1. Click "Sync Google Calendar"
  2. Sign in with Google
  3. Grant permissions
  4. Verify events appear

#### **❌ Ignoring Browser Console Errors**
- **Mistake**: Not checking browser developer tools
- **Problem**: JavaScript errors prevent OAuth flow
- **Solution**: Press F12, check Console tab for errors

### **8. Production Deployment Mistakes**

#### **❌ Using localhost URLs in Production**
- **Mistake**: Forgetting to update OAuth settings for production
- **Problem**: OAuth fails in production
- **Solution**: Update both JavaScript Origins and Redirect URIs

#### **❌ Not Using HTTPS in Production**
- **Mistake**: Using HTTP for production OAuth
- **Problem**: Google requires HTTPS for OAuth in production
- **Solution**: Set up SSL certificate and use HTTPS

#### **❌ Hardcoding Credentials**
- **Mistake**: Putting credentials directly in code
- **Problem**: Security risk, credentials exposed
- **Solution**: Use environment variables or config files

### **9. Multi-User Deployment Mistakes**

#### **❌ Creating Separate Credentials for Each User**
- **Mistake**: Thinking you need separate OAuth apps for each user
- **Reality**: One OAuth app serves unlimited users
- **Solution**: Use single OAuth app, users authenticate individually

#### **❌ Not Setting Up Privacy Policy**
- **Mistake**: Skipping privacy policy for public apps
- **Problem**: Google may restrict your app
- **Solution**: Create privacy policy and add to OAuth consent screen

### **10. File Security Mistakes**

#### **❌ Committing Credentials to Git**
- **Mistake**: Adding credentials.json and token.json to version control
- **Problem**: Security risk, credentials exposed publicly
- **Solution**: Add to .gitignore:
```
credentials.json
token.json
*.json
```

#### **❌ Sharing Credentials Files**
- **Mistake**: Sharing credentials.json with others
- **Problem**: Security risk, unauthorized access
- **Solution**: Each deployment needs its own credentials

### **Quick Checklist to Avoid Mistakes:**

✅ **Before Starting:**
- [ ] Choose "Web application" (not Desktop)
- [ ] Have Python 3.7+ installed
- [ ] Have Flask app ready to test

✅ **During Setup:**
- [ ] JavaScript Origins: `http://localhost:5000`
- [ ] Redirect URIs: `http://localhost:5000/oauth2callback`
- [ ] OAuth consent screen configured
- [ ] User Type: External

✅ **After Setup:**
- [ ] credentials.json in correct location
- [ ] File has "web" structure (not "installed")
- [ ] Test authentication flow completely
- [ ] Check browser console for errors

✅ **For Production:**
- [ ] Update URLs to production domain
- [ ] Use HTTPS
- [ ] Set up privacy policy
- [ ] Use environment variables for credentials

### **When Things Go Wrong:**

1. **"This app isn't verified"** → Complete OAuth consent screen
2. **"Redirect URI mismatch"** → Check JavaScript Origins and Redirect URIs
3. **"Invalid client"** → Check credentials.json structure
4. **"Access denied"** → User needs to grant permissions
5. **"Token expired"** → Delete token.json and re-authenticate

**Remember**: Most issues are configuration problems, not code problems!
