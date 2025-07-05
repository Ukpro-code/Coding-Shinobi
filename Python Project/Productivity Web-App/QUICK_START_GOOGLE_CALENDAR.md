# Quick Start: Use Your Own Google Calendar

## TL;DR - 5 Minutes to Get Your Calendar Working

### Step 1: Get Your Google API Credentials (2 minutes)
1. Go to https://console.cloud.google.com/
2. Sign in with **your personal Google account**
3. Create a new project (any name like "My Calendar App")
4. Enable "Google Calendar API"
5. Create OAuth 2.0 credentials for "Desktop Application"
6. Download the `credentials.json` file

### Step 2: Setup in Your App (1 minute)
1. Put `credentials.json` in the same folder as `app.py`
2. Make sure the app is running: `python app.py`

### Step 3: Connect Your Calendar (2 minutes)
1. Go to http://127.0.0.1:5000/calendar
2. Click "Sync Google Calendar"
3. Sign in with your Google account
4. Allow the app to access your calendar
5. **Done!** Your calendar events now appear in the dashboard

## What You'll See
- Your real Google Calendar events in the dashboard
- Today's meetings and appointments
- Personal events alongside your tasks
- Everything in one place!

## FAQ

**Q: Do I need a developer account?**
A: No, just your regular Google account.

**Q: Does this cost money?**
A: No, it's completely free.

**Q: Is my data safe?**
A: Yes, the credentials stay on your computer and only you can access your calendar.

**Q: Can I stop using it?**
A: Yes, you can revoke access anytime from your Google account settings.

**Q: Will it work with my work calendar?**
A: Yes, if you use your work Google account to set up the credentials.

## Need Help?
- Check the full setup guide: `GOOGLE_CALENDAR_SETUP.md`
- The app works fine without Google Calendar if you skip this step
- You can always add it later

**Bottom line**: It's your calendar, your app, your data - completely private and free!
