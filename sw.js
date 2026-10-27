// Offline support: audio is cached forever (clip names change when they're rebuilt);
// pages, scripts and styles are served from cache and refreshed in the background.
// Range requests (iPhone/iPad <audio> asks for parts of a file) go straight to the network:
// a cached whole file can't answer them, and partial responses can't be cached.
const VERSION = "sound-rocket-v5";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || e.request.headers.has("range")) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(r => { if (r.status === 200) c.put(e.request, r.clone()).catch(() => {}); return r; }).catch(() => hit || Response.error());
    if (url.pathname.includes("/audio/")) return hit || net;
    if (hit) { try { e.waitUntil(net); } catch (err) {} return hit; }
    return net;
  }));
});
