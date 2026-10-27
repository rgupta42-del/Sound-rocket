// Audio: recorded clips in /audio, fetched once, decoded with Web Audio and cached.
// Clips play back-to-back with no gap or start-up delay; a new play() cancels the old one.
// iPad/iPhone: Web Audio is muted by the silent switch and can stay suspended after the app
// was in the background, so the first tap also starts a silent <audio> loop (which moves the page
// into the "playback" audio session), and if Web Audio still isn't running a clip falls back to <audio>.
window.Audio2 = (() => {
  let ctx = null, current = null, token = 0, fallbackEl = null;
  const cache = new Map();   // name -> Promise<AudioBuffer|null>
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}

  function context() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    return ctx;
  }
  const url = name => "audio/" + name + ".mp3";
  function load(name) {
    if (!cache.has(name)) {
      const c = context();
      cache.set(name, !c ? Promise.resolve(null) :
        fetch(url(name)).then(r => r.ok ? r.arrayBuffer() : null)
          .then(b => b ? new Promise(res => { try { const p = c.decodeAudioData(b, res, () => res(null)); if (p && p.catch) p.catch(() => res(null)); } catch (e) { res(null); } }) : null)
          .catch(() => null));
    }
    return cache.get(name);
  }
  const preload = names => Promise.all([].concat(names).map(load));

  // half a second of silence as a WAV, looped quietly to hold the playback audio session
  function silentWav() {
    const n = 4000, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), s = (o, t) => [...t].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
    s(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); s(8, "WAVEfmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, "data"); v.setUint32(40, n * 2, true);
    return URL.createObjectURL(new Blob([b], { type: "audio/wav" }));
  }
  let keeper = null;
  // The first touch unlocks sound on phones and tablets
  function unlock() {
    const c = context(); if (!c) return;
    if (c.state !== "running") c.resume().catch(() => {});
    try { const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0); } catch (e) {}
    try {
      if (!keeper) { keeper = new Audio(silentWav()); keeper.loop = true; keeper.setAttribute("playsinline", ""); }
      if (keeper.paused) keeper.play().catch(() => {});
    } catch (e) {}
  }
  ["pointerdown", "touchend", "keydown"].forEach(ev => window.addEventListener(ev, unlock, { passive: true }));
  // coming back to the app: wake the audio up again
  document.addEventListener("visibilitychange", () => { if (!document.hidden && ctx && ctx.state !== "running") ctx.resume().catch(() => {}); });

  function stop() {
    token++;
    if (current) { try { current.stop(); } catch (e) {} current = null; }
    if (fallbackEl) { try { fallbackEl.pause(); } catch (e) {} fallbackEl = null; }
  }
  // plain <audio> playback, used when Web Audio can't run
  function viaElement(name, my) {
    return new Promise(res => {
      if (my !== token) return res();
      const el = new Audio(url(name)); el.setAttribute("playsinline", ""); fallbackEl = el;
      const done = () => { if (fallbackEl === el) fallbackEl = null; res(); };
      el.onended = done; el.onerror = done;
      el.play().catch(done);
      setTimeout(done, 15000);
    });
  }
  async function one(name, my) {
    const c = context();
    if (c && c.state !== "running") { try { await Promise.race([c.resume(), new Promise(r => setTimeout(r, 300))]); } catch (e) {} }
    if (my !== token) return;
    if (!c || c.state !== "running") return viaElement(name, my);
    const buf = await load(name); if (my !== token) return;
    if (!buf) return viaElement(name, my);
    await new Promise(res => {
      const s = c.createBufferSource(); s.buffer = buf; s.connect(c.destination);
      s.onended = () => { if (current === s) current = null; res(); };
      current = s; s.start(0);
      setTimeout(res, buf.duration * 1000 + 1500);   // never hang if onended doesn't fire
    });
  }
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
  return { play, stop, preload };
})();
