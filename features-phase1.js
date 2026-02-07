// ====================================
// PHASE 1 FEATURES - Bimbel UKOM
// Dark Mode, Daily Stats, Achievements
// ====================================

// ==================== DARK MODE ====================
class ThemeManager {
    constructor() {
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.init();
    }

    init() {
        // Check for saved theme or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            this.enableDarkMode();
        }

        // Event listener
        if (this.themeToggleBtn) {
            this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                e.matches ? this.enableDarkMode() : this.disableDarkMode();
            }
        });
    }

    toggleTheme() {
        document.body.classList.contains('dark-mode') 
            ? this.disableDarkMode() 
            : this.enableDarkMode();
    }

    enableDarkMode() {
        document.body.classList.add('dark-mode');
        if (this.themeToggleBtn) {
            const icon = this.themeToggleBtn.querySelector('i');
            icon.className = 'fa-solid fa-sun';
        }
        localStorage.setItem('theme', 'dark');
    }

    disableDarkMode() {
        document.body.classList.remove('dark-mode');
        if (this.themeToggleBtn) {
            const icon = this.themeToggleBtn.querySelector('i');
            icon.className = 'fa-solid fa-moon';
        }
        localStorage.setItem('theme', 'light');
    }
}

// ==================== DAILY STATS & STREAK ====================
class DailyStatsManager {
    constructor() {
        this.streakValueEl = document.getElementById('streak-value');
        this.dailyProgressValueEl = document.getElementById('daily-progress-value');
        this.studyTimeValueEl = document.getElementById('study-time-value');
        this.progressBarEl = document.getElementById('daily-progress-bar');
        
        this.dailyTarget = 10; // Default target: 10 soal per hari
        this.studyStartTime = null;
        this.totalStudyTimeToday = 0;
        
        this.init();
    }

    init() {
        this.loadDailyStats();
        this.updateDisplays();
        this.startStudyTimer();
    }

    loadDailyStats() {
        const stats = this.getDailyStats();
        const today = this.getTodayString();

        // Check if we need to reset daily progress
        if (stats.lastActiveDate !== today) {
            // Check streak
            const yesterday = this.getYesterdayString();
            if (stats.lastActiveDate === yesterday) {
                // Streak continues
                stats.streak += 1;
            } else if (stats.lastActiveDate && stats.lastActiveDate !== today) {
                // Streak broken
                stats.streak = 1;
            } else {
                // First time
                stats.streak = 1;
            }

            // Reset daily counts
            stats.questionsToday = 0;
            stats.studyTimeToday = 0;
            stats.lastActiveDate = today;
            
            this.saveDailyStats(stats);
        }

        return stats;
    }

    getDailyStats() {
        const defaults = {
            streak: 0,
            questionsToday: 0,
            studyTimeToday: 0,
            lastActiveDate: null,
            dailyTarget: this.dailyTarget
        };

        try {
            const saved = localStorage.getItem('dailyStats');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch (e) {
            return defaults;
        }
    }

    saveDailyStats(stats) {
        try {
            localStorage.setItem('dailyStats', JSON.stringify(stats));
        } catch (e) {
            console.error('Failed to save daily stats:', e);
        }
    }

    incrementQuestionCount() {
        const stats = this.getDailyStats();
        stats.questionsToday += 1;
        stats.lastActiveDate = this.getTodayString();
        this.saveDailyStats(stats);
        this.updateDisplays();

        // Check for achievements
        this.checkDailyAchievements(stats);
    }

    startStudyTimer() {
        this.studyStartTime = Date.now();
        
        // Update study time every minute
        setInterval(() => {
            if (this.studyStartTime) {
                const sessionTime = Math.floor((Date.now() - this.studyStartTime) / 60000);
                const stats = this.getDailyStats();
                stats.studyTimeToday = (stats.studyTimeToday || 0) + 1;
                this.saveDailyStats(stats);
                this.updateDisplays();
            }
        }, 60000); // Every minute
    }

    updateDisplays() {
        const stats = this.getDailyStats();
        
        // Update streak
        if (this.streakValueEl) {
            this.streakValueEl.textContent = stats.streak || 0;
        }

        // Update daily progress
        if (this.dailyProgressValueEl) {
            this.dailyProgressValueEl.textContent = `${stats.questionsToday}/${stats.dailyTarget || this.dailyTarget}`;
        }

        // Update study time
        if (this.studyTimeValueEl) {
            const hours = Math.floor(stats.studyTimeToday / 60);
            const minutes = stats.studyTimeToday % 60;
            const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
            this.studyTimeValueEl.textContent = timeStr;
        }

        // Update progress bar
        if (this.progressBarEl) {
            const progress = Math.min((stats.questionsToday / (stats.dailyTarget || this.dailyTarget)) * 100, 100);
            this.progressBarEl.style.width = `${progress}%`;
        }
    }

    checkDailyAchievements(stats) {
        // Target reached
        if (stats.questionsToday === stats.dailyTarget) {
            window.achievementManager?.unlock('daily_target_reached', {
                title: 'Target Tercapai! 🎯',
                description: `Selamat! Anda telah menyelesaikan ${stats.dailyTarget} soal hari ini!`
            });
        }

        // Streak milestones
        if ([3, 7, 14, 30, 60, 100].includes(stats.streak)) {
            window.achievementManager?.unlock(`streak_${stats.streak}`, {
                title: `${stats.streak} Hari Berturut! 🔥`,
                description: `Luar biasa! Anda telah belajar selama ${stats.streak} hari berturut-turut!`
            });
        }

        // Study time milestones (in minutes)
        if ([30, 60, 120, 180].includes(stats.studyTimeToday)) {
            const hours = Math.floor(stats.studyTimeToday / 60);
            window.achievementManager?.unlock(`study_time_${stats.studyTimeToday}`, {
                title: `${hours > 0 ? hours + ' Jam' : stats.studyTimeToday + ' Menit'} Belajar! ⏱️`,
                description: `Dedikasi yang luar biasa! Terus semangat!`
            });
        }
    }

    getTodayString() {
        return new Date().toISOString().split('T')[0];
    }

    getYesterdayString() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }
}

// ==================== ACHIEVEMENTS ====================
class AchievementManager {
    constructor() {
        this.popupEl = document.getElementById('achievement-popup');
        this.titleEl = document.getElementById('achievement-popup-title');
        this.descEl = document.getElementById('achievement-popup-description');
        this.achievementsUnlocked = this.loadAchievements();
        this.queue = [];
        this.isShowing = false;
    }

    loadAchievements() {
        try {
            const saved = localStorage.getItem('achievements');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }

    saveAchievements() {
        try {
            localStorage.setItem('achievements', JSON.stringify(this.achievementsUnlocked));
        } catch (e) {
            console.error('Failed to save achievements:', e);
        }
    }

    unlock(achievementId, { title, description, icon = 'fa-trophy' }) {
        // Check if already unlocked
        if (this.achievementsUnlocked.includes(achievementId)) {
            return;
        }

        // Add to unlocked list
        this.achievementsUnlocked.push(achievementId);
        this.saveAchievements();

        // Show notification
        this.show({ title, description, icon });
    }

    show({ title, description, icon }) {
        // Add to queue
        this.queue.push({ title, description, icon });
        
        // Show if not currently showing
        if (!this.isShowing) {
            this.showNext();
        }
    }

    showNext() {
        if (this.queue.length === 0) {
            this.isShowing = false;
            return;
        }

        this.isShowing = true;
        const achievement = this.queue.shift();

        // Update content
        if (this.titleEl) this.titleEl.textContent = achievement.title;
        if (this.descEl) this.descEl.textContent = achievement.description;
        
        // Update icon
        const badgeIcon = this.popupEl?.querySelector('.achievement-badge i');
        if (badgeIcon) badgeIcon.className = `fa-solid ${achievement.icon}`;

        // Show popup
        if (this.popupEl) {
            this.popupEl.classList.add('show');
        }

        // Auto-hide after 4 seconds
        setTimeout(() => {
            if (this.popupEl) {
                this.popupEl.classList.remove('show');
            }
            // Show next after hide animation
            setTimeout(() => this.showNext(), 500);
        }, 4000);
    }

    hasUnlocked(achievementId) {
        return this.achievementsUnlocked.includes(achievementId);
    }

    getAll() {
        return this.achievementsUnlocked;
    }

    reset() {
        this.achievementsUnlocked = [];
        this.saveAchievements();
    }
}

// ==================== INITIALIZATION ====================
// Make managers globally accessible
window.themeManager = null;
window.dailyStatsManager = null;
window.achievementManager = null;

// Initialize when DOM is ready
function initPhase1Features() {
    console.log('🚀 Initializing Phase 1 Features...');
    
    try {
        window.themeManager = new ThemeManager();
        console.log('✅ Dark Mode initialized');
    } catch (e) {
        console.error('❌ Dark Mode failed:', e);
    }

    try {
        window.achievementManager = new AchievementManager();
        console.log('✅ Achievement System initialized');
    } catch (e) {
        console.error('❌ Achievement System failed:', e);
    }

    try {
        window.dailyStatsManager = new DailyStatsManager();
        console.log('✅ Daily Stats initialized');
    } catch (e) {
        console.error('❌ Daily Stats failed:', e);
    }

    console.log('🎉 Phase 1 Features initialized successfully!');
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhase1Features);
} else {
    initPhase1Features();
}

// Export for use in main script
export { ThemeManager, DailyStatsManager, AchievementManager, initPhase1Features };
