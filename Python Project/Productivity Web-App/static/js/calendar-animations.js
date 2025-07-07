// Calendar Animations and Interactions
// Smooth animations, loading states, and visual feedback

class CalendarAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventCardAnimations();
        this.setupSyncAnimations();
        this.setupQuickActions();
        this.setupCalendarInteractions();
    }

    // Event card animations
    setupEventCardAnimations() {
        // Animate event cards on load
        const eventCards = document.querySelectorAll('.event-card');
        eventCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('event-card-animated');
        });

        // Add hover effects
        eventCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.animateEventCardHover(card, true);
            });
            
            card.addEventListener('mouseleave', () => {
                this.animateEventCardHover(card, false);
            });
        });
    }

    animateEventCardHover(card, isHover) {
        if (isHover) {
            card.style.transform = 'translateY(-3px) scale(1.02)';
            card.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.2)';
        } else {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = '';
        }
    }

    // Sync animations
    setupSyncAnimations() {
        const syncButton = document.getElementById('sync-calendar');
        if (syncButton) {
            syncButton.addEventListener('click', () => {
                this.animateSync();
            });
        }
    }

    animateSync() {
        const syncStatus = document.querySelector('.sync-status');
        const syncButton = document.getElementById('sync-calendar');
        
        if (syncButton) {
            // Show loading state
            syncButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
            syncButton.disabled = true;
        }

        if (syncStatus) {
            syncStatus.innerHTML = `
                <div class="sync-spinner">
                    <i class="fas fa-sync-alt fa-spin"></i>
                </div>
                <span>Synchronizing with Google Calendar...</span>
            `;
            syncStatus.classList.remove('success', 'error');
        }

        // Simulate sync completion (in real app, this would be handled by the actual sync)
        setTimeout(() => {
            this.showSyncComplete(true);
        }, 2000);
    }

    showSyncComplete(success) {
        const syncStatus = document.querySelector('.sync-status');
        const syncButton = document.getElementById('sync-calendar');
        
        if (syncButton) {
            syncButton.innerHTML = '<i class="fas fa-sync-alt"></i> Sync Calendar';
            syncButton.disabled = false;
        }

        if (syncStatus) {
            if (success) {
                syncStatus.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <span>Calendar synchronized successfully!</span>
                `;
                syncStatus.classList.add('success');
                
                // Auto-hide success message
                setTimeout(() => {
                    syncStatus.style.opacity = '0';
                    setTimeout(() => {
                        syncStatus.style.display = 'none';
                    }, 300);
                }, 3000);
            } else {
                syncStatus.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Sync failed. Please try again.</span>
                `;
                syncStatus.classList.add('error');
            }
        }
    }

    // Quick actions
    setupQuickActions() {
        const quickActionBtns = document.querySelectorAll('.quick-action-btn');
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.animateQuickAction(btn);
            });
        });
    }

    animateQuickAction(button) {
        // Create ripple effect
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
        
        button.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Calendar interactions
    setupCalendarInteractions() {
        // Day hover effects
        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach(day => {
            day.addEventListener('mouseenter', () => {
                this.animateDayHover(day, true);
            });
            
            day.addEventListener('mouseleave', () => {
                this.animateDayHover(day, false);
            });
            
            day.addEventListener('click', () => {
                this.animateDayClick(day);
            });
        });

        // Schedule event interactions
        const scheduleEvents = document.querySelectorAll('.schedule-event');
        scheduleEvents.forEach(event => {
            event.addEventListener('click', () => {
                this.animateScheduleEventClick(event);
            });
        });
    }

    animateDayHover(day, isHover) {
        if (isHover) {
            day.style.transform = 'scale(1.05)';
            day.style.zIndex = '10';
        } else {
            day.style.transform = 'scale(1)';
            day.style.zIndex = '1';
        }
    }

    animateDayClick(day) {
        // Pulse animation
        day.style.animation = 'dayClickPulse 0.3s ease-out';
        
        setTimeout(() => {
            day.style.animation = '';
        }, 300);
    }

    animateScheduleEventClick(event) {
        // Highlight animation
        event.style.background = 'rgba(102, 126, 234, 0.3)';
        event.style.transform = 'translateX(10px)';
        
        setTimeout(() => {
            event.style.background = '';
            event.style.transform = '';
        }, 200);
    }

    // Loading states
    showLoading(container) {
        const loadingHTML = `
            <div class="calendar-loading">
                <div class="loading-spinner"></div>
                <span>Loading calendar events...</span>
            </div>
        `;
        
        if (container) {
            container.innerHTML = loadingHTML;
        }
    }

    hideLoading(container) {
        const loading = container.querySelector('.calendar-loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.remove();
            }, 300);
        }
    }

    // Event creation animation
    animateEventCreation(eventElement) {
        eventElement.style.opacity = '0';
        eventElement.style.transform = 'scale(0.8)';
        
        // Animate in
        setTimeout(() => {
            eventElement.style.transition = 'all 0.5s ease-out';
            eventElement.style.opacity = '1';
            eventElement.style.transform = 'scale(1)';
        }, 100);
    }

    // Event deletion animation
    animateEventDeletion(eventElement, callback) {
        eventElement.style.transition = 'all 0.3s ease-out';
        eventElement.style.opacity = '0';
        eventElement.style.transform = 'scale(0.8) translateX(-20px)';
        
        setTimeout(() => {
            if (callback) callback();
        }, 300);
    }

    // Success/Error message animations
    showMessage(type, message, duration = 5000) {
        const messageContainer = document.getElementById('calendar-messages') || this.createMessageContainer();
        
        const messageElement = document.createElement('div');
        messageElement.className = `calendar-message ${type}`;
        messageElement.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        messageContainer.appendChild(messageElement);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.style.opacity = '0';
                setTimeout(() => {
                    messageElement.remove();
                }, 300);
            }
        }, duration);
    }

    createMessageContainer() {
        const container = document.createElement('div');
        container.id = 'calendar-messages';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1000';
        container.style.maxWidth = '400px';
        
        document.body.appendChild(container);
        return container;
    }

    // Calendar view transitions
    animateViewChange(fromView, toView) {
        if (fromView) {
            fromView.style.transition = 'all 0.3s ease-out';
            fromView.style.opacity = '0';
            fromView.style.transform = 'translateX(-20px)';
        }
        
        setTimeout(() => {
            if (fromView) fromView.style.display = 'none';
            if (toView) {
                toView.style.display = 'block';
                toView.style.opacity = '0';
                toView.style.transform = 'translateX(20px)';
                
                setTimeout(() => {
                    toView.style.transition = 'all 0.3s ease-out';
                    toView.style.opacity = '1';
                    toView.style.transform = 'translateX(0)';
                }, 50);
            }
        }, 300);
    }
}

// Global calendar functions
function refreshCalendar() {
    const container = document.querySelector('.calendar-container');
    window.calendarAnimations.showLoading(container);
    
    // Simulate refresh (in real app, this would make an API call)
    setTimeout(() => {
        window.calendarAnimations.hideLoading(container);
        window.calendarAnimations.showMessage('success', 'Calendar refreshed successfully!');
        location.reload(); // Temporary - in real app, update content dynamically
    }, 1500);
}

function addNewEvent() {
    // This would open the event creation modal/form
    window.calendarAnimations.showMessage('info', 'Opening event creation form...');
    // Navigate to add event page or open modal
    setTimeout(() => {
        window.location.href = '/calendar/add';
    }, 500);
}

function viewCalendarSettings() {
    window.calendarAnimations.showMessage('info', 'Opening calendar settings...');
    // Implementation for calendar settings
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.calendarAnimations = new CalendarAnimations();
    console.log('📅 Calendar animations initialized!');
});

// Add CSS for additional animations
const additionalCSS = `
    <style>
        .event-card-animated {
            animation: eventCardAppear 0.5s ease-out forwards;
        }
        
        .ripple-effect {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        }
        
        @keyframes ripple {
            0% {
                transform: scale(0);
                opacity: 1;
            }
            100% {
                transform: scale(1);
                opacity: 0;
            }
        }
        
        @keyframes dayClickPulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.1);
            }
        }
        
        .message-close {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 0.25rem;
            margin-left: auto;
        }
        
        .calendar-message {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', additionalCSS);

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarAnimations;
}
