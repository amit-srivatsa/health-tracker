// Offline support: keeps the app's own files on the phone so it opens without a connection.
// Only same-origin files are cached. Requests to Google are never cached here.
const CACHE = 'health-tracker-v2';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'src/styles.css', 'src/app.js', 'src/store.js', 'src/drive.js', 'src/config.js',
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

// Serve from cache straight away, refresh the cache in the background.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const key = req.mode === 'navigate' ? 'index.html' : req;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key, { ignoreSearch: req.mode === 'navigate' });
    const net = fetch(req).then(r => {
      if (r.ok && r.type === 'basic' && !r.redirected) c.put(key, r.clone());
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
