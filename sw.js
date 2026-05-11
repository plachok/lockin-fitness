// LOCK IN PWA — Service Worker
const CACHE = 'lockin-v3';
const ASSETS = [
  './fitness_v3.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Sarabun:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap'
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for local, network-first for API
self.addEventListener('fetch', e => {
  const url = e.request.url;
  
  // Always network for Gemini API calls
  if(url.includes('googleapis.com') || url.includes('generativelanguage')) {
    return; // Let it go to network
  }
  
  // Cache-first for local assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline fallback
        if(e.request.destination === 'document') {
          return caches.match('./fitness_v3.html');
        }
      });
    })
  );
});
