// Goal Countdown and Progress Visualization System
// Adds countdown clocks, progress rings, and achievement celebrations

class GoalCountdown {
    constructor() {
        this.goals = [];
        this.init();
    }

    init() {
        this.loadGoals();
        this.createCountdownElements();
        this.updateCountdowns();
        
        // Update every second for real-time countdown
        setInterval(() => this.updateCountdowns(), 1000);
    }

    loadGoals() {
        // This would normally fetch from the server
        // For now, we'll simulate with localStorage
        const storedGoals = localStorage.getItem('goals');
        this.goals = storedGoals ? JSON.parse(storedGoals) : [];
    }

    createCountdownElements() {
        const container = document.getElementById('goal-countdowns');
        if (!container) return;

        container.innerHTML = `
            <div class="goal-countdown-grid">
                ${this.goals.map(goal => this.createGoalCard(goal)).join('')}
            </div>
        `;
    }

    createGoalCard(goal) {
        const countdown = this.calculateCountdown(goal.target_date);
        const progress = goal.progress || 0;
        const urgencyClass = this.getUrgencyClass(countdown.totalDays);
        
        return `
            <div class="goal-card ${urgencyClass}" data-goal-id="${goal.id}">
                <div class="goal-header">
                    <h6 class="goal-title">${goal.title}</h6>
                    <span class="goal-type-badge">${goal.goal_type}</span>
                </div>
                
                <div class="goal-progress-section">
                    <div class="progress-ring-container">
                        <svg class="progress-ring" width="80" height="80">
                            <circle class="progress-ring-circle-bg" cx="40" cy="40" r="35"></circle>
                            <circle class="progress-ring-circle" cx="40" cy="40" r="35" 
                                    stroke-dasharray="${2 * Math.PI * 35}"
                                    stroke-dashoffset="${2 * Math.PI * 35 * (1 - progress / 100)}">
                            </circle>
                        </svg>
                        <div class="progress-text">
                            <span class="progress-percentage">${Math.round(progress)}%</span>
                        </div>
                    </div>
                    
                    <div class="countdown-display">
                        <div class="countdown-unit">
                            <span class="countdown-number" data-unit="days">${countdown.days}</span>
                            <span class="countdown-label">Days</span>
                        </div>
                        <div class="countdown-unit">
                            <span class="countdown-number" data-unit="hours">${countdown.hours}</span>
                            <span class="countdown-label">Hours</span>
                        </div>
                        <div class="countdown-unit">
                            <span class="countdown-number" data-unit="minutes">${countdown.minutes}</span>
                            <span class="countdown-label">Min</span>
                        </div>
                    </div>
                </div>
                
                <div class="goal-actions">
                    <button class="btn btn-sm btn-primary" onclick="updateGoalProgress(${goal.id})">
                        <i class="fas fa-plus"></i> Update Progress
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="viewGoalDetails(${goal.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
                
                <div class="goal-description">
                    <p>${goal.description || 'No description available'}</p>
                </div>
            </div>
        `;
    }

    calculateCountdown(targetDate) {
        const now = new Date();
        const target = new Date(targetDate);
        const diff = target - now;

        if (diff <= 0) {
            return {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                totalDays: 0,
                expired: true
            };
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return {
            days,
            hours,
            minutes,
            seconds,
            totalDays: days,
            expired: false
        };
    }

    getUrgencyClass(daysRemaining) {
        if (daysRemaining === 0) return 'goal-expired';
        if (daysRemaining <= 3) return 'goal-critical';
        if (daysRemaining <= 7) return 'goal-urgent';
        if (daysRemaining <= 14) return 'goal-upcoming';
        return 'goal-normal';
    }

    updateCountdowns() {
        this.goals.forEach(goal => {
            const countdown = this.calculateCountdown(goal.target_date);
            const goalCard = document.querySelector(`[data-goal-id="${goal.id}"]`);
            
            if (goalCard) {
                const daysEl = goalCard.querySelector('[data-unit="days"]');
                const hoursEl = goalCard.querySelector('[data-unit="hours"]');
                const minutesEl = goalCard.querySelector('[data-unit="minutes"]');
                
                if (daysEl) daysEl.textContent = countdown.days;
                if (hoursEl) hoursEl.textContent = countdown.hours;
                if (minutesEl) minutesEl.textContent = countdown.minutes;

                // Update urgency class
                const urgencyClass = this.getUrgencyClass(countdown.totalDays);
                goalCard.className = `goal-card ${urgencyClass}`;
                
                // Check for deadline warnings
                this.checkDeadlineWarnings(goal, countdown);
            }
        });
    }

    checkDeadlineWarnings(goal, countdown) {
        const warningKey = `deadline_warning_${goal.id}`;
        const lastWarning = localStorage.getItem(warningKey);
        const now = new Date().toDateString();
        
        if (lastWarning === now) return; // Already warned today
        
        if (countdown.totalDays === 1) {
            this.showDeadlineWarning(goal, 'Tomorrow is the deadline!', 'warning');
            localStorage.setItem(warningKey, now);
        } else if (countdown.totalDays === 0 && !countdown.expired) {
            this.showDeadlineWarning(goal, 'Deadline is TODAY!', 'danger');
            localStorage.setItem(warningKey, now);
        } else if (countdown.expired) {
            this.showDeadlineWarning(goal, 'Deadline has passed!', 'danger');
            localStorage.setItem(warningKey, now);
        }
    }

    showDeadlineWarning(goal, message, type) {
        const notification = document.createElement('div');
        notification.className = `deadline-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>${goal.title}</strong>
                    <p>${message}</p>
                </div>
                <button class="btn btn-sm btn-outline-light" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    updateGoalProgress(goalId, newProgress) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        const oldProgress = goal.progress;
        goal.progress = Math.min(100, Math.max(0, newProgress));
        
        // Update local storage
        localStorage.setItem('goals', JSON.stringify(this.goals));
        
        // Update UI
        this.updateProgressRing(goalId, goal.progress);
        
        // Check for milestone celebrations
        this.checkMilestoneCelebrations(goal, oldProgress);
        
        // Update server (if available)
        this.syncGoalProgress(goalId, goal.progress);
    }

    updateProgressRing(goalId, progress) {
        const goalCard = document.querySelector(`[data-goal-id="${goalId}"]`);
        if (!goalCard) return;

        const circle = goalCard.querySelector('.progress-ring-circle');
        const progressText = goalCard.querySelector('.progress-percentage');
        
        if (circle && progressText) {
            const circumference = 2 * Math.PI * 35;
            const offset = circumference * (1 - progress / 100);
            
            circle.style.strokeDashoffset = offset;
            progressText.textContent = `${Math.round(progress)}%`;
            
            // Add animation
            circle.style.transition = 'stroke-dashoffset 0.5s ease-in-out';
        }
    }

    checkMilestoneCelebrations(goal, oldProgress) {
        const milestones = [25, 50, 75, 100];
        const currentProgress = goal.progress;
        
        milestones.forEach(milestone => {
            if (oldProgress < milestone && currentProgress >= milestone) {
                this.celebrateGoalMilestone(goal, milestone);
            }
        });
    }

    celebrateGoalMilestone(goal, milestone) {
        const celebration = {
            title: `🎉 Goal Milestone Reached!`,
            message: `You've completed ${milestone}% of "${goal.title}"`,
            type: 'milestone',
            goal: goal,
            milestone: milestone
        };
        
        this.showCelebrationModal(celebration);
        
        // Add to achievements
        this.addAchievement({
            id: Date.now(),
            title: `${milestone}% Progress`,
            description: `Reached ${milestone}% on "${goal.title}"`,
            icon: 'fas fa-trophy',
            date: new Date().toISOString(),
            type: 'milestone'
        });
    }

    showCelebrationModal(celebration) {
        const modal = document.createElement('div');
        modal.className = 'celebration-modal milestone-celebration';
        modal.innerHTML = `
            <div class="celebration-content">
                <div class="celebration-header">
                    <h3>${celebration.title}</h3>
                    <div class="celebration-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                </div>
                <div class="celebration-body">
                    <p>${celebration.message}</p>
                    <div class="progress-display">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${celebration.milestone}%"></div>
                        </div>
                        <span class="progress-label">${celebration.milestone}% Complete</span>
                    </div>
                </div>
                <div class="celebration-actions">
                    <button class="btn btn-primary" onclick="this.closest('.celebration-modal').remove()">
                        Continue!
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 100);
    }

    addAchievement(achievement) {
        const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        achievements.push(achievement);
        localStorage.setItem('achievements', JSON.stringify(achievements));
    }

    syncGoalProgress(goalId, progress) {
        // This would sync with the server
        fetch(`/api/goals/${goalId}/progress`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ progress: progress })
        }).catch(error => {
            console.log('Sync failed:', error);
        });
    }
}

// Global functions for UI interactions
function updateGoalProgress(goalId) {
    const newProgress = prompt('Enter new progress percentage (0-100):');
    if (newProgress !== null) {
        const progress = parseInt(newProgress);
        if (!isNaN(progress) && progress >= 0 && progress <= 100) {
            window.goalCountdown.updateGoalProgress(goalId, progress);
        } else {
            alert('Please enter a valid percentage between 0 and 100');
        }
    }
}

function viewGoalDetails(goalId) {
    window.location.href = `/goals/${goalId}`;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.goalCountdown = new GoalCountdown();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoalCountdown;
}
