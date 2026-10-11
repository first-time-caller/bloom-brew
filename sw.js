/* Bloom Brew service worker. Must be committed next to index.html (same directory, same origin).
   The page itself is served cache-first and refreshed in the background; everything else is network-first with the cache as a fallback.
   Bump CACHE whenever index.html changes so installed copies pick up the new page. */
const CACHE = 'bloom-brew-pass6';
const PAGE = new URL('./', self.location).href;
const PAGE_FILES = [PAGE, new URL('./index.html', self.location).href];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([PAGE]).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url.split('?')[0].split('#')[0];
  const isPage = req.mode === 'navigate' || PAGE_FILES.indexOf(url) > -1;
  if (isPage) {
    /* cache-first, then refresh the cached page from the network for next time */
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req, { ignoreSearch:true });
      const net = fetch(req).then(res => { if (res && res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
      if (hit) { net.catch(() => {}); return hit; }
      const res = await net;
      return res || new Response('Offline and no cached copy yet.', { status:503, headers:{ 'Content-Type':'text/plain' } });
    }));
    return;
  }
  /* fonts and anything else: network first, cache as fallback */
  e.respondWith(caches.open(CACHE).then(async c => {
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await c.match(req);
      return hit || Response.error();
    }
  }));
});
