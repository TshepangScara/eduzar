const CACHE_NAME = 'eduzar-v5';

// Core assets to cache for offline use
const CORE_ASSETS = [
  'index.html',
  'courses.html',
  'paths.html',
  'styles.css',
  'courses-data.js',
  'learning-paths-data.js',
  'main.js',
  'manifest.json',
  'images-eduzar/logo eduzar.png'
];

// Install – cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate – remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch – network first so site updates reach visitors immediately; the cache
// is only the offline fallback. Cross-origin requests (YouTube, fonts, icons)
// are left to the browser.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Cache by path so courses.html?category=x and ?q=y share one entry
  const cacheKey = url.origin + url.pathname;

  event.respondWith(
    fetch(request).then(response => {
      if (response && response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(cacheKey, clone));
      }
      return response;
    }).catch(() =>
      caches.match(cacheKey).then(cached => {
        if (cached) return cached;
        if (request.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      })
    )
  );
});
