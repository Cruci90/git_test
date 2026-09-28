/* Nido · Service worker
   Guarda la app en caché para que abra sin conexión. Los archivos propios se
   sirven desde caché y se actualizan en segundo plano; las fuentes de Google
   se guardan la primera vez que se descargan. Sube VERSION al publicar. */
const VERSION = 'nido-v2';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './icon.svg',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
  './css/nido.css',
  './js/data.js', './js/core.js', './js/charts.js', './js/media.js', './js/ui.js', './js/sounds.js', './js/actions.js',
  './js/views-daily.js', './js/views-care.js', './js/views-more.js', './js/demo.js', './js/app.js'
];
const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'nido-fonts').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => { if (e.data === 'skip-waiting') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (FONTS.test(req.url)) {
    e.respondWith(caches.open('nido-fonts').then(async (c) => (await c.match(req)) || fetch(req).then((r) => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; })));
    return;
  }
  if (url.origin !== location.origin) return;
  // Navegación: la app es una sola página.
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(caches.open(VERSION).then(async (c) => {
    const cached = await c.match(key, { ignoreSearch: true });
    const fresh = fetch(req).then((r) => { if (r.ok && req.mode !== 'navigate') c.put(req, r.clone()); return r; }).catch(() => null);
    return cached || (await fresh) || new Response('Sin conexión', { status: 503 });
  }));
});
