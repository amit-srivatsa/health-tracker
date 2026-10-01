// Offline support: keeps the app's own files on the phone so it opens without a connection.
// Only same-origin files are cached. Requests to Google are never cached here.
const CACHE = 'health-tracker-v8';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'src/styles.css', 'src/app.js', 'src/store.js', 'src/drive.js', 'src/ai.js', 'src/config.js',
  'vendor/anthropic-sdk.min.js',
  'fonts/manrope-latin.woff2', 'fonts/figtree-latin.woff2',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first, so a new version shows up on the next open. Falls back to the cache
// when offline or when the network is slow, so the app always opens.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const key = req.mode === 'navigate' ? 'index.html' : req;
  e.respondWith(caches.open(CACHE).then(async c => {
    const net = fetch(req, { cache: 'no-cache' }).then(r => {
      if (r.ok && r.type === 'basic' && !r.redirected) c.put(key, r.clone());
      return r;
    });
    const slow = new Promise(res => setTimeout(res, 4000));
    try {
      const r = await Promise.race([net, slow]);
      if (r) return r;
    } catch (err) { /* offline */ }
    const hit = await c.match(key, { ignoreSearch: req.mode === 'navigate' });
    return hit || net;
  }));
});
