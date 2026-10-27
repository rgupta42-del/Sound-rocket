// Offline support. Two caches:
//  - the app (pages, scripts, styles), versioned: served from cache and refreshed in the background,
//    and thrown away when VERSION changes;
//  - the audio clips, kept across updates so a new version doesn't download every sound again.
//    Change AUDIO only if existing clips are re-recorded under the same names.
// Range requests (iPhone/iPad <audio> asks for parts of a file) go straight to the network:
// a cached whole file can't answer them, and partial responses can't be cached.
const VERSION = "sound-rocket-v12", AUDIO = "sound-rocket-audio-1";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  const keep = await caches.open(AUDIO);
  for (const k of await caches.keys()) {
    if (k === VERSION || k === AUDIO) continue;
    // clips saved by older versions move into the audio cache instead of being downloaded again
    const old = await caches.open(k);
    for (const req of await old.keys()) if (req.url.includes("/audio/")) { const r = await old.match(req); if (r) await keep.put(req, r); }
    await caches.delete(k);
  }
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || e.request.headers.has("range")) return;
  const audio = url.pathname.includes("/audio/");
  e.respondWith(caches.open(audio ? AUDIO : VERSION).then(async c => {
    const hit = await c.match(e.request);
    if (audio && hit) return hit;
    const net = fetch(e.request).then(r => { if (r.status === 200) c.put(e.request, r.clone()).catch(() => {}); return r; }).catch(() => hit || Response.error());
    if (hit) { try { e.waitUntil(net); } catch (err) {} return hit; }
    return net;
  }));
});
