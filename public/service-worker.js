const APP_PREFIX = 'BudgetTracker-'
const VERSION = 'version_01'
const CACHE_NAME = APP_PREFIX + VERSION

// list of routes to save
const FILES_TO_CACHE = [
  '/index.html',
  // '/manifest.json',
  '/js/index.js',
  '/css/styles.css',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
]

// install service worker
self.addEventListener('install', function (evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Your files were pre-cached successfully!')
      return cache.addAll(FILES_TO_CACHE)
    })
  )

  self.skipWaiting()
})

// activate service worker and remove old data from cache
// mostly useful for when you've updated your service worker or you want to use a new service worker and get rid of the irrelevant cache
self.addEventListener('activate', function (evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          // look at the key names in the cache item and if the keys don't match the CACHE_NAME and the DATA_CACHE_NAME provided then delete them because they are no longer relevant
          if (key !== CACHE_NAME) {
            console.log('Removing old cache data', key)
            return caches.delete(key)
          }
        })
      )
    })
  )

  self.clients.claim()
})

// intercept fetch requests
self.addEventListener('fetch', function (evt) {
  if (evt.request.url.includes('/api/')) {
    evt.respondWith(
      caches
        .open(CACHE_NAME)
        .then(cache => {
          return fetch(evt.request)
            .then(response => {
              // if response was good, clone it and store it in the cache
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone())
              }

              return response
            })
            .catch(err => {
              // network request failed, try to get it from the cache
              return cache.match(evt.request)
            })
        })
        .catch(err => console.log(err))
    )

    return
  }
  evt.respondWith(
    fetch(evt.request).catch(function () {
      return caches.match(evt.request).then(function (response) {
        if (response) {
          return response
        } else if (evt.request.headers.get('accept').includes('text/html')) {
          // return the cached home page for all requests for html pages
          return caches.match('/')
        }
      })
    })
  )
})
