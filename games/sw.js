const CACHE_NAME = 'offline-cache-v3';

// 1. Define allowed third-party domains
const ALLOWED_DOMAINS = [
  'jsdelivr.net',
  'unpkg.com',
  'esm.sh',
  'githack.com',
  'github.com',
  'githubusercontent.com'
];

// 2. Helper function to check if a URL is allowed
function isRequestAllowed(requestUrl) {
  const url = new URL(requestUrl);
  
  // Always allow requests to your own origin (local files, HTML, assets)
  if (url.origin === self.location.origin) {
    return true;
  }

  // Normalize hostname to lowercase to ensure case-insensitive matching
  const hostname = url.hostname.toLowerCase();

  // Check if the external domain matches or ends with any allowed domains
  return ALLOWED_DOMAINS.some(domain => 
    hostname === domain || hostname.endsWith('.' + domain)
  );
}

// Precache essential local assets
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => { if (key !== CACHE_NAME) return caches.delete(key); })
    ))
  );
  self.clients.claim();
});

// Fetch Event: Blocks unauthorized domains, caches authorized ones
self.addEventListener('fetch', (event) => {
  // Check the allowlist first
  if (!isRequestAllowed(event.request.url)) {
    console.warn(`[Service Worker] Blocked request to: ${event.request.url}`);
    
    // Return a synthetic 403 Forbidden response to block the request safely
    event.respondWith(
      new Response('Blocked by policy', {
        status: 403,
        statusText: 'Forbidden',
        headers: { 'Content-Type': 'text/plain' }
      })
    );
    return;
  }

  // Only handle cache strategies for GET requests
  if (event.request.method !== 'GET') return;

  // Process allowed requests (Cache-First strategy)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Dynamic caching for successful third-party assets or local assets
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.error('[Service Worker] Fetch failed:', err);
        return new Response('Network error occurred', { status: 408 });
      });
    })
  );
});
