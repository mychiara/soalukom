/**
 * 📊 BIMBEL UKOM - PHASE 2: ANALYTICS & INSIGHTS
 * 
 * Features:
 * 1. Advanced Performance Analytics
 * 2. Smart Filtering & Search
 * 3. Study Time Tracker (Pomodoro)
 * 4. Comparison with Average
 * 
 * @version 2.0.0
 * @date 2026-02-06
 */

// ========================================
// 1. ADVANCED PERFORMANCE ANALYTICS
// ========================================

class PerformanceAnalytics {
  constructor() {
    this.storageKey = 'performanceData';
    this.init();
  }

  init() {
    // Ensure data structure exists
    if (!localStorage.getItem(this.storageKey)) {
      this.resetData();
    }
  }

  resetData() {
    const data = {
      byCategory: {},
      byDifficulty: {},
      monthly: {},
      weekly: {},
      heatmap: {},
      weaknesses: [],
      strengths: []
    };
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  getData() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
  }

  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Track performance by category
  trackPerformance(category, isCorrect, difficulty = 'medium', timeSpent = 0) {
    const data = this.getData();
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7); // YYYY-MM
    const week = this.getWeekNumber(new Date());

    // By Category
    if (!data.byCategory[category]) {
      data.byCategory[category] = {
        total: 0,
        correct: 0,
        incorrect: 0,
        accuracy: 0,
        avgTime: 0,
        totalTime: 0
      };
    }
    data.byCategory[category].total++;
    if (isCorrect) {
      data.byCategory[category].correct++;
    } else {
      data.byCategory[category].incorrect++;
    }
    data.byCategory[category].accuracy = 
      (data.byCategory[category].correct / data.byCategory[category].total * 100).toFixed(1);
    data.byCategory[category].totalTime += timeSpent;
    data.byCategory[category].avgTime = 
      (data.byCategory[category].totalTime / data.byCategory[category].total).toFixed(1);

    // By Difficulty
    if (!data.byDifficulty[difficulty]) {
      data.byDifficulty[difficulty] = { total: 0, correct: 0, accuracy: 0 };
    }
    data.byDifficulty[difficulty].total++;
    if (isCorrect) data.byDifficulty[difficulty].correct++;
    data.byDifficulty[difficulty].accuracy = 
      (data.byDifficulty[difficulty].correct / data.byDifficulty[difficulty].total * 100).toFixed(1);

    // Monthly tracking
    if (!data.monthly[month]) {
      data.monthly[month] = { total: 0, correct: 0, accuracy: 0 };
    }
    data.monthly[month].total++;
    if (isCorrect) data.monthly[month].correct++;
    data.monthly[month].accuracy = 
      (data.monthly[month].correct / data.monthly[month].total * 100).toFixed(1);

    // Weekly tracking
    const weekKey = `${new Date().getFullYear()}-W${week}`;
    if (!data.weekly[weekKey]) {
      data.weekly[weekKey] = { total: 0, correct: 0, accuracy: 0 };
    }
    data.weekly[weekKey].total++;
    if (isCorrect) data.weekly[weekKey].correct++;
    data.weekly[weekKey].accuracy = 
      (data.weekly[weekKey].correct / data.weekly[weekKey].total * 100).toFixed(1);

    // Heatmap data (for calendar view)
    if (!data.heatmap[today]) {
      data.heatmap[today] = 0;
    }
    data.heatmap[today]++;

    // Update weaknesses and strengths
    this.updateWeaknessesAndStrengths(data);

    this.saveData(data);
  }

  updateWeaknessesAndStrengths(data) {
    const categories = Object.entries(data.byCategory)
      .map(([name, stats]) => ({
        name,
        accuracy: parseFloat(stats.accuracy),
        total: stats.total
      }))
      .filter(cat => cat.total >= 5); // Only consider categories with 5+ questions

    // Sort by accuracy
    categories.sort((a, b) => a.accuracy - b.accuracy);

    // Bottom 3 are weaknesses
    data.weaknesses = categories.slice(0, 3).map(c => c.name);

    // Top 3 are strengths
    data.strengths = categories.slice(-3).reverse().map(c => c.name);
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // Generate analytics HTML
  generateAnalyticsHTML() {
    const data = this.getData();
    
    let html = `
      <div class="analytics-dashboard">
        <h2>📊 Analisis Performa</h2>
        
        <!-- Category Performance -->
        <div class="analytics-section">
          <h3>📚 Performa per Kategori</h3>
          <div class="category-stats">
            ${this.generateCategoryBars(data.byCategory)}
          </div>
        </div>

        <!-- Weaknesses & Strengths -->
        <div class="analytics-section">
          <h3>🎯 Analisis Kelemahan & Kekuatan</h3>
          <div class="weakness-strength-grid">
            <div class="weakness-box">
              <h4>⚠️ Perlu Ditingkatkan</h4>
              ${data.weaknesses.length > 0 
                ? data.weaknesses.map(w => `<div class="weakness-item">${w}</div>`).join('')
                : '<p>Belum ada data cukup</p>'}
            </div>
            <div class="strength-box">
              <h4>⭐ Sudah Bagus</h4>
              ${data.strengths.length > 0 
                ? data.strengths.map(s => `<div class="strength-item">${s}</div>`).join('')
                : '<p>Belum ada data cukup</p>'}
            </div>
          </div>
        </div>

        <!-- Monthly Trend -->
        <div class="analytics-section">
          <h3>📈 Tren Bulanan</h3>
          <div class="monthly-chart">
            ${this.generateMonthlyChart(data.monthly)}
          </div>
        </div>

        <!-- Difficulty Analysis -->
        <div class="analytics-section">
          <h3>🎚️ Performa per Tingkat Kesulitan</h3>
          <div class="difficulty-stats">
            ${this.generateDifficultyStats(data.byDifficulty)}
          </div>
        </div>

        <!-- Activity Heatmap -->
        <div class="analytics-section">
          <h3>🗓️ Kalender Aktivitas (30 Hari Terakhir)</h3>
          <div class="heatmap-calendar">
            ${this.generateHeatmap(data.heatmap)}
          </div>
        </div>
      </div>
    `;

    return html;
  }

  generateCategoryBars(categories) {
    if (Object.keys(categories).length === 0) {
      return '<p class="no-data">Belum ada data. Mulai kerjakan soal!</p>';
    }

    return Object.entries(categories)
      .sort((a, b) => b[1].accuracy - a[1].accuracy)
      .map(([name, stats]) => `
        <div class="category-bar">
          <div class="category-info">
            <span class="category-name">${name}</span>
            <span class="category-accuracy">${stats.accuracy}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${stats.accuracy}%"></div>
          </div>
          <div class="category-details">
            ${stats.correct}/${stats.total} benar • Rata-rata ${stats.avgTime}s
          </div>
        </div>
      `).join('');
  }

  generateMonthlyChart(monthly) {
    const months = Object.entries(monthly).slice(-6); // Last 6 months
    if (months.length === 0) {
      return '<p class="no-data">Belum ada data bulanan</p>';
    }

    const maxTotal = Math.max(...months.map(([_, stats]) => stats.total));
    
    return `
      <div class="chart-bars">
        ${months.map(([month, stats]) => `
          <div class="chart-bar-item">
            <div class="chart-bar" style="height: ${(stats.total / maxTotal * 100)}%">
              <span class="chart-value">${stats.total}</span>
            </div>
            <div class="chart-label">${month.substring(5)}</div>
            <div class="chart-accuracy">${stats.accuracy}%</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  generateDifficultyStats(difficulty) {
    const levels = ['easy', 'medium', 'hard'];
    const labels = { easy: 'Mudah', medium: 'Sedang', hard: 'Sulit' };
    const colors = { easy: '#4ade80', medium: '#fbbf24', hard: '#f87171' };

    return levels.map(level => {
      const stats = difficulty[level] || { total: 0, correct: 0, accuracy: 0 };
      return `
        <div class="difficulty-item">
          <div class="difficulty-header">
            <span class="difficulty-label" style="color: ${colors[level]}">${labels[level]}</span>
            <span class="difficulty-accuracy">${stats.accuracy}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${stats.accuracy}%; background: ${colors[level]}"></div>
          </div>
          <div class="difficulty-stats-text">${stats.correct}/${stats.total} benar</div>
        </div>
      `;
    }).join('');
  }

  generateHeatmap(heatmap) {
    const today = new Date();
    const days = [];
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = heatmap[dateStr] || 0;
      days.push({ date: dateStr, count, day: date.getDate() });
    }

    const maxCount = Math.max(...days.map(d => d.count), 1);

    return `
      <div class="heatmap-grid">
        ${days.map(({ date, count, day }) => {
          const intensity = count === 0 ? 0 : Math.ceil((count / maxCount) * 4);
          return `
            <div class="heatmap-cell intensity-${intensity}" 
                 title="${date}: ${count} soal"
                 data-count="${count}">
              ${day === 1 || day === 15 ? day : ''}
            </div>
          `;
        }).join('')}
      </div>
      <div class="heatmap-legend">
        <span>Kurang</span>
        <div class="legend-boxes">
          <div class="legend-box intensity-0"></div>
          <div class="legend-box intensity-1"></div>
          <div class="legend-box intensity-2"></div>
          <div class="legend-box intensity-3"></div>
          <div class="legend-box intensity-4"></div>
        </div>
        <span>Banyak</span>
      </div>
    `;
  }
}

// ========================================
// 2. SMART FILTERING & SEARCH
// ========================================

class SmartFilter {
  constructor() {
    this.filters = {
      category: 'all',
      difficulty: 'all',
      accuracy: 'all', // all, high (>80%), medium (50-80%), low (<50%)
      status: 'all', // all, answered, unanswered, saved
      searchTerm: ''
    };
  }

  // Apply filters to question list
  applyFilters(questions, userHistory = {}) {
    let filtered = [...questions];

    // Category filter
    if (this.filters.category !== 'all') {
      filtered = filtered.filter(q => q.category === this.filters.category);
    }

    // Difficulty filter
    if (this.filters.difficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty === this.filters.difficulty);
    }

    // Accuracy filter (based on user history)
    if (this.filters.accuracy !== 'all') {
      filtered = filtered.filter(q => {
        const history = userHistory[q.id];
        if (!history) return this.filters.accuracy === 'low';
        
        const accuracy = (history.correct / history.attempts) * 100;
        if (this.filters.accuracy === 'high') return accuracy > 80;
        if (this.filters.accuracy === 'medium') return accuracy >= 50 && accuracy <= 80;
        if (this.filters.accuracy === 'low') return accuracy < 50;
        return true;
      });
    }

    // Status filter
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(q => {
        if (this.filters.status === 'answered') return userHistory[q.id];
        if (this.filters.status === 'unanswered') return !userHistory[q.id];
        if (this.filters.status === 'saved') {
          const saved = JSON.parse(localStorage.getItem('savedQuestions') || '[]');
          return saved.includes(q.id);
        }
        return true;
      });
    }

    // Search term
    if (this.filters.searchTerm) {
      const term = this.filters.searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.question.toLowerCase().includes(term) ||
        q.options.some(opt => opt.toLowerCase().includes(term)) ||
        (q.explanation && q.explanation.toLowerCase().includes(term))
      );
    }

    return filtered;
  }

  // Generate filter UI
  generateFilterHTML() {
    return `
      <div class="smart-filter-panel">
        <h3>🔍 Filter & Pencarian</h3>
        
        <div class="filter-group">
          <label>Kategori:</label>
          <select id="filter-category" class="filter-select">
            <option value="all">Semua Kategori</option>
            <!-- Categories will be populated dynamically -->
          </select>
        </div>

        <div class="filter-group">
          <label>Tingkat Kesulitan:</label>
          <select id="filter-difficulty" class="filter-select">
            <option value="all">Semua Tingkat</option>
            <option value="easy">Mudah</option>
            <option value="medium">Sedang</option>
            <option value="hard">Sulit</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Akurasi Saya:</label>
          <select id="filter-accuracy" class="filter-select">
            <option value="all">Semua</option>
            <option value="high">Tinggi (>80%)</option>
            <option value="medium">Sedang (50-80%)</option>
            <option value="low">Rendah (<50%)</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Status:</label>
          <select id="filter-status" class="filter-select">
            <option value="all">Semua</option>
            <option value="answered">Sudah Dijawab</option>
            <option value="unanswered">Belum Dijawab</option>
            <option value="saved">Disimpan</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Cari:</label>
          <input type="text" id="filter-search" class="filter-input" 
                 placeholder="Cari kata kunci...">
        </div>

        <div class="filter-actions">
          <button id="apply-filters" class="btn-primary">Terapkan Filter</button>
          <button id="reset-filters" class="btn-secondary">Reset</button>
        </div>

        <div id="filter-results" class="filter-results"></div>
      </div>
    `;
  }

  setFilter(key, value) {
    this.filters[key] = value;
  }

  resetFilters() {
    this.filters = {
      category: 'all',
      difficulty: 'all',
      accuracy: 'all',
      status: 'all',
      searchTerm: ''
    };
  }
}

// ========================================
// 3. STUDY TIME TRACKER (POMODORO)
// ========================================

class PomodoroTimer {
  constructor() {
    this.workDuration = 25 * 60; // 25 minutes in seconds
    this.breakDuration = 5 * 60; // 5 minutes
    this.longBreakDuration = 15 * 60; // 15 minutes
    this.currentTime = this.workDuration;
    this.isRunning = false;
    this.isWorkSession = true;
    this.sessionsCompleted = 0;
    this.interval = null;
    this.storageKey = 'pomodoroStats';
    this.stateKey = 'pomodoroState';
    
    // Load saved state if exists
    this.loadState();
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.tick();
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    // Save state when paused
    this.saveState();
  }

  reset() {
    this.pause();
    this.currentTime = this.isWorkSession ? this.workDuration : this.breakDuration;
    this.updateDisplay();
    // Clear saved state on reset
    this.clearState();
  }

  tick() {
    this.currentTime--;
    
    if (this.currentTime <= 0) {
      this.onTimerComplete();
    }
    
    this.updateDisplay();
    
    // Auto-save state every 10 seconds
    if (this.currentTime % 10 === 0) {
      this.saveState();
    }
  }

  onTimerComplete() {
    this.pause();
    
    if (this.isWorkSession) {
      // Work session completed
      this.sessionsCompleted++;
      this.saveSession();
      
      // Determine break type
      const isLongBreak = this.sessionsCompleted % 4 === 0;
      this.currentTime = isLongBreak ? this.longBreakDuration : this.breakDuration;
      this.isWorkSession = false;
      
      this.showNotification(
        '🎉 Sesi Belajar Selesai!',
        `Istirahat ${isLongBreak ? '15' : '5'} menit`
      );
    } else {
      // Break completed
      this.currentTime = this.workDuration;
      this.isWorkSession = true;
      
      this.showNotification(
        '💪 Istirahat Selesai!',
        'Siap untuk sesi berikutnya?'
      );
    }
    
    this.updateDisplay();
  }

  saveSession() {
    const stats = this.getStats();
    const today = new Date().toISOString().split('T')[0];
    
    if (!stats[today]) {
      stats[today] = { sessions: 0, totalMinutes: 0 };
    }
    
    stats[today].sessions++;
    stats[today].totalMinutes += 25;
    
    localStorage.setItem(this.storageKey, JSON.stringify(stats));
  }

  getStats() {
    return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
  }

  // Save current timer state to localStorage
  saveState() {
    const state = {
      currentTime: this.currentTime,
      isRunning: this.isRunning,
      isWorkSession: this.isWorkSession,
      sessionsCompleted: this.sessionsCompleted,
      timestamp: Date.now()
    };
    localStorage.setItem(this.stateKey, JSON.stringify(state));
  }

  // Load saved timer state from localStorage
  loadState() {
    try {
      const savedState = localStorage.getItem(this.stateKey);
      if (!savedState) return;

      const state = JSON.parse(savedState);
      
      // Check if state is recent (within last 24 hours)
      const hoursSinceLastSave = (Date.now() - state.timestamp) / (1000 * 60 * 60);
      if (hoursSinceLastSave > 24) {
        this.clearState();
        return;
      }

      // Restore state
      this.currentTime = state.currentTime;
      this.isWorkSession = state.isWorkSession;
      this.sessionsCompleted = state.sessionsCompleted;
      // Don't auto-resume, user needs to click start
      this.isRunning = false;
      
      console.log('✅ Pomodoro state restored');
    } catch (error) {
      console.error('Error loading pomodoro state:', error);
      this.clearState();
    }
  }

  // Clear saved state
  clearState() {
    localStorage.removeItem(this.stateKey);
  }

  updateDisplay() {
    const minutes = Math.floor(this.currentTime / 60);
    const seconds = this.currentTime % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerDisplay = document.getElementById('pomodoro-timer');
    if (timerDisplay) {
      timerDisplay.textContent = timeStr;
    }
    
    const statusDisplay = document.getElementById('pomodoro-status');
    if (statusDisplay) {
      statusDisplay.textContent = this.isWorkSession ? '📚 Belajar' : '☕ Istirahat';
    }
    
    const sessionDisplay = document.getElementById('pomodoro-sessions');
    if (sessionDisplay) {
      sessionDisplay.textContent = `Sesi: ${this.sessionsCompleted}`;
    }
  }

  showNotification(title, message) {
    // Try browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '🍅' });
    }
    
    // Also show in-app notification
    const notif = document.createElement('div');
    notif.className = 'pomodoro-notification';
    notif.innerHTML = `
      <div class="notif-title">${title}</div>
      <div class="notif-message">${message}</div>
    `;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.remove(), 5000);
  }

  generateHTML() {
    return `
      <div class="pomodoro-container">
        <h3>🍅 Pomodoro Timer</h3>
        <div class="pomodoro-display">
          <div id="pomodoro-status" class="pomodoro-status">📚 Belajar</div>
          <div id="pomodoro-timer" class="pomodoro-timer">25:00</div>
          <div id="pomodoro-sessions" class="pomodoro-sessions">Sesi: 0</div>
        </div>
        <div class="pomodoro-controls">
          <button id="pomodoro-start" class="btn-pomodoro">▶️ Mulai</button>
          <button id="pomodoro-pause" class="btn-pomodoro">⏸️ Pause</button>
          <button id="pomodoro-reset" class="btn-pomodoro">🔄 Reset</button>
        </div>
        <div class="pomodoro-stats">
          <h4>Statistik Hari Ini</h4>
          <div id="pomodoro-today-stats"></div>
        </div>
      </div>
    `;
  }

  initControls() {
    document.getElementById('pomodoro-start')?.addEventListener('click', () => this.start());
    document.getElementById('pomodoro-pause')?.addEventListener('click', () => this.pause());
    document.getElementById('pomodoro-reset')?.addEventListener('click', () => this.reset());
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

// ========================================
// 4. COMPARISON WITH AVERAGE
// ========================================

class AverageComparison {
  constructor() {
    this.storageKey = 'globalAverages';
  }

  // Calculate global averages (simulated - in real app would come from server)
  getGlobalAverages() {
    // In production, this would fetch from server
    // For now, we'll use simulated data
    return {
      overallAccuracy: 72.5,
      averageTime: 45, // seconds per question
      questionsPerDay: 15,
      streakAverage: 5,
      byCategory: {
        'Keperawatan Dasar': 75,
        'Keperawatan Medikal Bedah': 68,
        'Keperawatan Anak': 70,
        'Keperawatan Maternitas': 71,
        'Keperawatan Jiwa': 73,
        'Keperawatan Komunitas': 74,
        'Keperawatan Gerontik': 69,
        'Manajemen Keperawatan': 76
      }
    };
  }

  // Calculate user's stats
  getUserStats() {
    const performanceData = JSON.parse(localStorage.getItem('performanceData') || '{}');
    const dailyStats = JSON.parse(localStorage.getItem('dailyStats') || '{}');
    
    // Calculate overall accuracy
    let totalQuestions = 0;
    let totalCorrect = 0;
    
    Object.values(performanceData.byCategory || {}).forEach(cat => {
      totalQuestions += cat.total;
      totalCorrect += cat.correct;
    });
    
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions * 100) : 0;
    
    return {
      overallAccuracy: overallAccuracy.toFixed(1),
      questionsPerDay: dailyStats.questionsToday || 0,
      streak: dailyStats.streak || 0,
      byCategory: performanceData.byCategory || {}
    };
  }

  // Calculate percentile
  calculatePercentile(userValue, average) {
    if (userValue >= average * 1.2) return 90;
    if (userValue >= average * 1.1) return 75;
    if (userValue >= average) return 60;
    if (userValue >= average * 0.9) return 40;
    if (userValue >= average * 0.8) return 25;
    return 10;
  }

  // Generate comparison HTML
  generateComparisonHTML() {
    const globalAvg = this.getGlobalAverages();
    const userStats = this.getUserStats();
    
    const accuracyPercentile = this.calculatePercentile(
      parseFloat(userStats.overallAccuracy),
      globalAvg.overallAccuracy
    );
    
    const streakPercentile = this.calculatePercentile(
      userStats.streak,
      globalAvg.streakAverage
    );

    return `
      <div class="comparison-dashboard">
        <h2>📊 Perbandingan dengan Rata-rata</h2>
        
        <!-- Overall Comparison -->
        <div class="comparison-section">
          <h3>Performa Keseluruhan</h3>
          
          <div class="comparison-card">
            <div class="comparison-metric">
              <div class="metric-label">Akurasi</div>
              <div class="metric-values">
                <div class="user-value">${userStats.overallAccuracy}%</div>
                <div class="vs">vs</div>
                <div class="avg-value">${globalAvg.overallAccuracy}%</div>
              </div>
              <div class="percentile-bar">
                <div class="percentile-fill" style="width: ${accuracyPercentile}%"></div>
              </div>
              <div class="percentile-text">Top ${100 - accuracyPercentile}%</div>
            </div>
          </div>

          <div class="comparison-card">
            <div class="comparison-metric">
              <div class="metric-label">Streak</div>
              <div class="metric-values">
                <div class="user-value">${userStats.streak} hari</div>
                <div class="vs">vs</div>
                <div class="avg-value">${globalAvg.streakAverage} hari</div>
              </div>
              <div class="percentile-bar">
                <div class="percentile-fill" style="width: ${streakPercentile}%"></div>
              </div>
              <div class="percentile-text">Top ${100 - streakPercentile}%</div>
            </div>
          </div>
        </div>

        <!-- Category Comparison -->
        <div class="comparison-section">
          <h3>Perbandingan per Kategori</h3>
          <div class="category-comparison-grid">
            ${this.generateCategoryComparison(userStats.byCategory, globalAvg.byCategory)}
          </div>
        </div>

        <!-- Insights -->
        <div class="comparison-section">
          <h3>💡 Insight</h3>
          <div class="insights-box">
            ${this.generateInsights(userStats, globalAvg)}
          </div>
        </div>
      </div>
    `;
  }

  generateCategoryComparison(userCategories, avgCategories) {
    return Object.keys(avgCategories).map(category => {
      const userAcc = userCategories[category]?.accuracy || 0;
      const avgAcc = avgCategories[category];
      const diff = userAcc - avgAcc;
      const diffClass = diff >= 0 ? 'positive' : 'negative';
      const diffIcon = diff >= 0 ? '📈' : '📉';

      return `
        <div class="category-comparison-item">
          <div class="category-name">${category}</div>
          <div class="comparison-bars">
            <div class="user-bar" style="width: ${userAcc}%">
              <span>${userAcc}%</span>
            </div>
            <div class="avg-bar" style="width: ${avgAcc}%">
              <span>Avg: ${avgAcc}%</span>
            </div>
          </div>
          <div class="difference ${diffClass}">
            ${diffIcon} ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%
          </div>
        </div>
      `;
    }).join('');
  }

  generateInsights(userStats, globalAvg) {
    const insights = [];
    
    const accDiff = parseFloat(userStats.overallAccuracy) - globalAvg.overallAccuracy;
    if (accDiff > 10) {
      insights.push('🌟 Luar biasa! Akurasi Anda jauh di atas rata-rata!');
    } else if (accDiff > 0) {
      insights.push('👍 Bagus! Anda sedikit di atas rata-rata.');
    } else if (accDiff > -10) {
      insights.push('💪 Terus berlatih! Anda hampir mencapai rata-rata.');
    } else {
      insights.push('📚 Fokus belajar! Masih ada ruang untuk improvement.');
    }

    if (userStats.streak > globalAvg.streakAverage * 2) {
      insights.push('🔥 Konsistensi Anda luar biasa! Pertahankan!');
    }

    // Category-specific insights
    Object.entries(userStats.byCategory).forEach(([cat, stats]) => {
      if (parseFloat(stats.accuracy) < 60) {
        insights.push(`⚠️ Fokus lebih pada ${cat} (${stats.accuracy}%)`);
      }
    });

    return insights.length > 0 
      ? insights.map(i => `<div class="insight-item">${i}</div>`).join('')
      : '<div class="insight-item">Kerjakan lebih banyak soal untuk mendapat insight!</div>';
  }
}

// ========================================
// INITIALIZATION
// ========================================

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase2Features);
} else {
  initPhase2Features();
}

function initPhase2Features() {
  // Initialize all Phase 2 features
  window.performanceAnalytics = new PerformanceAnalytics();
  window.smartFilter = new SmartFilter();
  window.pomodoroTimer = new PomodoroTimer();
  window.averageComparison = new AverageComparison();
  
  console.log('✅ Phase 2 Features Initialized!');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PerformanceAnalytics,
    SmartFilter,
    PomodoroTimer,
    AverageComparison
  };
}
