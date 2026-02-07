/**
 * 📱 BIMBEL UKOM - SERVICE WORKER
 * Progressive Web App Implementation
 * 
 * Features:
 * - Offline caching
 * - Background sync
 * - Push notifications
 * - Asset precaching
 * 
 * @version 4.0.0
 * @date 2026-02-06
 */

// Cache version - increment when updating files
const CACHE_VERSION = 'v4.0.0';
const CACHE_NAME = `bimbel-ukom-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/phase4-styles.css',
  '/features-phase1.js',
  '/features-phase2.js',
  '/features-phase2-integration.js',
  '/features-phase3.js',
  '/features-phase3-integration.js',
  '/features-phase4.js',
  '/features-phase4-integration.js',
  '/firebase-config.js',
  '/offline.html',
  '/manifest.json'
];

// Question JSON files
const QUESTION_FILES = [
  '/jiwa.json',
  '/anak.json',
  '/bedah.json',
  '/gadar.json',
  '/keluarga.json',
  '/komunitas.json',
  '/manajemen.json',
  '/gabungan.json',
  '/TO1.json',
  '/TO2.json',
  '/TO3.json',
  '/TO4.json',
  '/TO5.json',
  '/TO6.json'
];

// Images and assets
const ASSET_FILES = [
  '/background.png',
  '/user.png'
];

// ========================================
// INSTALL EVENT
// ========================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache question files
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('[SW] Caching question files');
        return cache.addAll(QUESTION_FILES);
      }),
      
      // Cache images
      caches.open(IMAGE_CACHE).then((cache) => {
        console.log('[SW] Caching images');
        return cache.addAll(ASSET_FILES);
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// ========================================
// ACTIVATE EVENT
// ========================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    // Clean up old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim(); // Take control of all pages
    })
  );
});

// ========================================
// FETCH EVENT
// ========================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Different strategies for different types
  if (request.url.includes('.json')) {
    // Network first for JSON (fresh data preferred)
    event.respondWith(networkFirstStrategy(request));
  } else if (request.url.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
    // Cache first for images
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else if (request.url.includes('.js') || request.url.includes('.css')) {
    // Stale while revalidate for JS/CSS
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Network first for HTML and API calls
    event.respondWith(networkFirstStrategy(request));
  }
});

// ========================================
// CACHING STRATEGIES
// ========================================

/**
 * Cache First Strategy
 * Try cache first, fallback to network
 */
async function cacheFirstStrategy(request, cacheName = STATIC_CACHE) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

/**
 * Network First Strategy
 * Try network first, fallback to cache
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Network failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate
 * Return cache immediately, update cache in background
 */
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    // Clone MUST happen before consuming the response!
    if (networkResponse && networkResponse.ok) {
      try {
        // Clone the response before using it
        const responseToCache = networkResponse.clone();
        
        // Update cache in background
        const cache = await caches.open(STATIC_CACHE);
        await cache.put(request, responseToCache);
      } catch (error) {
        console.error('[SW] Cache update failed:', error);
      }
    }
    return networkResponse;
  }).catch((error) => {
    console.error('[SW] Background fetch failed:', error);
    return null;
  });
  
  return cachedResponse || fetchPromise;
}


// ========================================
// BACKGROUND SYNC
// ========================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-quiz-results') {
    event.waitUntil(syncQuizResults());
  }
  
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncQuizResults() {
  console.log('[SW] Syncing quiz results...');
  
  try {
    // Get pending quiz results from IndexedDB
    const db = await openDatabase();
    const pendingResults = await getPendingResults(db);
    
    // Send to server
    for (const result of pendingResults) {
      await fetch('/api/sync-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
      
      // Remove from pending queue
      await removePendingResult(db, result.id);
    }
    
    console.log('[SW] Sync complete');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Will retry
  }
}

async function syncProgress() {
  console.log('[SW] Syncing progress...');
  // Implementation for progress sync
}

// ========================================
// PUSH NOTIFICATIONS
// ========================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Bimbel UKOM',
    body: 'Kamu punya notifikasi baru!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png'
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    vibrate: data.vibrate || [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ========================================
// NOTIFICATION CLICK
// ========================================

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
  
  // Handle notification actions
  if (event.action === 'start') {
    // Start quiz action
    clients.openWindow('/?action=start-quiz');
  } else if (event.action === 'snooze') {
    // Snooze reminder
    scheduleNotification('study-reminder', 60); // 1 hour later
  }
});

// ========================================
// MESSAGE HANDLING
// ========================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    cacheUrls(event.data.urls);
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    clearAllCaches();
  }
  
  if (event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then((size) => {
      event.ports[0].postMessage({ size });
    });
  }
});

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.addAll(urls);
  console.log('[SW] Cached additional URLs');
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

async function getCacheSize() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage;
  }
  return 0;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BimbelUKOMDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingSync')) {
        db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function getPendingResults(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSync'], 'readonly');
    const store = transaction.objectStore('pendingSync');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removePendingResult(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSync'], 'readwrite');
    const store = transaction.objectStore('pendingSync');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function scheduleNotification(tag, delayMinutes) {
  // This would use the Notifications API
  // Implementation depends on backend setup
  console.log(`[SW] Scheduling notification ${tag} for ${delayMinutes} minutes`);
}

// ========================================
// PERIODIC BACKGROUND SYNC
// ========================================

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-leaderboard') {
    event.waitUntil(updateLeaderboard());
  }
});

async function updateLeaderboard() {
  console.log('[SW] Updating leaderboard in background...');
  // Fetch and cache latest leaderboard data
}

console.log('[SW] Service Worker loaded successfully');
