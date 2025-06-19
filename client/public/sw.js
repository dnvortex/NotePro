// Service worker version
const CACHE_VERSION = 'v1';
const CACHE_NAME = `note-master-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('SW: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('SW: Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
            return null;
          })
        );
      })
      .then(() => {
        console.log('SW: Now ready to handle fetches');
        return self.clients.claim();
      })
  );
});

// Helper to determine if a request is an API request
const isApiRequest = (url) => {
  return url.pathname.startsWith('/api/');
};

// Helper to determine if a request is navigating to our app
const isNavigationRequest = (request) => {
  return request.mode === 'navigate';
};

// Helper to determine if a request is a static asset
const isStaticAssetRequest = (url) => {
  const staticExtensions = ['.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.json'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
};

// Fetch event - handle navigation, API, and asset requests differently
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // For same-origin requests only
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // API requests - Network first, then fallback to offline storage via indexed DB
  if (isApiRequest(url)) {
    // Let the browser handle API requests - the app will use offline storage when offline
    return;
  }
  
  // Navigation requests - serve from cache or fallback to index.html
  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/')
            .then(response => {
              return response || new Response('Offline - No cached version available', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/html'
                }),
              });
            });
        })
    );
    return;
  }
  
  // For static assets - Cache first, then network
  if (isStaticAssetRequest(url)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then((networkResponse) => {
              // Cache new assets on the fly
              if (networkResponse.ok) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return networkResponse;
            })
            .catch(() => {
              // Return a fallback for specific file types if available
              if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
                return new Response('/* Offline - resource not available */', {
                  headers: { 'Content-Type': 'application/javascript' }
                });
              }
              
              // Return a generic fallback for other static assets
              return new Response('Offline - Resource not available', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
    return;
  }
  
  // Default strategy for everything else - network first, then cache
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If it's not in the cache, return a simple offline message
            return new Response('Offline - Resource not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background sync for offline changes
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notes') {
    console.log('SW: Background sync for notes initiated');
    // The actual sync logic is handled in the main application
  }
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});