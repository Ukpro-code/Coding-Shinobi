from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import Google Calendar service (with error handling)
try:
    from google_calendar import google_calendar
    GOOGLE_CALENDAR_ENABLED = True
except ImportError:
    GOOGLE_CALENDAR_ENABLED = False
    google_calendar = None

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dashboard.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database Models
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed
    priority = db.Column(db.String(10), default='medium')  # low, medium, high
    due_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Task {self.title}>'

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Event {self.title}>'

class JournalEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=True)
    content = db.Column(db.Text, nullable=False)
    entry_type = db.Column(db.String(20), default='general')  # general, gratitude, reflection
    mood = db.Column(db.String(20), nullable=True)  # happy, sad, neutral, excited, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<JournalEntry {self.title or "Untitled"}>'

class Goal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    goal_type = db.Column(db.String(20), default='monthly')  # daily, weekly, monthly, yearly
    target_date = db.Column(db.DateTime, nullable=False)
    progress = db.Column(db.Float, default=0.0)  # 0-100 percentage
    status = db.Column(db.String(20), default='active')  # active, completed, paused
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def days_remaining(self):
        if self.target_date:
            delta = self.target_date - datetime.utcnow()
            return max(0, delta.days)
        return 0

    def __repr__(self):
        return f'<Goal {self.title}>'

class Contact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    company = db.Column(db.String(100), nullable=True)
    position = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    photo_url = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Contact {self.name}>'

# Error Handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500

# Routes
@app.route('/')
def home():
    try:
        # Get dashboard data
        daily_tasks = Task.query.filter_by(status='pending').order_by(Task.priority.desc()).limit(3).all()
        recent_journal_entries = JournalEntry.query.order_by(JournalEntry.created_at.desc()).limit(2).all()
        goals = Goal.query.filter_by(status='active').order_by(Goal.target_date.asc()).limit(3).all()
        
        # Get today's events from local database
        today = datetime.utcnow().date()
        local_today_events = Event.query.filter(
            db.func.date(Event.start_date) == today
        ).order_by(Event.start_date.asc()).all()
        
        # Get Google Calendar events for today
        google_today_events = []
        if GOOGLE_CALENDAR_ENABLED and google_calendar:
            try:
                from datetime import timedelta
                today_start = datetime.combine(today, datetime.min.time())
                today_end = datetime.combine(today, datetime.max.time())
                
                events_data, _ = google_calendar.get_events(
                    max_results=10,
                    time_min=today_start.isoformat() + 'Z',
                    time_max=today_end.isoformat() + 'Z'
                )
                if events_data:
                    google_today_events = events_data
            except Exception:
                pass  # Silently handle Google Calendar errors on dashboard
        
        # Combine today's events
        today_events = []
        for event in local_today_events:
            today_events.append({
                'id': event.id,
                'title': event.title,
                'description': event.description,
                'start_date': event.start_date,
                'end_date': event.end_date,
                'source': 'local'
            })
        
        for event in google_today_events:
            today_events.append(event)
        
        # Sort by start time
        today_events.sort(key=lambda x: x['start_date'])
        
        # Task stats for dashboard
        task_stats = {
            'total': Task.query.count(),
            'completed': Task.query.filter_by(status='completed').count(),
            'pending': Task.query.filter_by(status='pending').count(),
            'in_progress': Task.query.filter_by(status='in_progress').count()
        }
        
        return render_template('index.html', 
                             daily_tasks=daily_tasks,
                             recent_journal_entries=recent_journal_entries,
                             goals=goals,
                             today_events=today_events,
                             task_stats=task_stats,
                             current_time=datetime.utcnow())
    except Exception as e:
        flash(f'Error loading dashboard: {str(e)}', 'error')
        return render_template('index.html', 
                             daily_tasks=[], 
                             recent_journal_entries=[],
                             goals=[],
                             today_events=[],
                             task_stats={},
                             current_time=datetime.utcnow())

@app.route('/tasks')
def tasks():
    try:
        tasks = Task.query.order_by(Task.created_at.desc()).all()
        return render_template('tasks.html', tasks=tasks)
    except Exception as e:
        flash(f'Error loading tasks: {str(e)}', 'error')
        return render_template('tasks.html', tasks=[])

@app.route('/tasks/add', methods=['GET', 'POST'])
def add_task():
    if request.method == 'POST':
        try:
            title = request.form.get('title')
            description = request.form.get('description')
            priority = request.form.get('priority', 'medium')
            due_date_str = request.form.get('due_date')
            
            if not title:
                flash('Task title is required!', 'error')
                return redirect(url_for('add_task'))
            
            due_date = None
            if due_date_str:
                due_date = datetime.strptime(due_date_str, '%Y-%m-%d')
            
            task = Task(
                title=title,
                description=description,
                priority=priority,
                due_date=due_date
            )
            
            db.session.add(task)
            db.session.commit()
            flash('Task added successfully!', 'success')
            return redirect(url_for('tasks'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error adding task: {str(e)}', 'error')
            return redirect(url_for('add_task'))
    
    return render_template('add_task.html')

@app.route('/tasks/<int:task_id>/update', methods=['POST'])
def update_task_status(task_id):
    try:
        task = Task.query.get_or_404(task_id)
        new_status = request.form.get('status')
        
        if new_status in ['pending', 'in_progress', 'completed']:
            task.status = new_status
            task.updated_at = datetime.utcnow()
            db.session.commit()
            flash('Task status updated!', 'success')
        else:
            flash('Invalid status!', 'error')
            
    except Exception as e:
        db.session.rollback()
        flash(f'Error updating task: {str(e)}', 'error')
    
    return redirect(url_for('tasks'))

@app.route('/tasks/<int:task_id>/delete', methods=['POST'])
def delete_task(task_id):
    try:
        task = Task.query.get_or_404(task_id)
        db.session.delete(task)
        db.session.commit()
        flash('Task deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting task: {str(e)}', 'error')
    
    return redirect(url_for('tasks'))

@app.route('/calendar')
def calendar():
    try:
        # Get local events from database
        local_events = Event.query.order_by(Event.start_date.desc()).all()
        
        # Get Google Calendar events if enabled
        google_events = []
        google_calendar_error = None
        
        if GOOGLE_CALENDAR_ENABLED and google_calendar:
            try:
                events_data, message = google_calendar.get_events(max_results=20)
                if events_data:
                    google_events = events_data
                else:
                    google_calendar_error = message
            except Exception as e:
                google_calendar_error = f"Google Calendar error: {str(e)}"
        
        # Combine events for display
        all_events = []
        
        # Add local events
        for event in local_events:
            all_events.append({
                'id': event.id,
                'title': event.title,
                'description': event.description,
                'start_date': event.start_date,
                'end_date': event.end_date,
                'source': 'local',
                'location': '',
                'link': ''
            })
        
        # Add Google Calendar events
        for event in google_events:
            all_events.append(event)
        
        # Sort all events by start date
        all_events.sort(key=lambda x: x['start_date'])
        
        # Get current time as naive UTC for comparison
        current_time = datetime.utcnow()
        
        return render_template('calendar.html', 
                             events=all_events,
                             google_calendar_enabled=GOOGLE_CALENDAR_ENABLED,
                             google_calendar_error=google_calendar_error,
                             current_time=current_time)
    
    except Exception as e:
        flash(f'Error loading calendar: {str(e)}', 'error')
        current_time = datetime.utcnow()
        return render_template('calendar.html', 
                             events=[], 
                             google_calendar_enabled=GOOGLE_CALENDAR_ENABLED,
                             google_calendar_error=None,
                             current_time=current_time)

@app.route('/calendar/add', methods=['GET', 'POST'])
def add_event():
    if request.method == 'POST':
        try:
            title = request.form.get('title')
            description = request.form.get('description')
            start_date_str = request.form.get('start_date')
            end_date_str = request.form.get('end_date')
            add_to_google = request.form.get('add_to_google') == 'true'
            
            if not title or not start_date_str:
                flash('Event title and start date are required!', 'error')
                return redirect(url_for('add_event'))
            
            start_date = datetime.strptime(start_date_str, '%Y-%m-%dT%H:%M')
            end_date = None
            if end_date_str:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%dT%H:%M')
            else:
                end_date = start_date + timedelta(hours=1)  # Default 1 hour duration
            
            # Create local event
            event = Event(
                title=title,
                description=description,
                start_date=start_date,
                end_date=end_date
            )
            
            db.session.add(event)
            db.session.commit()
            
            # Also create in Google Calendar if requested
            if add_to_google and GOOGLE_CALENDAR_ENABLED and google_calendar:
                try:
                    success, message = google_calendar.create_event(
                        title, description or '', start_date, end_date
                    )
                    if success:
                        flash('Event added to both local calendar and Google Calendar!', 'success')
                    else:
                        flash(f'Event added locally, but Google Calendar failed: {message}', 'warning')
                except Exception as google_error:
                    flash(f'Event added locally, but Google Calendar error: {str(google_error)}', 'warning')
            else:
                flash('Event added successfully!', 'success')
                
            return redirect(url_for('calendar'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error adding event: {str(e)}', 'error')
            return redirect(url_for('add_event'))
    
    return render_template('add_event.html', google_calendar_enabled=GOOGLE_CALENDAR_ENABLED)

@app.route('/analytics')
def analytics():
    try:
        # Calculate analytics data
        total_tasks = Task.query.count()
        completed_tasks = Task.query.filter_by(status='completed').count()
        pending_tasks = Task.query.filter_by(status='pending').count()
        in_progress_tasks = Task.query.filter_by(status='in_progress').count()
        
        # Calculate completion rate
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Priority distribution
        high_priority = Task.query.filter_by(priority='high').count()
        medium_priority = Task.query.filter_by(priority='medium').count()
        low_priority = Task.query.filter_by(priority='low').count()
        
        analytics_data = {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'in_progress_tasks': in_progress_tasks,
            'completion_rate': round(completion_rate, 1),
            'high_priority': high_priority,
            'medium_priority': medium_priority,
            'low_priority': low_priority
        }
        
        return render_template('analytics.html', analytics=analytics_data)
    except Exception as e:
        flash(f'Error loading analytics: {str(e)}', 'error')
        return render_template('analytics.html', analytics={})

# Google Calendar Routes
@app.route('/calendar/sync')
def sync_google_calendar():
    """Sync with Google Calendar"""
    if not GOOGLE_CALENDAR_ENABLED:
        flash('Google Calendar integration is not enabled', 'error')
        return redirect(url_for('calendar'))
    
    try:
        success, message = google_calendar.authenticate()
        if success:
            flash('Google Calendar synced successfully!', 'success')
        else:
            flash(f'Google Calendar sync failed: {message}', 'error')
    except Exception as e:
        flash(f'Error syncing Google Calendar: {str(e)}', 'error')
    
    return redirect(url_for('calendar'))

@app.route('/calendar/google/events')
def get_google_events():
    """Get Google Calendar events as JSON"""
    if not GOOGLE_CALENDAR_ENABLED:
        return jsonify({'error': 'Google Calendar not enabled'}), 400
    
    try:
        events_data, message = google_calendar.get_events(max_results=50)
        if events_data:
            return jsonify({
                'success': True,
                'events': events_data,
                'message': message
            })
        else:
            return jsonify({
                'success': False,
                'events': [],
                'message': message
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'events': [],
            'message': str(e)
        }), 500

@app.route('/calendar/google/create', methods=['POST'])
def create_google_event():
    """Create an event in Google Calendar"""
    if not GOOGLE_CALENDAR_ENABLED:
        return jsonify({'error': 'Google Calendar not enabled'}), 400
    
    try:
        data = request.get_json()
        title = data.get('title')
        description = data.get('description', '')
        start_datetime = datetime.fromisoformat(data.get('start_datetime'))
        end_datetime = datetime.fromisoformat(data.get('end_datetime'))
        location = data.get('location', '')
        
        success, message = google_calendar.create_event(
            title, description, start_datetime, end_datetime, location
        )
        
        return jsonify({
            'success': success,
            'message': message
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/calendar/google/create-task', methods=['POST'])
def create_google_task_event():
    """Create a Google Calendar event from a task"""
    if not GOOGLE_CALENDAR_ENABLED:
        return jsonify({'error': 'Google Calendar not enabled'}), 400
    
    try:
        data = request.get_json()
        task_title = data.get('title')
        task_description = data.get('description', '')
        due_date = datetime.fromisoformat(data.get('due_date'))
        priority = data.get('priority', 'medium')
        
        success, message = google_calendar.create_task_event(
            task_title, task_description, due_date, priority
        )
        
        return jsonify({
            'success': success,
            'message': message
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/calendar/google/create-meeting', methods=['POST'])
def create_google_meeting():
    """Create a meeting event in Google Calendar"""
    if not GOOGLE_CALENDAR_ENABLED:
        return jsonify({'error': 'Google Calendar not enabled'}), 400
    
    try:
        data = request.get_json()
        title = data.get('title')
        description = data.get('description', '')
        start_datetime = datetime.fromisoformat(data.get('start_datetime'))
        end_datetime = datetime.fromisoformat(data.get('end_datetime'))
        location = data.get('location', '')
        attendees = data.get('attendees', [])
        
        success, message = google_calendar.create_meeting_event(
            title, description, start_datetime, end_datetime, location, attendees
        )
        
        return jsonify({
            'success': success,
            'message': message
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/tasks/<int:task_id>/add-to-google-calendar', methods=['POST'])
def add_task_to_google_calendar(task_id):
    """Add a task as an event to Google Calendar"""
    if not GOOGLE_CALENDAR_ENABLED:
        flash('Google Calendar integration is not enabled', 'error')
        return redirect(url_for('tasks'))
    
    try:
        task = Task.query.get_or_404(task_id)
        
        if not task.due_date:
            flash('Task must have a due date to add to Google Calendar', 'error')
            return redirect(url_for('tasks'))
        
        success, message = google_calendar.create_task_event(
            task.title, task.description or '', task.due_date, task.priority
        )
        
        if success:
            flash('Task added to Google Calendar successfully!', 'success')
        else:
            flash(f'Failed to add task to Google Calendar: {message}', 'error')
            
    except Exception as e:
        flash(f'Error adding task to Google Calendar: {str(e)}', 'error')
    
    return redirect(url_for('tasks'))

@app.route('/events/<int:event_id>/add-to-google-calendar', methods=['POST'])
def add_event_to_google_calendar(event_id):
    """Add a local event to Google Calendar"""
    if not GOOGLE_CALENDAR_ENABLED:
        flash('Google Calendar integration is not enabled', 'error')
        return redirect(url_for('calendar'))
    
    try:
        event = Event.query.get_or_404(event_id)
        
        end_datetime = event.end_date or (event.start_date + timedelta(hours=1))
        
        success, message = google_calendar.create_event(
            event.title, event.description or '', event.start_date, end_datetime
        )
        
        if success:
            flash('Event added to Google Calendar successfully!', 'success')
        else:
            flash(f'Failed to add event to Google Calendar: {message}', 'error')
            
    except Exception as e:
        flash(f'Error adding event to Google Calendar: {str(e)}', 'error')
    
    return redirect(url_for('calendar'))

# Database initialization
def create_tables():
    try:
        with app.app_context():
            db.create_all()
            print("Database tables created successfully!")
    except Exception as e:
        print(f"Error creating database tables: {e}")

def reset_database():
    """Drop all tables and recreate them with current schema"""
    try:
        with app.app_context():
            print("Dropping all existing tables...")
            db.drop_all()
            print("Creating new tables with current schema...")
            db.create_all()
            print("Database reset successfully!")
    except Exception as e:
        print(f"Error resetting database: {e}")

if __name__ == '__main__':
    # Uncomment the next line if you want to reset the database
    # reset_database()
    create_tables()
    app.run(debug=True)