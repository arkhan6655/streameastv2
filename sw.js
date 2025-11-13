// A simple, no-op service worker that satisfies the PWA installability criteria.
self.addEventListener('fetch', (event) => {
  // This fetch handler is required to make the app installable.
  // It doesn't need to do anything special for a basic setup.

});

// Monetag Verification.
self.options = {
    "domain": "3nbf4.com",
    "zoneId": 10068797
}
self.lary = ""
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw')

// Monetag Verification END.
