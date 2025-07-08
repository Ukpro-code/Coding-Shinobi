from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
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
# Force template reloading for development
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True
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
            old_status = task.status
            task.status = new_status
            task.updated_at = datetime.utcnow()
            db.session.commit()
            
            # Check if request wants JSON response (for AJAX calls)
            if request.headers.get('Content-Type') == 'application/json' or request.args.get('format') == 'json':
                return jsonify({
                    'success': True,
                    'message': 'Task status updated!',
                    'task': {
                        'id': task.id,
                        'title': task.title,
                        'status': task.status,
                        'priority': task.priority,
                        'old_status': old_status,
                        'was_completed': new_status == 'completed' and old_status != 'completed'
                    }
                })
            else:
                flash('Task status updated!', 'success')
        else:
            if request.headers.get('Content-Type') == 'application/json' or request.args.get('format') == 'json':
                return jsonify({
                    'success': False,
                    'message': 'Invalid status!'
                }), 400
            else:
                flash('Invalid status!', 'error')
            
    except Exception as e:
        db.session.rollback()
        error_message = f'Error updating task: {str(e)}'
        
        if request.headers.get('Content-Type') == 'application/json' or request.args.get('format') == 'json':
            return jsonify({
                'success': False,
                'message': error_message
            }), 500
        else:
            flash(error_message, 'error')
    
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

@app.route('/test-js')
def test_js():
    """Test JavaScript functionality"""
    return render_template('js_test.html')

@app.route('/calendar')
def calendar():
    """Main calendar route - redirect to grid view by default"""
    return redirect(url_for('calendar_grid'))

@app.route('/calendar/list')
def calendar_list():
    """List view for calendar events"""
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

# Journal routes
@app.route('/journal')
def journal():
    try:
        entries = JournalEntry.query.order_by(JournalEntry.created_at.desc()).all()
        return render_template('journal.html', entries=entries)
    except Exception as e:
        flash(f'Error loading journal entries: {str(e)}', 'error')
        return render_template('journal.html', entries=[])

@app.route('/journal/add', methods=['GET', 'POST'])
def add_journal_entry():
    if request.method == 'POST':
        try:
            title = request.form.get('title')
            content = request.form.get('content')
            entry_type = request.form.get('entry_type', 'general')
            mood = request.form.get('mood')
            
            if not content:
                flash('Entry content is required!', 'error')
                return redirect(url_for('add_journal_entry'))
            
            entry = JournalEntry(
                title=title,
                content=content,
                entry_type=entry_type,
                mood=mood
            )
            
            db.session.add(entry)
            db.session.commit()
            flash('Journal entry added successfully!', 'success')
            return redirect(url_for('journal'))
            
        except Exception as e:
            flash(f'Error adding journal entry: {str(e)}', 'error')
            return redirect(url_for('add_journal_entry'))
    
    return render_template('add_journal_entry.html')

@app.route('/journal/<int:entry_id>/delete', methods=['POST'])
def delete_journal_entry(entry_id):
    try:
        entry = JournalEntry.query.get_or_404(entry_id)
        db.session.delete(entry)
        db.session.commit()
        flash('Journal entry deleted successfully!', 'success')
    except Exception as e:
        flash(f'Error deleting journal entry: {str(e)}', 'error')
    
    return redirect(url_for('journal'))

# Goals routes
@app.route('/goals')
def goals():
    try:
        goals = Goal.query.order_by(Goal.target_date.asc()).all()
        return render_template('goals.html', goals=goals)
    except Exception as e:
        flash(f'Error loading goals: {str(e)}', 'error')
        return render_template('goals.html', goals=[])

@app.route('/goals/add', methods=['GET', 'POST'])
def add_goal():
    if request.method == 'POST':
        try:
            title = request.form.get('title')
            description = request.form.get('description')
            goal_type = request.form.get('goal_type', 'monthly')
            target_date_str = request.form.get('target_date')
            
            if not title:
                flash('Goal title is required!', 'error')
                return redirect(url_for('add_goal'))
            
            target_date = None
            if target_date_str:
                try:
                    target_date = datetime.strptime(target_date_str, '%Y-%m-%d')
                except ValueError:
                    flash('Invalid date format!', 'error')
                    return redirect(url_for('add_goal'))
            
            goal = Goal(
                title=title,
                description=description,
                goal_type=goal_type,
                target_date=target_date
            )
            
            db.session.add(goal)
            db.session.commit()
            flash('Goal added successfully!', 'success')
            return redirect(url_for('goals'))
            
        except Exception as e:
            flash(f'Error adding goal: {str(e)}', 'error')
            return redirect(url_for('add_goal'))
    
    return render_template('add_goal.html')

@app.route('/goals/<int:goal_id>/update', methods=['POST'])
def update_goal(goal_id):
    try:
        goal = Goal.query.get_or_404(goal_id)
        progress = request.form.get('progress', type=float)
        status = request.form.get('status')
        
        if progress is not None:
            goal.progress = max(0, min(100, progress))  # Clamp between 0-100
        
        if status:
            goal.status = status
        
        goal.updated_at = datetime.utcnow()
        db.session.commit()
        flash('Goal updated successfully!', 'success')
        
    except Exception as e:
        flash(f'Error updating goal: {str(e)}', 'error')
    
    return redirect(url_for('goals'))

@app.route('/goals/<int:goal_id>/delete', methods=['POST'])
def delete_goal(goal_id):
    try:
        goal = Goal.query.get_or_404(goal_id)
        db.session.delete(goal)
        db.session.commit()
        flash('Goal deleted successfully!', 'success')
    except Exception as e:
        flash(f'Error deleting goal: {str(e)}', 'error')
    
    return redirect(url_for('goals'))

# API endpoints for AJAX updates
@app.route('/api/goals/<int:goal_id>/progress', methods=['PUT'])
def update_goal_progress_api(goal_id):
    """Update goal progress via API"""
    try:
        data = request.get_json()
        if not data or 'progress' not in data:
            return jsonify({'success': False, 'error': 'Progress value required'}), 400
        
        progress = data['progress']
        if not isinstance(progress, (int, float)) or progress < 0 or progress > 100:
            return jsonify({'success': False, 'error': 'Progress must be between 0 and 100'}), 400
        
        goal = Goal.query.get(goal_id)
        if not goal:
            return jsonify({'success': False, 'error': 'Goal not found'}), 404
        
        goal.progress = progress
        goal.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'goal': {
                'id': goal.id,
                'title': goal.title,
                'progress': goal.progress,
                'updated_at': goal.updated_at.isoformat()
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/complete', methods=['POST'])
def complete_task_api(task_id):
    """Mark task as complete via API"""
    try:
        task = Task.query.get(task_id)
        if not task:
            return jsonify({'success': False, 'error': 'Task not found'}), 404
        
        task.status = 'completed'
        task.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'task': {
                'id': task.id,
                'title': task.title,
                'status': task.status,
                'priority': task.priority,
                'updated_at': task.updated_at.isoformat()
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# New endpoint for getting motivational quotes
@app.route('/api/motivational-quote')
def get_motivational_quote():
    quotes = [
        {"text": "The way to get started is to quit talking and begin doing.", "author": "Walt Disney"},
        {"text": "Don't let yesterday take up too much of today.", "author": "Will Rogers"},
        {"text": "You learn more from failure than from success.", "author": "Unknown"},
        {"text": "It's not whether you get knocked down, it's whether you get up.", "author": "Vince Lombardi"},
        {"text": "If you are working on something that you really care about, you don't have to be pushed.", "author": "Steve Jobs"},
        {"text": "Success is not final, failure is not fatal: it is the courage to continue that counts.", "author": "Winston Churchill"},
        {"text": "The future belongs to those who believe in the beauty of their dreams.", "author": "Eleanor Roosevelt"},
        {"text": "Don't watch the clock; do what it does. Keep going.", "author": "Sam Levenson"},
        {"text": "Great things never come from comfort zones.", "author": "Anonymous"},
        {"text": "Dream it. Wish it. Do it.", "author": "Anonymous"}
    ]
    
    import random
    random_quote = random.choice(quotes)
    return jsonify(random_quote)

@app.route('/calendar/grid')
def calendar_grid():
    """Enhanced calendar view with month grid layout"""
    try:
        # Get month and year from query params or use current
        month = request.args.get('month', type=int, default=datetime.utcnow().month)
        year = request.args.get('year', type=int, default=datetime.utcnow().year)
        
        # Ensure valid month/year
        if month < 1 or month > 12:
            month = datetime.utcnow().month
        if year < 1900 or year > 2100:
            year = datetime.utcnow().year
        
        # Get the first day of the month and calculate calendar grid
        first_day = datetime(year, month, 1)
        
        # Get the Monday of the week containing the first day
        start_date = first_day - timedelta(days=first_day.weekday() + 1)  # Start on Sunday
        if first_day.weekday() == 6:  # If first day is Sunday
            start_date = first_day
        
        # Calculate date range for the calendar grid (6 weeks)
        
        # Get events for the month (with some buffer for neighboring days)
        start_query = start_date
        end_query = start_date + timedelta(days=42)  # 6 weeks
        
        # Get local events
        local_events = Event.query.filter(
            Event.start_date >= start_query,
            Event.start_date < end_query
        ).all()
        
        # Get Google Calendar events if enabled
        google_events = []
        if GOOGLE_CALENDAR_ENABLED and google_calendar:
            try:
                events_data, _ = google_calendar.get_events(
                    max_results=50,
                    time_min=start_query.isoformat() + 'Z',
                    time_max=end_query.isoformat() + 'Z'
                )
                if events_data:
                    google_events = events_data
            except Exception:
                pass  # Silently handle Google Calendar errors
        
        # Create calendar weeks structure
        calendar_weeks = []
        current_date = start_date
        today = datetime.utcnow().date()
        
        for week in range(6):  # 6 weeks to cover all possible month layouts
            week_days = []
            for day in range(7):  # 7 days per week
                day_info = {
                    'date': current_date,
                    'is_today': current_date.date() == today,
                    'other_month': current_date.month != month,
                    'events': []
                }
                
                # Find events for this day
                day_start = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + timedelta(days=1)
                
                # Add local events
                for event in local_events:
                    if day_start <= event.start_date < day_end:
                        day_info['events'].append({
                            'id': event.id,
                            'title': event.title,
                            'start_time': event.start_date.strftime('%H:%M'),
                            'source': 'local',
                            'css_class': ''
                        })
                
                # Add Google Calendar events
                for event in google_events:
                    event_start = event['start_date']
                    if day_start <= event_start < day_end:
                        day_info['events'].append({
                            'id': event.get('id', ''),
                            'title': event['title'],
                            'start_time': event_start.strftime('%H:%M'),
                            'source': 'google_calendar',
                            'css_class': 'google'
                        })
                
                # Sort events by time
                day_info['events'].sort(key=lambda x: x['start_time'])
                
                week_days.append(day_info)
                current_date += timedelta(days=1)
            
            calendar_weeks.append(week_days)
        
        # Month name for display
        month_names = [
            '', 'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ]
        current_month_year = f"{month_names[month]} {year}"
        
        return render_template('calendar_grid.html',
                             calendar_weeks=calendar_weeks,
                             current_month=month,
                             current_year=year,
                             current_month_year=current_month_year,
                             google_calendar_enabled=GOOGLE_CALENDAR_ENABLED)
    
    except Exception as e:
        flash(f'Error loading calendar grid: {str(e)}', 'error')
        return redirect(url_for('calendar'))

@app.route('/events/<int:event_id>/delete', methods=['POST'])
def delete_event(event_id):
    try:
        event = Event.query.get_or_404(event_id)
        db.session.delete(event)
        db.session.commit()
        flash('Event deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting event: {str(e)}', 'error')
    
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