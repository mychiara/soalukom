/**
 * 🛡️ GLOBAL ERROR HANDLER
 * Catches and handles all JavaScript errors gracefully
 * 
 * Features:
 * - Global error catching
 * - Unhandled promise rejection handling
 * - User-friendly error notifications
 * - Error logging
 * - Recovery mechanisms
 * 
 * @version 1.0.0
 * @date 2026-02-06
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    showNotifications: true,
    logErrors: true,
    maxErrorsShown: 5,
    enableRecovery: true
  };

  let errorCount = 0;
  const errorHistory = [];

  // ========================================
  // GLOBAL ERROR HANDLER
  // ========================================

  window.addEventListener('error', (event) => {
    const error = {
      message: event.error?.message || event.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString(),
      type: 'error'
    };

    handleError(error);
    
    // Prevent default browser error handling
    event.preventDefault();
  });

  // ========================================
  // UNHANDLED PROMISE REJECTION HANDLER
  // ========================================

  window.addEventListener('unhandledrejection', (event) => {
    const error = {
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      type: 'promise-rejection'
    };

    handleError(error);
    
    // Prevent default handling
    event.preventDefault();
  });

  // ========================================
  // ERROR HANDLER
  // ========================================

  function handleError(error) {
    errorCount++;
    errorHistory.push(error);

    // Log error
    if (CONFIG.logErrors) {
      console.error('🚨 [Error Handler]:', error);
      
      // Store in localStorage for debugging
      try {
        const storedErrors = JSON.parse(localStorage.getItem('errorLog') || '[]');
        storedErrors.push(error);
        // Keep only last 50 errors
        if (storedErrors.length > 50) {
          storedErrors.shift();
        }
        localStorage.setItem('errorLog', JSON.stringify(storedErrors));
      } catch (e) {
        console.error('Failed to store error:', e);
      }
    }

    // Show notification to user
    if (CONFIG.showNotifications && errorCount <= CONFIG.maxErrorsShown) {
      showErrorNotification(error);
    }

    // Attempt recovery
    if (CONFIG.enableRecovery) {
      attemptRecovery(error);
    }

    // Critical error threshold
    if (errorCount >= 10) {
      showCriticalErrorDialog();
    }
  }

  // ========================================
  // ERROR NOTIFICATION
  // ========================================

  function showErrorNotification(error) {
    // Remove existing error notification
    const existing = document.getElementById('global-error-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'global-error-notification';
    notification.className = 'global-error-notification';
    
    // Determine error severity
    const severity = getSeverity(error);
    const icon = getErrorIcon(severity);
    const message = getUserFriendlyMessage(error);

    notification.innerHTML = `
      <div class="error-notification-content">
        <div class="error-header">
          <span class="error-icon">${icon}</span>
          <span class="error-title">Terjadi Kesalahan</span>
          <button class="error-close" onclick="this.closest('.global-error-notification').remove()">✕</button>
        </div>
        <div class="error-body">
          <p class="error-message">${message}</p>
          ${error.type === 'promise-rejection' ? '<p class="error-hint">Operasi async gagal.</p>' : ''}
        </div>
        <div class="error-actions">
          <button class="btn-error-reload" onclick="window.location.reload()">
            🔄 Reload Halaman
          </button>
          <button class="btn-error-dismiss" onclick="this.closest('.global-error-notification').remove()">
            Tutup
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      }
    }, 10000);
  }

  // ========================================
  // CRITICAL ERROR DIALOG
  // ========================================

  function showCriticalErrorDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'critical-error-dialog';
    dialog.innerHTML = `
      <div class="critical-error-content">
        <div class="critical-icon">⚠️</div>
        <h2>Aplikasi Mengalami Masalah Serius</h2>
        <p>Terlalu banyak error terdeteksi. Aplikasi mungkin tidak stabil.</p>
        <p><strong>Saran:</strong></p>
        <ul>
          <li>Reload halaman untuk reset aplikasi</li>
          <li>Clear cache browser</li>
          <li>Gunakan browser yang berbeda</li>
          <li>Hubungi support jika masalah berlanjut</li>
        </ul>
        <div class="critical-actions">
          <button class="btn-critical-reload" onclick="window.location.reload()">
            🔄 Reload Sekarang
          </button>
          <button class="btn-critical-clear" onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload()">
            🗑️ Clear Data & Reload
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
  }

  // ========================================
  // RECOVERY MECHANISMS
  // ========================================

  function attemptRecovery(error) {
    const errorMsg = error.message?.toLowerCase() || '';

    // localStorage quota exceeded
    if (errorMsg.includes('quota') || errorMsg.includes('storage')) {
      console.warn('🔧 [Recovery] Attempting to free up storage...');
      try {
        // Remove old quiz history (keep only last 50)
        const history = JSON.parse(localStorage.getItem('quizHistory') || '[]');
        if (history.length > 50) {
          const reduced = history.slice(-50);
          localStorage.setItem('quizHistory', JSON.stringify(reduced));
          console.log('✅ Reduced quiz history size');
        }

        // Clear error log
        localStorage.removeItem('errorLog');
        console.log('✅ Cleared error log');
      } catch (e) {
        console.error('❌ Recovery failed:', e);
      }
    }

    // Network errors
    if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
      console.warn('🔧 [Recovery] Network error detected, app should work offline');
    }

    // Module loading errors
    if (errorMsg.includes('module') || errorMsg.includes('import')) {
      console.warn('🔧 [Recovery] Module loading error, consider reload');
    }
  }

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  function getSeverity(error) {
    const msg = error.message?.toLowerCase() || '';
    
    if (msg.includes('critical') || msg.includes('fatal')) {
      return 'critical';
    } else if (msg.includes('network') || msg.includes('fetch')) {
      return 'warning';
    } else {
      return 'error';
    }
  }

  function getErrorIcon(severity) {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '⚠️';
      default: return '❌';
    }
  }

  function getUserFriendlyMessage(error) {
    const msg = error.message || 'Unknown error';
    
    // Common error patterns
    const patterns = [
      { pattern: /quota.*exceeded/i, message: 'Penyimpanan browser penuh. Hapus beberapa data lama.' },
      { pattern: /network/i, message: 'Koneksi internet bermasalah. Coba lagi nanti.' },
      { pattern: /fetch/i, message: 'Gagal memuat data. Periksa koneksi internet.' },
      { pattern: /undefined.*function/i, message: 'Fitur tidak tersedia. Reload halaman.' },
      { pattern: /null.*property/i, message: 'Data tidak ditemukan. Refresh halaman.' },
      { pattern: /module/i, message: 'Gagal memuat komponen. Reload halaman.' }
    ];

    for (const { pattern, message } of patterns) {
      if (pattern.test(msg)) {
        return message;
      }
    }

    // Default message
    if (msg.length > 100) {
      return 'Terjadi kesalahan teknis. Mohon reload halaman.';
    }

    return msg;
  }

  // ========================================
  // ERROR REPORTING API
  // ========================================

  window.ErrorHandler = {
    getErrorCount: () => errorCount,
    getErrorHistory: () => [...errorHistory],
    clearErrors: () => {
      errorCount = 0;
      errorHistory.length = 0;
      localStorage.removeItem('errorLog');
    },
    reportError: (message, details = {}) => {
      handleError({
        message,
        ...details,
        timestamp: new Date().toISOString(),
        type: 'manual'
      });
    }
  };

  // ========================================
  // CONSOLE OVERRIDE (Optional)
  // ========================================

  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  // Override console.error to also log to error handler
  console.error = function(...args) {
    originalConsoleError.apply(console, args);
    
    // Log to error handler if it's a significant error
    if (args[0] && typeof args[0] === 'string' && args[0].includes('❌')) {
      handleError({
        message: args.join(' '),
        type: 'console-error',
        timestamp: new Date().toISOString()
      });
    }
  };

  // ========================================
  // INITIALIZATION
  // ========================================

  console.log('✅ Global Error Handler initialized');
  
  // Check for previous errors
  try {
    const storedErrors = JSON.parse(localStorage.getItem('errorLog') || '[]');
    if (storedErrors.length > 0) {
      console.warn(`⚠️ ${storedErrors.length} previous errors found in log`);
    }
  } catch (e) {
    // Ignore
  }

})();
