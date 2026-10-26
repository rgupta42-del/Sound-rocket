// Audio: recorded clips in /audio, fetched once, decoded with Web Audio and cached.
// Clips play back-to-back with no gap or start-up delay; a new play() cancels the old one.
window.Audio2 = (() => {
  let ctx = null, current = null, token = 0;
  const cache = new Map();   // name -> Promise<AudioBuffer|null>
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}

  function context() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    return ctx;
  }
  function load(name) {
    if (!cache.has(name)) {
      const c = context();
      cache.set(name, !c ? Promise.resolve(null) :
        fetch("audio/" + name + ".mp3").then(r => r.ok ? r.arrayBuffer() : null)
          .then(b => b ? new Promise(res => c.decodeAudioData(b, res, () => res(null))) : null)
          .catch(() => null));
    }
    return cache.get(name);
  }
  const preload = names => Promise.all([].concat(names).map(load));

  // The first touch unlocks sound on phones and tablets
  function unlock() {
    const c = context(); if (!c) return;
    if (c.state !== "running") c.resume().catch(() => {});
    try { const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0); } catch (e) {}
  }
  ["pointerdown", "touchend", "keydown"].forEach(ev => window.addEventListener(ev, unlock, { passive: true }));

  function stop() { token++; if (current) { try { current.stop(); } catch (e) {} current = null; } }
  async function one(name, my) {
    const c = context(); if (!c) return;
    if (c.state !== "running") { try { await c.resume(); } catch (e) {} }
    const buf = await load(name); if (!buf || my !== token) return;
    await new Promise(res => {
      const s = c.createBufferSource(); s.buffer = buf; s.connect(c.destination);
      s.onended = () => { if (current === s) current = null; res(); };
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
  return { play, stop, preload };
})();
