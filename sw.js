// Offline support. Two caches:
//  - the app (pages, scripts, styles), versioned: served from cache and refreshed in the background,
//    and thrown away when VERSION changes;
//  - the audio clips, kept across updates so a new version doesn't download every sound again.
//    Change AUDIO (and VOICE in js/audio.js) when clips are re-recorded: the old cache is then thrown away whole,
//    so old and new recordings never mix.
// Range requests (iPhone/iPad <audio> asks for parts of a file) go straight to the network:
// a cached whole file can't answer them, and partial responses can't be cached.
const VERSION = "sound-rocket-v18", AUDIO = "sound-rocket-audio-4";
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== VERSION && k !== AUDIO) await caches.delete(k);
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
