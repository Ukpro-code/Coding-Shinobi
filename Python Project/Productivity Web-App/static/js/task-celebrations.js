// Task Celebration Library
// Makes task completion feel rewarding and delightful

class TaskCelebration {
    constructor() {
        this.streakCount = this.getStreak();
        this.init();
    }

    init() {
        // Initialize celebration sounds (optional)
        this.sounds = {
            complete: new Audio('/static/sounds/task-complete.mp3'),
            achievement: new Audio('/static/sounds/achievement.mp3')
        };
        
        // Create Web Audio API context for synthetic sounds
        this.audioContext = null;
        this.initAudioContext();
        
        // Set up streak display
        this.updateStreakDisplay();
        
        // Initialize sound settings
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    // Main celebration function
    celebrateTaskCompletion(taskId, taskTitle, priority = 'medium') {
        console.log(`🎉 Celebrating completion of: ${taskTitle}`);
        
        // 1. Visual celebration
        this.showConfetti();
        
        // 2. Success message
        this.showSuccessMessage(taskTitle, priority);
        
        // 3. Update and check streak
        this.updateStreak();
        
        // 4. Animate the completed task
        this.animateTaskCompletion(taskId);
        
        // 5. Play sound (if enabled)
        this.playCompletionSound(priority);
        
        // 6. Check for achievements
        this.checkAchievements();
    }

    // Confetti animation
    showConfetti() {
        // Create confetti container
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.innerHTML = `
            <div class="confetti">🎉</div>
            <div class="confetti">✨</div>
            <div class="confetti">🎊</div>
            <div class="confetti">⭐</div>
            <div class="confetti">🌟</div>
        `;
        
        document.body.appendChild(confettiContainer);
        
        // Remove after animation
        setTimeout(() => {
            confettiContainer.remove();
        }, 3000);
    }

    // Success message with priority-based styling
    showSuccessMessage(taskTitle, priority) {
        const messages = {
            'high': [
                `🚀 Crushing it! "${taskTitle}" is done!`,
                `💪 High priority task completed! You're unstoppable!`,
                `🎯 Mission accomplished! "${taskTitle}" is finished!`
            ],
            'medium': [
                `✅ Great job! "${taskTitle}" is complete!`,
                `🎉 Another task down! You're making progress!`,
                `👏 Well done! "${taskTitle}" is finished!`
            ],
            'low': [
                `✨ Nice work! "${taskTitle}" is done!`,
                `🌟 Task completed! Every step counts!`,
                `👍 Good job finishing "${taskTitle}"!`
            ]
        };

        const priorityMessages = messages[priority] || messages['medium'];
        const randomMessage = priorityMessages[Math.floor(Math.random() * priorityMessages.length)];
        
        this.showToast(randomMessage, priority);
    }

    // Toast notification system
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `celebration-toast celebration-toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Show animation
        setTimeout(() => toast.classList.add('toast-show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // Animate the completed task card
    animateTaskCompletion(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`) || 
                           document.getElementById(`task-${taskId}`);
        
        if (taskElement) {
            // Add completion animation class
            taskElement.classList.add('task-completion-celebration');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                taskElement.classList.remove('task-completion-celebration');
                taskElement.classList.add('task-completed');
            }, 600);
        }
    }

    // Streak management
    updateStreak() {
        this.streakCount++;
        localStorage.setItem('taskStreak', this.streakCount);
        this.updateStreakDisplay();
        
        // Check for streak milestones
        if (this.streakCount % 5 === 0) {
            this.showStreakAchievement(this.streakCount);
        }
    }

    getStreak() {
        return parseInt(localStorage.getItem('taskStreak') || '0');
    }

    updateStreakDisplay() {
        const streakElements = document.querySelectorAll('.task-streak-display');
        streakElements.forEach(element => {
            element.textContent = this.streakCount;
            if (this.streakCount > 0) {
                element.classList.add('streak-active');
            }
        });
    }

    // Achievement system
    showStreakAchievement(streak) {
        let title, message, icon;
        
        if (streak === 5) {
            title = "Getting Started!";
            message = "5 tasks completed! You're building momentum!";
            icon = "🔥";
        } else if (streak === 10) {
            title = "On Fire!";
            message = "10 tasks done! You're on a roll!";
            icon = "⚡";
        } else if (streak === 25) {
            title = "Productivity Master!";
            message = "25 tasks completed! Incredible dedication!";
            icon = "👑";
        } else if (streak === 50) {
            title = "Unstoppable Force!";
            message = "50 tasks! You're a productivity machine!";
            icon = "🚀";
        } else {
            title = "Streak Master!";
            message = `${streak} tasks completed! Amazing consistency!`;
            icon = "🌟";
        }

        this.showAchievementModal(title, message, icon);
        this.playAchievementSound();
    }

    showAchievementModal(title, message, icon) {
        const modal = document.createElement('div');
        modal.className = 'achievement-modal';
        modal.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">${icon}</div>
                <h3 class="achievement-title">${title}</h3>
                <p class="achievement-message">${message}</p>
                <button class="achievement-close" onclick="this.closest('.achievement-modal').remove()">
                    Continue
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Show with animation
        setTimeout(() => modal.classList.add('achievement-show'), 100);
    }

    // Sound effects
    playCompletionSound(priority) {
        if (!this.soundEnabled) return;
        
        try {
            // Try to play audio file first
            if (this.sounds.complete) {
                this.sounds.complete.volume = priority === 'high' ? 0.8 : 0.5;
                this.sounds.complete.play().catch(e => {
                    console.log('Audio file failed, using synthetic sound:', e);
                    this.playSyntheticCompletionSound(priority);
                });
            } else {
                // Fallback to synthetic sound
                this.playSyntheticCompletionSound(priority);
            }
        } catch (e) {
            console.log('Sound not available:', e);
            this.playSyntheticCompletionSound(priority);
        }
    }

    playAchievementSound() {
        if (!this.soundEnabled) return;
        
        try {
            if (this.sounds.achievement) {
                this.sounds.achievement.volume = 0.7;
                this.sounds.achievement.play().catch(e => {
                    console.log('Achievement audio failed, using synthetic sound:', e);
                    this.playSyntheticAchievementSound();
                });
            } else {
                this.playSyntheticAchievementSound();
            }
        } catch (e) {
            console.log('Achievement sound not available:', e);
            this.playSyntheticAchievementSound();
        }
    }

    // Synthetic sound generation for fallback
    playSyntheticCompletionSound(priority = 'medium') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Set frequency based on priority
        const frequency = priority === 'high' ? 800 : priority === 'medium' ? 600 : 400;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // Set volume
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        // Play sound
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    playSyntheticAchievementSound() {
        if (!this.audioContext) return;
        
        // Create a more elaborate achievement sound
        const frequencies = [523, 659, 784, 1047]; // C, E, G, C (major chord)
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
            }, index * 100);
        });
    }

    isSoundEnabled() {
        return this.soundEnabled;
    }

    toggleSounds() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('soundEnabled', this.soundEnabled ? 'true' : 'false');
        return this.soundEnabled;
    }

    // Check for various achievements
    checkAchievements() {
        const today = new Date().toDateString();
        const tasksToday = parseInt(localStorage.getItem(`tasksToday_${today}`) || '0') + 1;
        localStorage.setItem(`tasksToday_${today}`, tasksToday);

        // Daily achievement milestones
        if (tasksToday === 5) {
            this.showAchievementModal(
                "Daily Achiever!", 
                "5 tasks completed today! Great productivity!", 
                "📅"
            );
        } else if (tasksToday === 10) {
            this.showAchievementModal(
                "Super Productive Day!", 
                "10 tasks in one day! You're crushing it!", 
                "💪"
            );
        }
    }

    // Utility function to celebrate without a specific task
    showGeneralCelebration(message, type = 'success') {
        this.showToast(message, type);
        this.showConfetti();
    }
}

// Initialize celebration system when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.taskCelebration = new TaskCelebration();
    console.log('🎉 Task celebration system initialized!');
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaskCelebration;
}
