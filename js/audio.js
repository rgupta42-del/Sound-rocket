// Audio: recorded clips in /audio, fetched once, decoded with Web Audio and cached.
// Clips play back-to-back with no gap or start-up delay; a new play() cancels the old one.
// iPhone/iPad: the audio context is only created and resumed inside a tap, the audio session is set to
// "playback" (so the silent switch doesn't mute it), and if Web Audio can't run a clip plays through <audio>.
window.Audio2 = (() => {
  let ctx = null, current = null, token = 0, fallbackEl = null;
  const raw = new Map();       // name -> Promise<ArrayBuffer|null>, fetched any time
  const decoded = new Map();   // name -> Promise<AudioBuffer|null>, needs the context
  const status = { path: "", error: "" };
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}

  function context() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); ctx.onstatechange = () => { if (ctx.state !== "running" && ctx.state !== "closed" && !document.hidden) ctx.resume().catch(() => {}); }; }
      catch (e) { status.error = "no Web Audio: " + e.message; }
    }
    return ctx;
  }
  const url = name => "audio/" + name + ".mp3";
  const fetchRaw = name => {
    if (!raw.has(name)) raw.set(name, fetch(url(name)).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null));
    return raw.get(name);
  };
  function load(name) {
    const c = ctx; if (!c) return Promise.resolve(null);
    if (!decoded.has(name)) decoded.set(name, fetchRaw(name).then(b => !b ? null : new Promise(res => {
      // decodeAudioData takes the buffer over, so give it a copy
      try { const p = c.decodeAudioData(b.slice(0), res, e => { status.error = "decode failed"; res(null); }); if (p && p.catch) p.catch(() => res(null)); } catch (e) { res(null); }
    })));
    return decoded.get(name);
  }
  const preload = names => Promise.all([].concat(names).map(n => ctx ? load(n) : fetchRaw(n)));

  // Every tap: make sure the context exists and is running (iOS only allows this during a tap)
  function unlock() {
    const c = context(); if (!c) return;
    if (c.state !== "running") c.resume().catch(() => {});
    try { const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0); } catch (e) {}
  }
  ["touchend", "pointerup", "click", "keydown"].forEach(ev => window.addEventListener(ev, unlock, { passive: true, capture: true }));
  document.addEventListener("visibilitychange", () => { if (!document.hidden && ctx && ctx.state !== "running") ctx.resume().catch(() => {}); });

  function stop() {
    token++;
    if (current) { try { current.stop(); } catch (e) {} current = null; }
    if (fallbackEl) { try { fallbackEl.pause(); } catch (e) {} fallbackEl = null; }
  }
  // plain <audio> playback, used when Web Audio can't run
  function viaElement(name, my) {
    status.path = "audio element";
    return new Promise(res => {
      if (my !== token) return res();
      const el = new Audio(url(name)); el.setAttribute("playsinline", ""); el.preload = "auto"; fallbackEl = el;
      let t = 0; const done = () => { clearTimeout(t); if (fallbackEl === el) fallbackEl = null; res(); };
      el.onended = done; el.onerror = () => { status.error = "audio element error"; done(); };
      el.play().catch(e => { status.error = "audio element: " + e.name; done(); });
      t = setTimeout(done, 15000);
    });
  }
  async function one(name, my) {
    const c = context();
    if (c && c.state !== "running") { try { await Promise.race([c.resume(), new Promise(r => setTimeout(r, 400))]); } catch (e) {} }
    if (my !== token) return;
    if (!c || c.state !== "running") return viaElement(name, my);
    const buf = await load(name); if (my !== token) return;
    if (!buf) return viaElement(name, my);
    status.path = "web audio";
    await new Promise(res => {
      const s = c.createBufferSource(); s.buffer = buf; s.connect(c.destination);
      const t = setTimeout(res, buf.duration * 1000 + 1500);   // never hang if onended doesn't fire
      s.onended = () => { clearTimeout(t); if (current === s) current = null; res(); };
      current = s; s.start(0);
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
  // For the grown-up sound check: what the audio is doing on this device
  const info = () => ({ state: ctx ? ctx.state : "not started", rate: ctx ? ctx.sampleRate : 0, session: navigator.audioSession ? navigator.audioSession.type : "n/a", ...status });
  // Play one clip straight through <audio>, skipping Web Audio
  const playElement = name => { stop(); return viaElement(name, token); };
  return { play, stop, preload, info, playElement };
})();
