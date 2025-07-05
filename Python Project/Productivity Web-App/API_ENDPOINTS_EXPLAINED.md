# API Endpoints Explained - Complete Guide

## 🎯 What Are API Endpoints?

**API Endpoints** are specific URLs in your web application that handle different types of requests. Think of them as "doors" that allow different parts of your app to communicate with Google Calendar.

## 📍 **Current API Endpoints in Your App**

### **1. Calendar Sync Endpoints**

#### `GET /calendar/sync`
```
URL: http://127.0.0.1:5000/calendar/sync
Purpose: Manual synchronization with Google Calendar
```

**What it does:**
- Authenticates with Google Calendar API
- Fetches latest events from your Google Calendar
- Updates the calendar page with fresh data
- Shows success/error messages to user

**User Experience:**
1. User clicks "Sync Google Calendar" button
2. Browser sends GET request to `/calendar/sync`
3. App authenticates with Google
4. User sees updated calendar events
5. Redirects back to calendar page

**Code Flow:**
```python
@app.route('/calendar/sync')
def sync_google_calendar():
    # Authenticate with Google
    success, message = google_calendar.authenticate()
    # Show result to user
    flash(message, 'success' or 'error')
    # Go back to calendar
    return redirect(url_for('calendar'))
```

---

### **2. Google Calendar Data Endpoints**

#### `GET /calendar/google/events`
```
URL: http://127.0.0.1:5000/calendar/google/events
Purpose: Get Google Calendar events as JSON data
```

**What it does:**
- Returns Google Calendar events in JSON format
- Used for AJAX requests (background data loading)
- Doesn't reload the page

**Response Example:**
```json
{
  "success": true,
  "events": [
    {
      "id": "abc123",
      "title": "Team Meeting",
      "start_date": "2025-07-05T14:00:00",
      "end_date": "2025-07-05T15:00:00",
      "description": "Weekly team standup",
      "location": "Conference Room A"
    }
  ],
  "message": "Successfully retrieved events"
}
```

**Use Case:**
- JavaScript can call this to refresh calendar without page reload
- Mobile apps can use this to get calendar data
- Other parts of your app can fetch calendar data

---

### **3. Event Creation Endpoints**

#### `POST /calendar/google/create`
```
URL: http://127.0.0.1:5000/calendar/google/create
Purpose: Create a basic event in Google Calendar
Method: POST (sends data to server)
```

**What it does:**
- Creates a new event directly in Google Calendar
- Takes event details as JSON input
- Returns success/failure status

**Input Example:**
```json
{
  "title": "Doctor Appointment",
  "description": "Annual checkup",
  "start_datetime": "2025-07-10T09:00:00",
  "end_datetime": "2025-07-10T10:00:00",
  "location": "Medical Center"
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Event created: https://calendar.google.com/calendar/event?eid=..."
}
```

#### `POST /calendar/google/create-task`
```
URL: http://127.0.0.1:5000/calendar/google/create-task
Purpose: Create a task as a calendar event
```

**What it does:**
- Converts a task into a Google Calendar event
- Adds special formatting for tasks
- Includes priority-based color coding
- Sets smart reminders (1 hour + 10 minutes)

**Input Example:**
```json
{
  "title": "Finish project report",
  "description": "Complete the quarterly report",
  "due_date": "2025-07-10T14:00:00",
  "priority": "high"
}
```

**What gets created:**
- **Title**: "📋 Task: Finish project report"
- **Color**: Red (high priority)
- **Reminders**: 1 hour before + 10 minutes before
- **Duration**: 1 hour (default)

#### `POST /calendar/google/create-meeting`
```
URL: http://127.0.0.1:5000/calendar/google/create-meeting
Purpose: Create a meeting with attendees
```

**What it does:**
- Creates a professional meeting event
- Sends invitations to attendees
- Sets up email and popup reminders
- Includes location information

**Input Example:**
```json
{
  "title": "Weekly Team Standup",
  "description": "Review progress and plan week",
  "start_datetime": "2025-07-10T10:00:00",
  "end_datetime": "2025-07-10T11:00:00",
  "location": "Conference Room A",
  "attendees": ["team@company.com", "manager@company.com"]
}
```

**What gets created:**
- **Title**: "🤝 Meeting: Weekly Team Standup"
- **Invitations**: Sent to all attendees
- **Reminders**: 15 min popup + 1 hour email
- **Location**: Conference Room A

---

### **4. Integration Endpoints**

#### `POST /tasks/{id}/add-to-google-calendar`
```
URL: http://127.0.0.1:5000/tasks/123/add-to-google-calendar
Purpose: Add an existing task to Google Calendar
```

**What it does:**
- Takes an existing task from your database
- Creates a corresponding event in Google Calendar
- Links the task with calendar event

**User Experience:**
1. User views tasks page
2. User clicks Google Calendar button next to a task
3. Task gets added to Google Calendar
4. User sees success message

#### `POST /events/{id}/add-to-google-calendar`
```
URL: http://127.0.0.1:5000/events/456/add-to-google-calendar
Purpose: Add a local event to Google Calendar
```

**What it does:**
- Takes an event from your local database
- Creates a copy in Google Calendar
- Keeps both local and Google versions

---

## 🔧 **How Endpoints Work Together**

### **Complete User Workflow:**

```
1. User creates task with due date
   ↓
2. Task saved in local database
   ↓
3. User clicks "Add to Google Calendar"
   ↓
4. POST /tasks/{id}/add-to-google-calendar
   ↓
5. App calls Google Calendar API
   ↓
6. Event created in Google Calendar
   ↓
7. User sees task in both places
```

### **Event Creation Workflow:**

```
1. User fills out "Add Event" form
   ↓
2. User checks "Also add to Google Calendar"
   ↓
3. Form submitted to /calendar/add
   ↓
4. App saves event locally
   ↓
5. App calls POST /calendar/google/create
   ↓
6. Event created in Google Calendar
   ↓
7. User sees event in both places
```

## 📱 **API Usage Examples**

### **From JavaScript (AJAX):**
```javascript
// Get Google Calendar events
fetch('/calendar/google/events')
  .then(response => response.json())
  .then(data => {
    console.log('Events:', data.events);
  });

// Create new event
fetch('/calendar/google/create', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    title: 'New Event',
    start_datetime: '2025-07-10T14:00:00',
    end_datetime: '2025-07-10T15:00:00'
  })
});
```

### **From Forms (HTML):**
```html
<!-- Add task to Google Calendar -->
<form method="POST" action="/tasks/123/add-to-google-calendar">
  <button type="submit">Add to Google Calendar</button>
</form>

<!-- Sync Google Calendar -->
<a href="/calendar/sync">Sync Google Calendar</a>
```

## 🌐 **For Multi-User Publishing**

### **How Endpoints Handle Multiple Users:**

```
User A clicks sync → /calendar/sync → Google asks "Which user?" → A's calendar
User B clicks sync → /calendar/sync → Google asks "Which user?" → B's calendar
```

**Key Points:**
- **Same endpoints** work for all users
- **Google OAuth** identifies which user is making the request
- **Each user** gets their own calendar data
- **No interference** between users

### **Authentication Flow:**
```
1. User clicks any Google Calendar button
   ↓
2. App checks if user is authenticated with Google
   ↓
3. If not: Redirects to Google login
   ↓
4. User signs in with their Google account
   ↓
5. Google redirects back to app with access token
   ↓
6. App can now access that user's calendar
   ↓
7. Endpoint executes with user's permissions
```

## 🔐 **Security & Privacy**

### **How Endpoints Protect User Data:**

1. **OAuth Authentication**: Each request verified with Google
2. **User Isolation**: Can only access own calendar
3. **Token Management**: Secure token storage and refresh
4. **Error Handling**: Graceful failures without data exposure

### **What Users Control:**
- **Grant Access**: Users choose to connect Google Calendar
- **Revoke Access**: Users can disconnect anytime
- **View Only Their Data**: No access to other users' calendars

## 🚀 **Benefits for Your App**

### **For Development:**
- **Modular Design**: Each endpoint has specific purpose
- **Easy Testing**: Can test each feature independently
- **Debugging**: Clear separation of functionality
- **Extensible**: Easy to add new features

### **For Users:**
- **Flexible Options**: Choose what to sync
- **Real-time Updates**: Instant synchronization
- **Cross-Platform**: Works on any device
- **Professional Features**: Meeting invites, reminders, etc.

## 📊 **Endpoint Summary Table**

| Endpoint | Method | Purpose | User Action |
|----------|--------|---------|-------------|
| `/calendar/sync` | GET | Sync calendar | Click sync button |
| `/calendar/google/events` | GET | Get events data | Background refresh |
| `/calendar/google/create` | POST | Create event | Add event form |
| `/calendar/google/create-task` | POST | Task → Calendar | Task Google button |
| `/calendar/google/create-meeting` | POST | Create meeting | Meeting form |
| `/tasks/{id}/add-to-google-calendar` | POST | Add task | Task page button |
| `/events/{id}/add-to-google-calendar` | POST | Add event | Event page button |

## 🎯 **Key Takeaway**

**API Endpoints are the bridge between your productivity dashboard and Google Calendar.** They handle:

- **Authentication** with Google
- **Data transfer** both ways (read/write)
- **User requests** from buttons and forms
- **Multi-user support** automatically
- **Error handling** gracefully

**Think of them as specialized workers, each handling one specific job to make your Google Calendar integration seamless and powerful!** 🚀
