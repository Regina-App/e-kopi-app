const CACHE_NAME = 'ekopi-v1'
const STATIC_ASSETS = ['/', '/offline.html', '/images/logo.png', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      })
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests
  if (request.method !== 'GET') {
    return
  }

  // Do NOT cache anything with 'supabase' or 'auth' in the URL
  if (url.href.includes('supabase') || url.pathname.includes('auth')) {
    return
  }

  // For /api/ routes use network-only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request))
    return
  }

  // For navigation use network-first with offline.html fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME)
        const cachedOffline = await cache.match('/offline.html')
        return cachedOffline || new Response('Offline', { status: 503, statusText: 'Offline' })
      })
    )
    return
  }

  // For static assets use cache-first
  const isStaticAsset =
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/_next/static/')

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return networkResponse
        })
      })
    )
    return
  }

  // Fallback network-first with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})
