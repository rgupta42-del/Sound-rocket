// Audio: recorded clips in /audio, fetched once and cached; a new play() cancels the old one.
// Two ways to play a clip:
//  - Web Audio (decoded buffers): gapless, used on computers and Android.
//  - One shared <audio> element: used first on iPhone and iPad, where Web Audio is muted by the silent
//    switch and often won't start. iOS only lets an element play if it was first played during a tap,
//    so the first tap plays a moment of silence on it; after that the same element can play any clip.
//    Clips are handed to it as blobs (type audio/mpeg), so it doesn't depend on how the server labels files.
// If one way fails, the other is tried.
window.Audio2 = (() => {
  const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let ctx = null, current = null, token = 0;
  const raw = new Map();       // name -> Promise<ArrayBuffer|null>
  const decoded = new Map();   // name -> Promise<AudioBuffer|null>, needs the context
  const blobs = new Map();     // name -> Promise<blob URL|null>
  const status = { path: "", error: "", ios: IOS };
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}

  // VOICE changes when the clips are re-recorded, so no cache anywhere can hand back an old recording
  const VOICE = "kokoro3", url = name => "audio/" + name + ".mp3?voice=" + VOICE;
  // Keep only the most recently used clips in memory (a decoded clip is ~150 KB), so long sessions stay light.
  const LIMIT = 150;
  function remember(map, name, make, drop) {
    if (map.has(name)) { const v = map.get(name); map.delete(name); map.set(name, v); return v; }
    const v = make(); map.set(name, v);
    if (map.size > LIMIT) { const [old, ov] = map.entries().next().value; map.delete(old); if (drop) ov.then(drop, () => {}); }
    return v;
  }
  const fetchRaw = name => remember(raw, name, () => fetch(url(name)).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null));
  const blobUrl = name => remember(blobs, name, () => fetchRaw(name).then(b => b ? URL.createObjectURL(new Blob([b], { type: "audio/mpeg" })) : null),
    u => { if (u && el.src !== u) URL.revokeObjectURL(u); });

  // ---------- Web Audio ----------
  function context() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); ctx.onstatechange = () => { if (ctx.state !== "running" && ctx.state !== "closed" && !document.hidden) ctx.resume().catch(() => {}); }; }
      catch (e) { status.error = "no Web Audio"; }
    }
    return ctx;
  }
  function load(name) {
    const c = ctx; if (!c) return Promise.resolve(null);
    return remember(decoded, name, () => fetchRaw(name).then(b => !b ? null : new Promise(res => {
      // decodeAudioData takes the buffer over, so give it a copy
      try { const p = c.decodeAudioData(b.slice(0), res, () => { status.error = "decode failed"; res(null); }); if (p && p.catch) p.catch(() => res(null)); } catch (e) { res(null); }
    })));
  }
  async function viaWebAudio(name, my) {
    const c = context(); if (!c) return false;
    if (c.state !== "running") { try { await Promise.race([c.resume(), new Promise(r => setTimeout(r, 400))]); } catch (e) {} }
    if (my !== token) return true;
    if (c.state !== "running") { status.error = "web audio " + c.state; return false; }
    const buf = await load(name); if (my !== token) return true;
    if (!buf) return false;
    status.path = "web audio";
    await new Promise(res => {
      const s = c.createBufferSource(); s.buffer = buf; s.connect(c.destination);
      const t = setTimeout(res, buf.duration * 1000 + 1500);   // never hang if onended doesn't fire
      s.onended = () => { clearTimeout(t); if (current === s) current = null; res(); };
      current = s; s.start(0);
    });
    return true;
  }

  // ---------- the shared <audio> element ----------
  const el = new Audio(); el.setAttribute("playsinline", ""); el.preload = "auto";
  let elReady = false;
  function silentWav() {
    const n = 800, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), s = (o, t) => [...t].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
    s(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); s(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, "data"); v.setUint32(40, n * 2, true);
    return URL.createObjectURL(new Blob([b], { type: "audio/wav" }));
  }
  const SILENT = silentWav();
  let elDone = null;
  el.onended = () => elDone && elDone();
  el.onerror = () => { status.error = "audio element error"; elDone && elDone(); };
  async function viaElement(name, my) {
    const src = await blobUrl(name); if (my !== token) return true;
    if (!src) { status.error = "clip not found"; return false; }
    return new Promise(res => {
      let t = 0; const done = ok => { clearTimeout(t); elDone = null; res(ok); };
      elDone = () => done(true);
      el.src = src;
      const p = el.play();
      if (p && p.then) p.then(() => { status.path = "audio element"; elReady = true; }).catch(e => { if (e.name === "AbortError") return done(true); status.error = "audio element: " + e.name; done(false); });  // AbortError: cut off by the next clip
      // never wait longer than the clip itself: if iOS doesn't send "ended", move on anyway
      t = setTimeout(() => done(true), 6000);
      el.onloadedmetadata = () => { if (isFinite(el.duration) && el.duration > 0) { clearTimeout(t); t = setTimeout(() => done(true), el.duration * 1000 + 700); } };
    });
  }

  // Every tap: wake both ways up (iOS only allows this during a tap)
  function unlock() {
    const c = context();
    if (c) {
      if (c.state !== "running") c.resume().catch(() => {});
      try { const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0); } catch (e) {}
    }
    if (!elReady && !elDone) {
      el.src = SILENT;
      const p = el.play(); if (p && p.then) p.then(() => { elReady = true; }).catch(() => {});
    }
  }
  ["touchend", "pointerup", "click", "keydown"].forEach(ev => window.addEventListener(ev, unlock, { passive: true, capture: true }));
  document.addEventListener("visibilitychange", () => { if (!document.hidden && ctx && ctx.state !== "running") ctx.resume().catch(() => {}); });

  function stop() {
    token++;
    if (current) { try { current.stop(); } catch (e) {} current = null; }
    if (elDone) { try { el.pause(); } catch (e) {} elDone(); }
  }
  async function one(name, my) {
    const order = IOS ? [viaElement, viaWebAudio] : [viaWebAudio, viaElement];
    for (const way of order) { if (my !== token) return; if (await way(name, my)) return; }
  }
  const preload = names => Promise.all([].concat(names).map(n => IOS ? blobUrl(n) : ctx ? load(n) : fetchRaw(n)));
  // play("s_m") or play(["s_c","s_a","s_t"], 300, i => highlight(i)). Resolves true if it finished.
  async function play(names, gap = 220, onStep) {
    stop(); const my = token; names = [].concat(names).filter(Boolean);
    preload(names);
    for (let i = 0; i < names.length; i++) {
      if (my !== token) return false;
      if (onStep) onStep(i);
      await one(names[i], my);
      if (i < names.length - 1 && gap) await new Promise(r => setTimeout(r, gap));
    }
    return my === token;
  }
  // For the grown-up sound check
  const info = () => ({ state: ctx ? ctx.state : "not started", rate: ctx ? ctx.sampleRate : 0, session: navigator.audioSession ? navigator.audioSession.type : "n/a", ...status });
  const playWebAudio = name => { stop(); return viaWebAudio(name, token); };
  const playElement = name => { stop(); return viaElement(name, token); };
  return { play, stop, preload, info, playElement, playWebAudio };
})();
