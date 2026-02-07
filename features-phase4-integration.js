/**
 * 📱 PHASE 4 INTEGRATION
 * Connects Phase 4 PWA & Notification features to the main app
 * 
 * @version 4.0.0
 * @date 2026-02-06
 */

// Wait for DOM and Phase 4 features to load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase4Integration);
} else {
  initPhase4Integration();
}

function initPhase4Integration() {
  console.log('🎯 Initializing Phase 4 Integration...');
  
  // Wait for Phase 4 features to be available (max 10 seconds for mobile)
  let attempts = 0;
  const maxAttempts = 100; // 10 seconds (100 * 100ms)
  
  const checkInterval = setInterval(() => {
    if (window.pwaInstall && window.notificationManager && window.offlineDetector) {
      clearInterval(checkInterval);
      setupPhase4Features();
      console.log('✅ Phase 4 Integration Complete!');
    } else if (++attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.warn('⚠️ Phase 4 features took too long to load, using fallback mode');
      console.warn('Missing:', {
        pwaInstall: !window.pwaInstall,
        notificationManager: !window.notificationManager,
        offlineDetector: !window.offlineDetector,
        cacheManager: !window.cacheManager,
        backgroundSync: !window.backgroundSync
      });
      
      // Setup partial features that are available
      setupPartialPhase4Features();
    }
  }, 100);
}

// ========================================
// SETUP PHASE 4 FEATURES
// ========================================

function setupPhase4Features() {
  try {
    setupNotificationHandlers();
    setupOfflineHandlers();
    setupPWAHandlers();
    scheduleDailyReminders();
    checkStreakStatus();
  } catch (error) {
    console.error('Error setting up Phase 4 features:', error);
  }
}

// Setup only available features
function setupPartialPhase4Features() {
  try {
    if (window.notificationManager) {
      setupNotificationHandlers();
    }
    if (window.offlineDetector) {
      setupOfflineHandlers();
    }
    if (window.pwaInstall) {
      setupPWAHandlers();
    }
    console.log('✅ Partial Phase 4 Integration Complete!');
  } catch (error) {
    console.error('Error in partial Phase 4 setup:', error);
  }
}

// ========================================
// NOTIFICATION HANDLERS
// ========================================

function setupNotificationHandlers() {
  try {
    // Request permission on first achievement
    if (window.enhancedAchievements) {
      const originalCheckAchievements = window.enhancedAchievements.checkAchievements.bind(window.enhancedAchievements);
      
      window.enhancedAchievements.checkAchievements = async function(stats) {
        const newAchievements = originalCheckAchievements(stats);
        
        // Check if Notification API is available
        if (!('Notification' in window)) {
          return newAchievements;
        }
        
        // Request notification permission if not already
        if (newAchievements.length > 0 && Notification.permission === 'default') {
          await window.notificationManager.requestPermission();
        }
        
        // Send notification for each new achievement
        if (Notification.permission === 'granted') {
          newAchievements.forEach(achievement => {
            window.notificationManager.notifyAchievementUnlocked(achievement);
          });
        }
        
        return newAchievements;
      };
    }

    // Daily target notifications
    if (window.dailyStats) {
      const checkDailyTarget = () => {
        try {
          const stats = window.dailyStats.getData();
          const target = stats.dailyTarget || 10;
          const current = stats.questionsToday || 0;
          
          if (current === target) {
            window.notificationManager.notifyDailyTarget(current, target);
          }
        } catch (error) {
          console.warn('Error checking daily target:', error);
        }
      };
      
      // Check after each quiz
      window.addEventListener('quizCompleted', checkDailyTarget);
    }
  } catch (error) {
    console.error('Error setting up notification handlers:', error);
  }
}

// ========================================
// OFFLINE HANDLERS
// ========================================

function setupOfflineHandlers() {
  window.offlineDetector.onStatusChange((status) => {
    console.log(`Connection status: ${status}`);
    
    if (status === 'online') {
      // Trigger background sync if available
      if (window.backgroundSync) {
        try {
          window.backgroundSync.registerSync('sync-quiz-results');
          window.backgroundSync.registerSync('sync-progress');
        } catch (error) {
          console.warn('Background sync not available:', error);
        }
      }
      
      // Update leaderboard
      if (window.leaderboard) {
        window.leaderboard.refresh();
      }
    } else {
      // Show offline mode indicator
      showOfflineMode();
    }
  });
}

function showOfflineMode() {
  // Add offline mode badge to UI
  const badge = document.createElement('div');
  badge.id = 'offline-mode-badge';
  badge.className = 'offline-badge';
  badge.innerHTML = '📡 Mode Offline';
  document.body.appendChild(badge);
}

// ========================================
// PWA HANDLERS
// ========================================

function setupPWAHandlers() {
  // Add PWA settings to menu (if exists)
  const settingsBtn = document.getElementById('settings-button');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', showPWASettings);
  }
  
  // Handle deep links
  handleDeepLinks();
}

function showPWASettings() {
  const modal = document.createElement('div');
  modal.className = 'pwa-settings-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>📱 Pengaturan PWA</h2>
      
      <div class="settings-section">
        <h3>Notifikasi</h3>
        <label>
          <input type="checkbox" id="pref-study-reminders" />
          Pengingat Belajar
        </label>
        <label>
          <input type="checkbox" id="pref-streak-alerts" />
          Peringatan Streak
        </label>
        <label>
          <input type="checkbox" id="pref-achievements" />
          Notifikasi Achievement
        </label>
      </div>
      
      <div class="settings-section">
        <h3>Cache</h3>
        <p id="cache-size">Memuat...</p>
        <button id="btn-clear-cache">Bersihkan Cache</button>
      </div>
      
      <button class="btn-close" id="close-settings">Tutup</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Load cache size
  window.pwaInstall.getCacheSize().then(size => {
    if (size) {
      document.getElementById('cache-size').textContent = 
        `Penggunaan: ${size.usage} / ${size.quota} (${size.percentage})`;
    }
  });
  
  // Setup handlers
  document.getElementById('close-settings').addEventListener('click', () => {
    modal.remove();
  });
  
  document.getElementById('btn-clear-cache').addEventListener('click', async () => {
    if (confirm('Yakin ingin menghapus semua cache? Aplikasi akan reload.')) {
      await window.pwaInstall.clearCache();
      window.location.reload();
    }
  });
}

function handleDeepLinks() {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  
  if (action === 'practice') {
    // Navigate to practice mode
    document.getElementById('main-menu-latihan-soal')?.click();
  } else if (action === 'tryout') {
    // Navigate to tryout mode
    document.getElementById('main-menu-tryout')?.click();
  } else if (action === 'flashcard') {
    // Navigate to flashcard mode
    document.getElementById('main-menu-flashcard')?.click();
  }
}

// ========================================
// DAILY REMINDERS
// ========================================

function scheduleDailyReminders() {
  try {
    const prefs = window.notificationManager.loadPreferences();
    
    if (prefs.studyReminders) {
      // Schedule reminder for 7 PM daily
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(19, 0, 0, 0);
      
      if (reminderTime < now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }
      
      window.notificationManager.scheduleStudyReminder(reminderTime);
    }
  } catch (error) {
    console.warn('Error scheduling daily reminders:', error);
  }
}

// ========================================
// STREAK STATUS CHECK
// ========================================

function checkStreakStatus() {
  try {
    // Check every hour
    setInterval(() => {
      try {
        window.notificationManager.scheduleStreakAlert();
      } catch (error) {
        console.warn('Error in streak check interval:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
    
    // Initial check
    window.notificationManager.scheduleStreakAlert();
  } catch (error) {
    console.warn('Error setting up streak status check:', error);
  }
}

// ========================================
// QUIZ COMPLETION SYNC
// ========================================

window.addEventListener('quizCompleted', async (event) => {
  const result = event.detail;
  
  // Try to sync immediately if online
  if (navigator.onLine) {
    try {
      // Send to server (if API exists)
      await syncQuizResult(result);
    } catch (error) {
      // Queue for background sync if available and failed
      if (window.backgroundSync) {
        try {
          await window.backgroundSync.queueForSync(result, 'sync-quiz-results');
        } catch (syncError) {
          console.warn('Background sync not available:', syncError);
        }
      }
    }
  } else {
    // Queue for background sync if available
    if (window.backgroundSync) {
      try {
        await window.backgroundSync.queueForSync(result, 'sync-quiz-results');
      } catch (error) {
        console.warn('Background sync not available:', error);
      }
    }
  }
});

async function syncQuizResult(result) {
  // This would send to your backend API
  console.log('Syncing quiz result:', result);
  // await fetch('/api/quiz-results', { method: 'POST', body: JSON.stringify(result) });
}

// ========================================
// PERIODIC TASKS
// ========================================

// Cache popular questions
async function cachePopularQuestions() {
  // Check if cacheManager is available
  if (!window.cacheManager) {
    console.warn('CacheManager not available, skipping precache');
    return;
  }
  
  try {
    const popularQuestions = [
      { url: '/jiwa.json' },
      { url: '/anak.json' },
      { url: '/bedah.json' }
    ];
    
    await window.cacheManager.precacheQuestions(popularQuestions);
    console.log('✅ Popular questions cached');
  } catch (error) {
    console.warn('Failed to cache popular questions:', error);
  }
}

// Run once on load
if (navigator.onLine) {
  cachePopularQuestions();
}

// Export for use in other scripts
window.phase4Integration = {
  setupNotificationHandlers,
  setupOfflineHandlers,
  setupPWAHandlers,
  scheduleDailyReminders,
  checkStreakStatus
};

console.log('✅ Phase 4 Integration Loaded!');
