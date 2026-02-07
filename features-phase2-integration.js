/**
 * 📊 PHASE 2 INTEGRATION SCRIPT
 * 
 * This script integrates Phase 2 features with the main application
 * Handles navigation and initialization of all Phase 2 features
 * 
 * @version 2.0.0
 * @date 2026-02-06
 */

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase2Integration);
} else {
  initPhase2Integration();
}

function initPhase2Integration() {
  console.log('🚀 Initializing Phase 2 Integration...');

  // Setup navigation event listeners
  setupPhase2Navigation();
  
  console.log('✅ Phase 2 Integration Complete!');
}

function setupPhase2Navigation() {
  // Analytics Dashboard
  const analyticsBtn = document.getElementById('main-menu-analytics');
  const analyticsContainer = document.getElementById('analytics-container');
  const analyticsContent = document.getElementById('analytics-content');
  const analyticsBackBtn = document.getElementById('kembali-ke-main-menu-from-analytics');

  if (analyticsBtn) {
    analyticsBtn.addEventListener('click', () => {
      hideAllContainers();
      analyticsContainer.classList.remove('hidden');
      
      // Generate analytics HTML
      if (window.performanceAnalytics) {
        analyticsContent.innerHTML = window.performanceAnalytics.generateAnalyticsHTML();
      } else {
        analyticsContent.innerHTML = '<p>Loading analytics...</p>';
      }
    });
  }

  if (analyticsBackBtn) {
    analyticsBackBtn.addEventListener('click', () => {
      hideAllContainers();
      document.getElementById('main-menu-container').classList.remove('hidden');
    });
  }

  // Smart Filter
  const filterBtn = document.getElementById('main-menu-filter');
  const filterContainer = document.getElementById('filter-container');
  const filterContent = document.getElementById('filter-content');
  const filterBackBtn = document.getElementById('kembali-ke-main-menu-from-filter');

  if (filterBtn) {
    filterBtn.addEventListener('click', () => {
      hideAllContainers();
      filterContainer.classList.remove('hidden');
      
      // Generate filter HTML
      if (window.smartFilter) {
        filterContent.innerHTML = window.smartFilter.generateFilterHTML();
        setupFilterControls();
      } else {
        filterContent.innerHTML = '<p>Loading filter...</p>';
      }
    });
  }

  if (filterBackBtn) {
    filterBackBtn.addEventListener('click', () => {
      hideAllContainers();
      document.getElementById('main-menu-container').classList.remove('hidden');
    });
  }

  // Pomodoro Timer
  const pomodoroBtn = document.getElementById('main-menu-pomodoro');
  const pomodoroContainer = document.getElementById('pomodoro-container-view');
  const pomodoroContent = document.getElementById('pomodoro-content');
  const pomodoroBackBtn = document.getElementById('kembali-ke-main-menu-from-pomodoro');

  if (pomodoroBtn) {
    pomodoroBtn.addEventListener('click', () => {
      hideAllContainers();
      pomodoroContainer.classList.remove('hidden');
      
      // Generate pomodoro HTML
      if (window.pomodoroTimer) {
        pomodoroContent.innerHTML = window.pomodoroTimer.generateHTML();
        window.pomodoroTimer.initControls();
        // Restore display from saved state
        window.pomodoroTimer.updateDisplay();
        updatePomodoroStats();
      } else {
        pomodoroContent.innerHTML = '<p>Loading Pomodoro timer...</p>';
      }
    });
  }

  if (pomodoroBackBtn) {
    pomodoroBackBtn.addEventListener('click', () => {
      if (window.pomodoroTimer) {
        window.pomodoroTimer.pause();
      }
      hideAllContainers();
      document.getElementById('main-menu-container').classList.remove('hidden');
    });
  }

  // Performance Comparison
  const comparisonBtn = document.getElementById('main-menu-comparison');
  const comparisonContainer = document.getElementById('comparison-container');
  const comparisonContent = document.getElementById('comparison-content');
  const comparisonBackBtn = document.getElementById('kembali-ke-main-menu-from-comparison');

  if (comparisonBtn) {
    comparisonBtn.addEventListener('click', () => {
      hideAllContainers();
      comparisonContainer.classList.remove('hidden');
      
      // Generate comparison HTML
      if (window.averageComparison) {
        comparisonContent.innerHTML = window.averageComparison.generateComparisonHTML();
      } else {
        comparisonContent.innerHTML = '<p>Loading comparison...</p>';
      }
    });
  }

  if (comparisonBackBtn) {
    comparisonBackBtn.addEventListener('click', () => {
      hideAllContainers();
      document.getElementById('main-menu-container').classList.remove('hidden');
    });
  }
}

function setupFilterControls() {
  const applyBtn = document.getElementById('apply-filters');
  const resetBtn = document.getElementById('reset-filters');
  const resultsDiv = document.getElementById('filter-results');

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      if (!window.smartFilter) return;

      // Get filter values
      const category = document.getElementById('filter-category')?.value || 'all';
      const difficulty = document.getElementById('filter-difficulty')?.value || 'all';
      const accuracy = document.getElementById('filter-accuracy')?.value || 'all';
      const status = document.getElementById('filter-status')?.value || 'all';
      const searchTerm = document.getElementById('filter-search')?.value || '';

      // Update filters
      window.smartFilter.setFilter('category', category);
      window.smartFilter.setFilter('difficulty', difficulty);
      window.smartFilter.setFilter('accuracy', accuracy);
      window.smartFilter.setFilter('status', status);
      window.smartFilter.setFilter('searchTerm', searchTerm);

      // Show results (this would need actual question data)
      if (resultsDiv) {
        resultsDiv.innerHTML = `
          <div style="padding: 15px; background: var(--bg-tertiary); border-radius: 10px;">
            <p style="margin: 0; color: var(--text-dark); font-weight: 600;">
              ✅ Filter diterapkan!
            </p>
            <p style="margin: 5px 0 0 0; font-size: 0.9rem; color: var(--text-light);">
              Filter akan aktif saat Anda memulai latihan soal berikutnya.
            </p>
          </div>
        `;
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!window.smartFilter) return;

      window.smartFilter.resetFilters();
      
      // Reset form fields
      const categorySelect = document.getElementById('filter-category');
      const difficultySelect = document.getElementById('filter-difficulty');
      const accuracySelect = document.getElementById('filter-accuracy');
      const statusSelect = document.getElementById('filter-status');
      const searchInput = document.getElementById('filter-search');

      if (categorySelect) categorySelect.value = 'all';
      if (difficultySelect) difficultySelect.value = 'all';
      if (accuracySelect) accuracySelect.value = 'all';
      if (statusSelect) statusSelect.value = 'all';
      if (searchInput) searchInput.value = '';

      if (resultsDiv) {
        resultsDiv.innerHTML = `
          <div style="padding: 15px; background: var(--bg-tertiary); border-radius: 10px;">
            <p style="margin: 0; color: var(--text-dark); font-weight: 600;">
              🔄 Filter direset!
            </p>
          </div>
        `;
      }
    });
  }
}

function updatePomodoroStats() {
  if (!window.pomodoroTimer) return;

  const statsDiv = document.getElementById('pomodoro-today-stats');
  if (!statsDiv) return;

  const stats = window.pomodoroTimer.getStats();
  const today = new Date().toISOString().split('T')[0];
  const todayStats = stats[today] || { sessions: 0, totalMinutes: 0 };

  statsDiv.innerHTML = `
    <div style="display: flex; justify-content: space-around; padding: 15px 0;">
      <div style="text-align: center;">
        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">
          ${todayStats.sessions}
        </div>
        <div style="font-size: 0.85rem; color: var(--text-light);">
          Sesi Selesai
        </div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">
          ${todayStats.totalMinutes}
        </div>
        <div style="font-size: 0.85rem; color: var(--text-light);">
          Menit Belajar
        </div>
      </div>
    </div>
  `;
}

function hideAllContainers() {
  const containers = document.querySelectorAll('.container-view');
  containers.forEach(container => container.classList.add('hidden'));
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
  window.phase2Integration = {
    setupPhase2Navigation,
    setupFilterControls,
    updatePomodoroStats,
    hideAllContainers
  };
}

console.log('📊 Phase 2 Integration Script Loaded!');
