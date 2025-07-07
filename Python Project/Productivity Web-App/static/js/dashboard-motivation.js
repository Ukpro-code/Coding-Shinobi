// Dashboard Motivation and Personalization System
// Adds personalized messages, time-based greetings, and motivational content

class DashboardMotivation {
    constructor() {
        this.userName = localStorage.getItem('userName') || 'Productivity Champion';
        this.init();
    }

    init() {
        this.updateWelcomeMessage();
        this.updateProgressEncouragement();
        this.addMotivationalQuote();
        this.updatePersonalizedStats();
        
        // Update every minute for time-sensitive messages
        setInterval(() => this.updateWelcomeMessage(), 60000);
    }

    // Time-based personalized greeting
    updateWelcomeMessage() {
        const now = new Date();
        const hour = now.getHours();
        const greeting = this.getTimeBasedGreeting(hour);
        const motivationalContext = this.getMotivationalContext();
        
        const welcomeElement = document.getElementById('welcome-message');
        if (welcomeElement) {
            welcomeElement.innerHTML = `
                <div class="welcome-greeting">
                    <h2 class="greeting-text">${greeting}, ${this.userName}!</h2>
                    <p class="motivational-context">${motivationalContext}</p>
                </div>
            `;
        }
    }

    getTimeBasedGreeting(hour) {
        if (hour >= 5 && hour < 12) {
            return this.getRandomFromArray([
                "Good morning", "Rise and shine", "Good morning, sunshine",
                "Hello there", "Top of the morning"
            ]);
        } else if (hour >= 12 && hour < 17) {
            return this.getRandomFromArray([
                "Good afternoon", "Hello", "Good day",
                "Afternoon greetings", "Hello there"
            ]);
        } else if (hour >= 17 && hour < 21) {
            return this.getRandomFromArray([
                "Good evening", "Evening", "Hello",
                "Good evening there", "Hey there"
            ]);
        } else {
            return this.getRandomFromArray([
                "Good evening", "Hello night owl", "Working late",
                "Evening productivity", "Night time focus"
            ]);
        }
    }

    getMotivationalContext() {
        const contexts = [
            "Ready to make today amazing?",
            "Let's tackle your goals together!",
            "Every small step counts toward your dreams.",
            "You've got this! What's your priority today?",
            "Time to turn your plans into achievements.",
            "Your future self will thank you for today's efforts.",
            "Great things happen when you stay focused.",
            "Today is full of possibilities - let's make it count!",
            "Progress, not perfection - that's what matters.",
            "You're building something great, one task at a time."
        ];
        return this.getRandomFromArray(contexts);
    }

    // Progress-based encouragement
    updateProgressEncouragement() {
        const stats = this.getProductivityStats();
        const encouragement = this.generateProgressEncouragement(stats);
        
        const encouragementElement = document.getElementById('progress-encouragement');
        if (encouragementElement) {
            encouragementElement.innerHTML = encouragement;
        }
    }

    generateProgressEncouragement(stats) {
        const { completedToday, streakDays, totalCompleted } = stats;
        
        if (completedToday === 0) {
            return `
                <div class="encouragement-card">
                    <i class="fas fa-star text-warning"></i>
                    <span>Ready to start your day strong? Complete your first task!</span>
                </div>
            `;
        } else if (completedToday >= 1 && completedToday < 3) {
            return `
                <div class="encouragement-card">
                    <i class="fas fa-fire text-danger"></i>
                    <span>Great start! You've completed ${completedToday} task${completedToday > 1 ? 's' : ''} today. Keep the momentum going!</span>
                </div>
            `;
        } else if (completedToday >= 3 && completedToday < 5) {
            return `
                <div class="encouragement-card">
                    <i class="fas fa-rocket text-primary"></i>
                    <span>You're on fire! ${completedToday} tasks completed today. You're unstoppable!</span>
                </div>
            `;
        } else {
            return `
                <div class="encouragement-card">
                    <i class="fas fa-trophy text-warning"></i>
                    <span>Incredible! ${completedToday} tasks completed today. You're a productivity superstar!</span>
                </div>
            `;
        }
    }

    // Add motivational quote
    addMotivationalQuote() {
        const quotes = [
            { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
            { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
            { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
            { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
            { text: "Your limitation—it's only your imagination.", author: "Unknown" },
            { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
            { text: "Great things never come from comfort zones.", author: "Unknown" },
            { text: "Dream it. Wish it. Do it.", author: "Unknown" },
            { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
            { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" }
        ];
        
        const quote = this.getRandomFromArray(quotes);
        const quoteElement = document.getElementById('daily-quote');
        if (quoteElement) {
            quoteElement.innerHTML = `
                <div class="quote-card">
                    <i class="fas fa-quote-left quote-icon"></i>
                    <p class="quote-text">"${quote.text}"</p>
                    <p class="quote-author">— ${quote.author}</p>
                </div>
            `;
        }
    }

    // Update personalized statistics
    updatePersonalizedStats() {
        const stats = this.getProductivityStats();
        const achievements = this.getAchievements();
        
        const statsElement = document.getElementById('personalized-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${stats.completedToday}</div>
                        <div class="stat-label">Tasks Today</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.streakDays}</div>
                        <div class="stat-label">Day Streak</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.totalCompleted}</div>
                        <div class="stat-label">Total Tasks</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${achievements.length}</div>
                        <div class="stat-label">Achievements</div>
                    </div>
                </div>
            `;
        }
    }

    // Get productivity statistics
    getProductivityStats() {
        const today = new Date().toDateString();
        const completedToday = parseInt(localStorage.getItem(`tasksToday_${today}`) || '0');
        const streakDays = parseInt(localStorage.getItem('taskStreak') || '0');
        const totalCompleted = parseInt(localStorage.getItem('totalTasksCompleted') || '0');
        
        return { completedToday, streakDays, totalCompleted };
    }

    // Get achievements
    getAchievements() {
        const achievements = localStorage.getItem('achievements');
        return achievements ? JSON.parse(achievements) : [];
    }

    // Utility function
    getRandomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Set user name
    setUserName(name) {
        this.userName = name;
        localStorage.setItem('userName', name);
        this.updateWelcomeMessage();
    }

    // Show achievement highlights
    showAchievementHighlights() {
        const achievements = this.getAchievements();
        const recent = achievements.slice(-3); // Show last 3 achievements
        
        const highlightsElement = document.getElementById('achievement-highlights');
        if (highlightsElement && recent.length > 0) {
            highlightsElement.innerHTML = `
                <div class="achievements-section">
                    <h6><i class="fas fa-trophy text-warning me-2"></i>Recent Achievements</h6>
                    <div class="achievements-list">
                        ${recent.map(achievement => `
                            <div class="achievement-badge">
                                <i class="${achievement.icon}"></i>
                                <span>${achievement.title}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }
}

// Initialize dashboard motivation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardMotivation = new DashboardMotivation();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardMotivation;
}
