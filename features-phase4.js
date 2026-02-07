/**
 * 📱 BIMBEL UKOM - PHASE 4: MOBILE & OFFLINE
 * 
 * Features:
 * 1. PWA Installation Manager
 * 2. Notification Manager
 * 3. Offline Detection
 * 4. Cache Management
 * 5. Background Sync
 * 
 * @version 4.0.0
 * @date 2026-02-06
 */

// ========================================
// 1. PWA INSTALLATION MANAGER
// ========================================

class PWAInstallManager {
  constructor() {
    this.deferredPrompt = null;
    this.isStandalone = false;
    this.init();
  }

  init() {
    // Check if already installed
    this.checkStandalone();
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully!');
      this.hideInstallButton();
      this.trackInstall();
    });

    // Register service worker
    this.registerServiceWorker();
  }

  checkStandalone() {
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://');
    
    if (this.isStandalone) {
      console.log('✅ Running as installed PWA');
      document.body.classList.add('pwa-mode');
    }
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });

        return registration;
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  showInstallButton() {
    // Create install prompt
    const installBanner = document.createElement('div');
    installBanner.id = 'pwa-install-banner';
    installBanner.className = 'pwa-install-banner';
    installBanner.innerHTML = `
      <div class="install-banner-content">
        <div class="install-icon">📱</div>
        <div class="install-text">
          <div class="install-title">Install Bimbel UKOM</div>
          <div class="install-subtitle">Akses lebih cepat & bisa offline!</div>
        </div>
        <div class="install-actions">
          <button class="btn-install" id="btn-install-pwa">Install</button>
          <button class="btn-dismiss" id="btn-dismiss-install">✕</button>
        </div>
      </div>
    `;

    document.body.appendChild(installBanner);

    // Add event listeners
    document.getElementById('btn-install-pwa').addEventListener('click', () => {
      this.promptInstall();
    });

    document.getElementById('btn-dismiss-install').addEventListener('click', () => {
      installBanner.remove();
      localStorage.setItem('installPromptDismissed', Date.now());
    });

    // Show banner with animation
    setTimeout(() => installBanner.classList.add('show'), 100);
  }

  hideInstallButton() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 300);
    }
  }

  async promptInstall() {
    if (!this.deferredPrompt) {
      console.log('Install prompt not available');
      return;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log(`User choice: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted install');
    } else {
      console.log('❌ User dismissed install');
    }

    this.deferredPrompt = null;
    this.hideInstallButton();
  }

  showUpdateNotification() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-notification';
    updateBanner.innerHTML = `
      <div class="update-content">
        <div class="update-icon">🔄</div>
        <div class="update-text">Update tersedia! Reload untuk mendapatkan versi terbaru.</div>
        <button class="btn-update" id="btn-reload-app">Update</button>
      </div>
    `;

    document.body.appendChild(updateBanner);

    document.getElementById('btn-reload-app').addEventListener('click', () => {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    });

    setTimeout(() => updateBanner.classList.add('show'), 100);
  }

  trackInstall() {
    const installData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform
    };
    localStorage.setItem('pwaInstallData', JSON.stringify(installData));
  }

  async getCacheSize() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: (estimate.usage / 1024 / 1024).toFixed(2) + ' MB',
        quota: (estimate.quota / 1024 / 1024).toFixed(2) + ' MB',
        percentage: ((estimate.usage / estimate.quota) * 100).toFixed(1) + '%'
      };
    }
    return null;
  }

  async clearCache() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('✅ All caches cleared');
      return true;
    }
    return false;
  }
}

// ========================================
// 2. NOTIFICATION MANAGER
// ========================================

class NotificationManager {
  constructor() {
    // Check if Notification API is available
    if (!('Notification' in window)) {
      console.warn('⚠️ Notification API not supported on this device');
      this.permission = 'denied';
      this.supported = false;
    } else {
      this.permission = Notification.permission;
      this.supported = true;
    }
    
    this.scheduledNotifications = this.loadScheduled();
    this.preferences = this.loadPreferences();
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.error('Browser tidak support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const result = await Notification.requestPermission();
    this.permission = result;
    
    if (result === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    } else {
      console.log('❌ Notification permission denied');
      return false;
    }
  }

  async sendNotification(title, options = {}) {
    // Check if supported
    if (!this.supported) {
      console.log('⚠️ Notifications not supported, skipping');
      return;
    }
    
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      ...options
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Use service worker for better persistence
      const registration = await navigator.serviceWorker.ready;
      return registration.showNotification(title, defaultOptions);
    } else {
      // Fallback to regular notification
      return new Notification(title, defaultOptions);
    }
  }

  scheduleStudyReminder(time) {
    const now = new Date();
    const scheduledTime = new Date(time);
    const delay = scheduledTime  - now;

    if (delay <= 0) {
      console.error('Scheduled time must be in the future');
      return;
    }

    const timeoutId = setTimeout(() => {
      this.sendNotification('⏰ Waktunya Belajar!', {
        body: 'Jangan lupa target harian kamu hari ini!',
        tag: 'study-reminder',
        data: { url: '/?action=practice' },
        actions: [
          { action: 'start', title: 'Mulai Belajar' },
          { action: 'snooze', title: 'Ingatkan 1 Jam Lagi' }
        ]
      });

      this.removeScheduled('study-reminder');
    }, delay);

    this.addScheduled({
      id: 'study-reminder',
      time: scheduledTime.toISOString(),
      timeoutId
    });
  }

  scheduleStreakAlert() {
    const lastActivity = localStorage.getItem('lastActivityDate');
    if (!lastActivity) return;

    const lastDate = new Date(lastActivity);
    const now = new Date();
    const hoursSinceActivity = (now - lastDate) / (1000 * 60 * 60);

    // Alert if no activity for 20 hours
    if (hoursSinceActivity >= 20 && hoursSinceActivity < 24) {
      this.sendNotification('🔥 Streak Kamu Dalam Bahaya!', {
        body: 'Kerjakan minimal 1 soal untuk jaga streak!',
        tag: 'streak-alert',
        urgency: 'high',
        requireInteraction: true,
        data: { url: '/?action=practice' }
      });
    }
  }

  notifyAchievementUnlocked(achievement) {
    this.sendNotification('🏆 Achievement Unlocked!', {
      body: `Kamu dapat: ${achievement.name}`,
      icon: '/icons/icon-192x192.png',
      image: achievement.imageUrl,
      tag: `achievement-${achievement.id}`,
      vibrate: [300, 100, 300, 100, 300],
      data: { 
        url: '/?view=achievements',
        achievementId: achievement.id
      }
    });
  }

  notifyDailyTarget(current, target) {
    if (current >= target) {
      this.sendNotification('🎯 Target Harian Tercapai!', {
        body: `Hebat! Kamu sudah menyelesaikan ${current} soal hari ini!`,
        tag: 'daily-target-complete'
      });
    } else {
      const remaining = target - current;
      this.sendNotification('📊 Update Target Harian', {
        body: `Tinggal ${remaining} soal lagi untuk mencapai target!`,
        tag: 'daily-target-progress'
      });
    }
  }

  loadScheduled() {
    const stored = localStorage.getItem('scheduledNotifications');
    return stored ? JSON.parse(stored) : [];
  }

  saveScheduled() {
    localStorage.setItem('scheduledNotifications', JSON.stringify(this.scheduledNotifications));
  }

  addScheduled(notification) {
    this.scheduledNotifications.push(notification);
    this.saveScheduled();
  }

  removeScheduled(id) {
    this.scheduledNotifications = this.scheduledNotifications.filter(n => n.id !== id);
    this.saveScheduled();
  }

  loadPreferences() {
    const stored = localStorage.getItem('notificationPreferences');
    return stored ? JSON.parse(stored) : {
      enabled: true,
      studyReminders: true,
      streakAlerts: true,
      achievements: true,
      dailyTarget: true,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '07:00'
      }
    };
  }

  savePreferences() {
    localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
  }

  updatePreferences(newPrefs) {
    this.preferences = { ...this.preferences, ...newPrefs };
    this.savePreferences();
  }

  isQuietTime() {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      return currentTime >= startTime || currentTime < endTime;
    }
  }
}

// ========================================
// 3. OFFLINE DETECTOR
// ========================================

class OfflineDetector {
  constructor() {
    this.isOnline = navigator.onLine;
    this.callbacks = [];
    this.init();
  }

  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showOnlineStatus();
      this.triggerCallbacks('online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showOfflineStatus();
      this.triggerCallbacks('offline');
    });
  }

  showOnlineStatus() {
    this.showStatusBanner('🟢 Kembali Online', 'online-status', 3000);
  }

  showOfflineStatus() {
    this.showStatusBanner('🔴 Tidak Ada Koneksi', 'offline-status', 0);
  }

  showStatusBanner(message, className, duration) {
    // Remove existing banner
    const existing = document.getElementById('connection-status-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'connection-status-banner';
    banner.className = `connection-status-banner ${className}`;
    banner.textContent = message;

    document.body.appendChild(banner);
    setTimeout(() => banner.classList.add('show'), 10);

    if (duration > 0) {
      setTimeout(() => {
        banner.classList.remove('show');
        setTimeout(() => banner.remove(), 300);
      }, duration);
    }
  }

  onStatusChange(callback) {
    this.callbacks.push(callback);
  }

  triggerCallbacks(status) {
    this.callbacks.forEach(callback => callback(status));
  }
}

// ========================================
// 4. CACHE MANAGER
// ========================================

class CacheManager {
  async precacheQuestions(questions) {
    if (!('caches' in window)) return false;

    try {
      const cache = await caches.open('dynamic-v4');
      const promises = questions.map(q => {
        const request = new Request(q.url);
        return cache.add(request).catch(err => console.error('Failed to cache:', q.url));
      });

      await Promise.all(promises);
      console.log('✅ Questions precached');
      return true;
    } catch (error) {
      console.error('❌ Precache failed:', error);
      return false;
    }
  }

  async isCached(url) {
    if (!('caches' in window)) return false;

    const cache = await caches.open('dynamic-v4');
    const response = await cache.match(url);
    return !!response;
  }

  async getCachedQuestions() {
    const cache = await caches.open('dynamic-v4');
    const requests = await cache.keys();
    
    const questions = [];
    for (const request of requests) {
      if (request.url.includes('.json') && !request.url.includes('manifest')) {
        const response = await cache.match(request);
        const data = await response.json();
        questions.push(data);
      }
    }

    return questions;
  }
}

// ========================================
// 5. BACKGROUND SYNC MANAGER
// ========================================

class BackgroundSyncManager {
  async registerSync(tag) {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log(`✅ Background sync registered: ${tag}`);
        return true;
      } catch (error) {
        console.error('❌ Background sync registration failed:', error);
        return false;
      }
    } else {
      console.log('Background sync not supported');
      return false;
    }
  }

  async queueForSync(data, tag = 'default-sync') {
    const queue = this.loadQueue(tag);
    queue.push({
      id: Date.now(),
      data,
      timestamp: new Date().toISOString()
    });
    this.saveQueue(tag, queue);
    await this.registerSync(tag);
  }

  loadQueue(tag) {
    const stored = localStorage.getItem(`sync-queue-${tag}`);
    return stored ? JSON.parse(stored) : [];
  }

  saveQueue(tag, queue) {
    localStorage.setItem(`sync-queue-${tag}`, JSON.stringify(queue));
  }

  clearQueue(tag) {
    localStorage.removeItem(`sync-queue-${tag}`);
  }
}

// ========================================
// INITIALIZATION
// ========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPhase4Features);
} else {
  initPhase4Features();
}

function initPhase4Features() {
  window.pwaInstall = new PWAInstallManager();
  window.notificationManager = new NotificationManager();
  window.offlineDetector = new OfflineDetector();
  window.cacheManager = new CacheManager();
  window.backgroundSync = new BackgroundSyncManager();
  
  console.log('✅ Phase 4 Features Initialized!');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PWAInstallManager,
    NotificationManager,
    OfflineDetector,
    CacheManager,
    BackgroundSyncManager
  };
}
