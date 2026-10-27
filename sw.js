// Offline support: audio is cached forever (clip names change when they're rebuilt);
// pages, scripts and styles are served from cache and refreshed in the background.
const VERSION = "sound-rocket-v4";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    if (url.pathname.includes("/audio/")) return hit || net;
    if (hit) { try { e.waitUntil(net); } catch (err) {} return hit; }
    return net;
  }));
});
