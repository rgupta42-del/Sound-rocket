(() => {
const D = window.DATA, A = window.Audio2, St = window.Store;
const $ = s => document.querySelector(s);
const app = $("#app");
const wait = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- clip names ----------
const W = w => "w_" + (w === "I" ? "cap_i" : w.toLowerCase().replace(/[^a-z]/g, ""));
const SN = s => "s_" + s;
const isVowel = t => D.VOWELS.includes(t);
const tileClass = t => isVowel(t) ? "v" : "c";
const CHEERS = ["p_great", "p_gotit", "p_awesome", "p_super", "p_yes", "p_wow", "p_nice"];
const cheer = () => CHEERS[Math.floor(Math.random() * CHEERS.length)];

// ---------- content helpers ----------
const level = () => D.LEVELS.find(l => l.id === St.S.level) || D.LEVELS[0];
const levelWords = l => Object.values(l.words).flat();
const PICS = {};
// words whose emoji could mean something else stay out of the picture games
const NOT_PICTURES = new Set(["red", "green", "ten", "six", "three", "yes", "hot", "sad", "grin", "top", "fog", "man", "kid", "up"]);
D.LEVELS.forEach(l => levelWords(l).forEach(([w, p]) => { if (p && !NOT_PICTURES.has(w)) PICS[w] = p; }));
Object.values(D.SOUNDS).forEach(([, kw, p]) => { if (p && !PICS[kw] && !NOT_PICTURES.has(kw)) PICS[kw] = p; });
const soundGroup = s => (s === "c" || s === "k") ? "k" : s;
const firstSound = w => soundGroup(D.tiles(w.replace(/-/g, ""))[0]);
const TRICKY_SET = new Set(D.TRICKY.map(w => w.toLowerCase()));
const wordKnown = w => St.mastered("word:" + w) || St.mastered("build:" + w) || St.mastered("match:" + w);

// Sounds this level practices. Blue reviews all the letter sounds; green adds the phonograms.
function levelSounds() {
  const l = level();
  if (l.id === "green") return [...D.GREEN_SOUNDS, ...D.PINK_SOUNDS.filter(s => isVowel(s))];
  return D.PINK_SOUNDS;
}

// ---------- shared UI ----------
function shell(title, inner, opts = {}) {
  const S = St.S, f = S.stars % 20;
  app.innerHTML = `
    <div class="bar">
      ${opts.home ? "" : `<button class="back" id="back" aria-label="Back to mission control">←</button>`}
      <h1>${title}</h1>
      <div class="starcount" aria-label="Stars"><b>★</b><span id="stars">${S.stars}</span></div>
    </div>
    <div class="fuel">
      <svg class="rocket" id="rocket" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 3c7 6 9 14 7 23H13c-2-9 0-17 7-23z" fill="#E8EEFF"/>
        <circle cx="20" cy="15" r="4" fill="#7AAEFF" stroke="#17203F" stroke-width="1.5"/>
        <path d="M13 22l-6 8 7-1zM27 22l6 8-7-1z" fill="#DC3B3B"/><path d="M16 27h8l-4 9z" fill="#FFC83A"/>
      </svg>
      <div class="gauge" role="progressbar" aria-label="Rocket fuel" aria-valuemin="0" aria-valuemax="20" aria-valuenow="${f}"><i id="fuelbar" style="width:${f / 20 * 100}%"></i></div>
      <small>${S.launches} ${S.launches === 1 ? "launch" : "launches"}</small>
    </div>
    ${inner}`;
  const b = $("#back"); if (b) b.onclick = () => go("home");
}
function refreshStars() {
  const S = St.S, f = S.stars % 20;
  const s = $("#stars"); if (s) s.textContent = S.stars;
  const fb = $("#fuelbar"); if (fb) fb.style.width = (f / 20 * 100) + "%";
}
function pop(text) {
  const p = $("#pop"); p.textContent = text; p.classList.add("show"); setTimeout(() => p.classList.remove("show"), 750);
}
function toast(text, ms = 2600) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = text; document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}
// Confetti burst on a full-screen canvas
function confetti(n = 70) {
  const c = $("#fx"), x = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cols = ["#FFC83A", "#F59AC2", "#7AAEFF", "#72D394", "#ffffff"];
  const ps = Array.from({ length: n }, () => ({ x: innerWidth / 2, y: innerHeight * .4, vx: (Math.random() - .5) * 12, vy: -Math.random() * 12 - 4, r: Math.random() * 6 + 4, c: cols[Math.floor(Math.random() * 5)], a: Math.random() * 6 }));
  let t = 0;
  (function f() { x.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .45; p.a += .2; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); x.restore(); }); if (++t < 80) requestAnimationFrame(f); else x.clearRect(0, 0, c.width, c.height); })();
}
// Award stars, celebrate, and play praise. Resolves when the praise finishes.
async function award(n, clips) {
  St.touch();
  const r = St.addStars(n); refreshStars(); pop("+" + n + " ★");
  if (r.launch) {
    const rk = $("#rocket"); if (rk) rk.classList.add("launch"); confetti(110);
    await A.play("p_blast");
    if (rk) { rk.style.transition = "none"; rk.classList.remove("launch"); void rk.offsetWidth; rk.style.transition = ""; }
  } else await A.play(clips || cheer(), 120);
  if (r.goal) { confetti(140); toast("Mission complete! 20 stars today 🚀", 3500); await A.play("p_mission"); }
  checkUnlocks();
}
function checkUnlocks() {
  const mastered = id => levelWords(D.LEVELS.find(l => l.id === id)).filter(([w]) => wordKnown(w)).length;
  if (mastered("pink") >= 20 && St.unlock("blue")) { toast("New planet unlocked: Mars! 🔴", 3500); A.play("p_levelup"); }
  if (mastered("blue") >= 15 && St.unlock("green")) { toast("New planet unlocked: Saturn! 🪐", 3500); A.play("p_levelup"); }
}
const lit = (el, on) => el && el.classList.toggle("on", on);
const tilesHTML = (parts, extra = "") => parts.map((t, i) => `<button class="tile ${tileClass(t)} ${extra}" data-i="${i}">${t}</button>`).join("");

// ---------- router ----------
const SCREENS = {};
function go(name, arg) { A.stop(); location.hash = name === "home" ? "" : name + (arg ? "-" + arg : ""); }
function route() {
  A.stop();
  const h = location.hash.slice(1), [name, ...rest] = h.split("-");
  (SCREENS[name] || SCREENS.home)(rest.join("-"));
  window.scrollTo(0, 0);
}
addEventListener("hashchange", route);
document.addEventListener("pointerdown", () => St.touch(), { passive: true });

// ---------- HOME ----------
const ACTS = [
  ["sounds", "🔤", "Sound Cards", "Learn a letter, find it, say it", "Montessori 3-step lesson"],
  ["trace", "✍️", "Trace It", "Trace the letter and say its sound", "Sandpaper letters"],
  ["ispy", "🔭", "I Spy", "Find what starts with the sound", "Listening game"],
  ["blend", "🧩", "Blend It", "Sound out words, then read them", "With a grown-up"],
  ["build", "🛠️", "Build a Word", "Hear a word, build it with letters", "Movable alphabet"],
  ["match", "🖼️", "Read & Match", "Read the word, pick the picture", "Reads on his own"],
  ["tricky", "⭐", "Tricky Words", "Words you just know by sight", "With a grown-up"],
  ["stories", "📖", "Storybook", "Read a little story yourself", "Decodable stories"]
];
SCREENS.home = () => {
  const S = St.S, d = St.today(), pct = Math.min(1, d.stars / St.GOAL), streak = St.streak();
  const ring = `<svg class="ring" viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="34" fill="none" stroke="#33478A" stroke-width="10"/>
    ${pct > 0 ? `<circle cx="42" cy="42" r="34" fill="none" stroke="#FFC83A" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(pct * 213.6).toFixed(1)} 213.6" transform="rotate(-90 42 42)"/>` : ""}
    <text x="42" y="48" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="20" fill="#fff">${d.stars}</text></svg>`;
  const orb = { pink: "radial-gradient(circle at 35% 35%,#fff,#d9d9e3 40%,#9ea1b8)", blue: "radial-gradient(circle at 35% 35%,#ffb39a,#e0603a 55%,#9c3416)", green: "radial-gradient(circle at 35% 35%,#fff1c4,#e7c26a 55%,#a07a2a)" };
  shell("Sound Rocket", `
    <div class="mission">${ring}<div><h2>${d.stars >= St.GOAL ? "Mission complete today!" : `Today's mission: ${St.GOAL} stars`}</h2>
      <p>${d.stars >= St.GOAL ? "Great reading. Keep going for bonus stars!" : `${St.GOAL - d.stars} stars to go`} · ${streak} day streak 🔥</p></div></div>
    <div class="planets" role="group" aria-label="Choose a planet">${D.LEVELS.map(l => {
      const locked = !S.unlocked.includes(l.id);
      return `<button class="planet ${locked ? "locked" : ""}" data-l="${l.id}" aria-pressed="${l.id === S.level}">
        <span class="orb" style="background:${orb[l.id]}"></span><b>${locked ? "🔒 " : ""}${l.name}</b><small>${l.blurb}</small></button>`;
    }).join("")}</div>
    <div class="acts">${ACTS.map(([id, ico, name, sub, tag]) => `<button class="act" data-a="${id}"><span class="ico">${ico}</span><b>${name}</b><small>${sub}</small><span class="tag">${tag}</span></button>`).join("")}</div>
    <button class="grownup" id="prog">📈 Progress and grown-up corner</button>`, { home: true });
  app.querySelectorAll(".planet").forEach(b => b.onclick = () => {
    if (!S.unlocked.includes(b.dataset.l)) { toast("Earn more stars to fly here. A grown-up can unlock it in the Progress page.", 3200); return; }
    St.setLevel(b.dataset.l); SCREENS.home();
  });
  app.querySelectorAll(".act").forEach(b => b.onclick = () => go(b.dataset.a));
  $("#prog").onclick = () => go("progress");
};

// ---------- SOUND CARDS: Montessori three-period lesson ----------
// 1 "This is /s/" (naming), 2 "Show me /s/" (recognition), 3 "What sound is this?" (recall)
SCREENS.sounds = () => {
  const pool = levelSounds();
  const k = St.pick(pool.map(s => "snd:" + s));
  const s = k.slice(4), it = St.item(k);
  const period = !it.seen ? 1 : (it.box >= 2 ? (Math.random() < .65 ? 3 : 2) : (Math.random() < .6 ? 2 : 3));
  shell("Sound Cards", `<section class="card" id="card"></section>`);
  ({ 1: soundP1, 2: soundP2, 3: soundP3 })[period](s, k, pool);
};
function dotsHTML(n) { return `<div class="three" aria-label="Step ${n} of 3">${[1, 2, 3].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</div>`; }
function soundP1(s, k, pool) {
  const [disp, kw, pic] = D.SOUNDS[s];
  const card = $("#card");
  card.innerHTML = `${dotsHTML(1)}<p class="prompt">New sound! Listen, then say it.</p>
    <button class="tile ${tileClass(s)}" id="t">${disp}</button>
    <div class="kw"><span>${pic}</span> ${disp}… like ${kw}</div>
    <div class="row"><button class="btn" id="kwb">🔊 ${kw}</button></div>
    <button class="btn yes big" id="next">I said it! Next step →</button>`;
  A.preload([SN(s), "p_thisis", W(kw), "p_like"]);
  const t = $("#t");
  const hear = async () => { lit(t, true); await A.play(SN(s)); lit(t, false); };
  t.onclick = hear;
  $("#kwb").onclick = async () => { lit(t, true); await A.play([SN(s), "p_like", W(kw)], 150); lit(t, false); };
  $("#next").onclick = async () => { St.grade(k, true, "sounds"); await award(1); soundP2(s, k, pool, true); };
  (async () => { lit(t, true); await A.play(["p_thisis", SN(s)], 150); lit(t, false); })();
}
function soundP2(s, k, pool, fromP1) {
  const card = $("#card");
  const others = St.sample(pool.filter(x => x !== s && soundGroup(x) !== soundGroup(s)), 2);
  const opts = St.shuffle([s, ...others]);
  card.innerHTML = `${dotsHTML(2)}<p class="prompt big">Show me…</p>
    <div class="row"><button class="btn" id="again">🔊 Hear it again</button></div>
    <div class="choices">${opts.map(o => `<button class="choice letter" data-s="${o}" style="color:var(${isVowel(o) ? "--vowel" : "--cons"})">${D.SOUNDS[o][0]}</button>`).join("")}</div>`;
  const ask = () => A.play(["p_showme", SN(s)], 150);
  $("#again").onclick = ask; ask();
  let miss = 0;
  card.querySelectorAll(".choice").forEach(b => b.onclick = async () => {
    if (b.dataset.s === s) {
      b.classList.add("good"); St.grade(k, miss === 0, "sounds");
      await award(miss ? 1 : 2, [SN(s), cheer()]);
      if (fromP1) soundP3(s, k, pool); else SCREENS.sounds();
    } else {
      miss++; b.classList.add("bad"); await A.play([SN(b.dataset.s), "p_notquite"], 200); ask();
    }
  });
}
function soundP3(s, k) {
  const card = $("#card");
  card.innerHTML = `${dotsHTML(3)}<p class="prompt big">What sound is this?</p>
    <button class="tile ${tileClass(s)}" id="t">${D.SOUNDS[s][0]}</button>
    <div class="grown"><p>Grown-up taps</p><div class="row">
      <button class="btn yes big" id="ok">Said it! +1</button><button class="btn try" id="help">Help me</button><button class="btn" id="skip">Skip</button></div></div>`;
  A.play("p_whatsound");
  const t = $("#t");
  t.onclick = async () => { lit(t, true); await A.play(SN(s)); lit(t, false); };
  $("#ok").onclick = async () => { St.grade(k, true, "sounds"); await award(1); SCREENS.sounds(); };
  $("#help").onclick = async () => { St.grade(k, false, "sounds"); const [, kw] = D.SOUNDS[s]; lit(t, true); await A.play([SN(s), "p_like", W(kw), SN(s)], 200); lit(t, false); };
  $("#skip").onclick = () => SCREENS.sounds();
}

// ---------- TRACE IT: sandpaper letters ----------
SCREENS.trace = () => {
  const pool = levelSounds();
  const k = St.pick(pool.map(s => "trace:" + s));
  const s = k.slice(6), [disp, kw, pic] = D.SOUNDS[s];
  shell("Trace It", `<section class="card">
    <p class="prompt">Trace the letter with your finger. Say the sound as you trace.</p>
    <canvas class="trace" id="cv" aria-label="Tracing area for ${disp}"></canvas>
    <div class="kw"><span>${pic}</span> ${disp}… like ${kw}</div>
    <div class="row"><button class="btn" id="hear">🔊 Hear it</button><button class="btn" id="clear">Clear</button><button class="btn" id="skip">Next letter</button></div></section>`);
  A.play(["p_trace", SN(s)], 200);
  $("#hear").onclick = () => A.play([SN(s), "p_like", W(kw)], 150);
  $("#skip").onclick = () => SCREENS.trace();
  const cv = $("#cv"), dpr = Math.min(2, devicePixelRatio || 1);
  const size = cv.getBoundingClientRect().width; cv.width = cv.height = Math.round(size * dpr);
  const g = cv.getContext("2d"), mask = document.createElement("canvas"); mask.width = mask.height = cv.width;
  const m = mask.getContext("2d");
  const fontPx = cv.width * (disp.length > 1 ? .5 : .72);
  const drawLetter = (ctx, color) => { ctx.fillStyle = color; ctx.font = `700 ${fontPx}px Andika, "Century Gothic", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(disp, cv.width / 2, cv.height * .53); };
  function base() {
    g.clearRect(0, 0, cv.width, cv.height);
    // sandpaper texture: speckled letter
    drawLetter(g, isVowel(s) ? "#BFD3FB" : "#F7C3C3");
    g.globalCompositeOperation = "source-atop";
    for (let i = 0; i < 2500; i++) { g.fillStyle = Math.random() < .5 ? "#0001" : "#fff6"; g.fillRect(Math.random() * cv.width, Math.random() * cv.height, 2 * dpr, 2 * dpr); }
    g.globalCompositeOperation = "source-over";
  }
  document.fonts && document.fonts.ready.then(() => { base(); m.clearRect(0, 0, mask.width, mask.height); drawLetter(m, "#000"); });
  base(); drawLetter(m, "#000");
  const ink = isVowel(s) ? "#2563EB" : "#DC3B3B";
  let down = false, last = null, done = false, hits = new Set(), total = 0;
  const md = () => { const d = m.getImageData(0, 0, mask.width, mask.height).data; let n = 0; for (let i = 3; i < d.length; i += 4 * 64) if (d[i] > 0) n++; return n; };
  const grid = 14 * dpr;
  function at(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; }
  function stroke(p) {
    g.strokeStyle = ink; g.lineWidth = 16 * dpr; g.lineCap = "round"; g.lineJoin = "round";
    g.beginPath(); g.moveTo(...(last || p)); g.lineTo(...p); g.stroke(); last = p;
    // count letter cells covered
    const [x, y] = p, md2 = m.getImageData(Math.max(0, x | 0), Math.max(0, y | 0), 1, 1).data[3];
    if (md2 > 0) hits.add(((x / grid) | 0) + "," + ((y / grid) | 0));
  }
  cv.onpointerdown = e => { down = true; last = null; cv.setPointerCapture(e.pointerId); stroke(at(e)); if (!hits.size) A.play(SN(s)); };
  cv.onpointermove = e => { if (down) stroke(at(e)); };
  cv.onpointerup = cv.onpointercancel = async () => {
    down = false; last = null;
    if (!total) { // letter cells in the mask
      const d = m.getImageData(0, 0, mask.width, mask.height).data; const cells = new Set();
      for (let y = 0; y < mask.height; y += 4) for (let x = 0; x < mask.width; x += 4) if (d[(y * mask.width + x) * 4 + 3] > 0) cells.add(((x / grid) | 0) + "," + ((y / grid) | 0));
      total = cells.size;
    }
    if (!done && hits.size / total > .55) {
      done = true; St.grade(k, true, "trace"); await award(1, [SN(s), cheer()]);
      await wait(400); SCREENS.trace();
    }
  };
  $("#clear").onclick = () => { base(); hits = new Set(); done = false; };
};

// ---------- I SPY: beginning sounds ----------
SCREENS.ispy = () => {
  const words = Object.keys(PICS).filter(w => !["x", "ck", "ng"].includes(firstSound(w)));
  const bySound = {};
  words.forEach(w => (bySound[firstSound(w)] ||= []).push(w));
  const allowed = new Set(levelSounds().map(soundGroup).concat(level().id === "pink" ? [] : D.GREEN_SOUNDS));
  const sounds = Object.keys(bySound).filter(s => allowed.has(s));
  const k = St.pick(sounds.map(s => "spy:" + s), { ordered: false });
  const s = k.slice(4), target = St.sample(bySound[s], 1)[0];
  const distract = St.sample(words.filter(w => firstSound(w) !== s), 12);
  const ds = []; for (const w of distract) if (ds.length < 2 && !ds.some(x => firstSound(x) === firstSound(w))) ds.push(w);
  const opts = St.shuffle([target, ...ds]);
  shell("I Spy", `<section class="card">
    <p class="prompt big">I spy something that starts with…</p>
    <button class="btn big" id="snd" aria-label="Hear the sound">🔊 Hear the sound</button>
    <div class="choices">${opts.map(w => `<button class="choice" data-w="${w}" aria-label="${w}">${PICS[w]}</button>`).join("")}</div>
    <div class="row"><button class="btn" id="again">Say the whole thing again</button><button class="btn" id="skip">Skip</button></div></section>`);
  A.preload(opts.map(W));
  const ask = () => A.play(["p_ispy", SN(s), SN(s)], 250);
  ask(); $("#again").onclick = ask; $("#snd").onclick = () => A.play(SN(s));
  $("#skip").onclick = () => SCREENS.ispy();
  let miss = 0;
  app.querySelectorAll(".choice").forEach(b => b.onclick = async () => {
    const w = b.dataset.w;
    if (w === target) {
      b.classList.add("good"); St.grade(k, miss === 0, "ispy");
      await award(miss ? 1 : 2, [W(w), SN(s), cheer()]); SCREENS.ispy();
    } else {
      miss++; b.classList.add("bad");
      await A.play(["p_thats", W(w), "p_notquite"], 150); ask();
    }
  });
};

// ---------- BLEND IT: sound out with a grown-up ----------
SCREENS.blend = (group) => {
  const l = level(), groups = Object.keys(l.words);
  if (!groups.includes(group)) group = "all";
  const list = group === "all" ? levelWords(l) : l.words[group];
  const k = St.pick(list.map(([w]) => "word:" + w), { maxNew: 4, ordered: false });
  const w = k.slice(5), pic = PICS[w] || "", parts = D.tiles(w);
  shell("Blend It", `<section class="card">
    <div class="levels">${["all", ...groups].map(g => `<button aria-pressed="${g === group}" data-g="${esc(g)}">${g === "all" ? "Mix" : esc(g)}</button>`).join("")}</div>
    <p class="prompt">Tap each letter and say its sound. Then slide them together!</p>
    <div class="tiles" id="tiles">${tilesHTML(parts)}</div>
    <div class="slide"><b id="sl"></b></div>
    <div class="pic" id="pic" aria-hidden="true"></div>
    <div class="row"><button class="btn" id="slow">👣 Sound it out</button><button class="btn" id="stretch">🐍 Stretch it</button><button class="btn" id="whole">🔊 Word</button></div>
    <div class="grown"><p>Grown-up taps</p><div class="row">
      <button class="btn yes" id="snd">Said the sounds +1</button><button class="btn yes big" id="rd">Read the word! +2</button></div>
      <div class="row"><button class="btn try" id="again">Try together</button><button class="btn" id="skip">Next word</button></div></div></section>`);
  app.querySelectorAll(".levels button").forEach(b => b.onclick = () => SCREENS.blend(b.dataset.g));
  A.preload([...parts.map(SN), W(w), "st_" + w]);
  const tiles = [...app.querySelectorAll("#tiles .tile")], seen = new Set();
  const mark = () => $("#sl").style.width = (seen.size / parts.length * 100) + "%";
  const clear = () => tiles.forEach(t => lit(t, false));
  tiles.forEach(t => t.onclick = async () => { const i = +t.dataset.i; clear(); lit(t, true); seen.add(i); mark(); await A.play(SN(parts[i])); lit(t, false); });
  async function soundOut() {
    const ok = await A.play(parts.map(SN), 420, i => { clear(); lit(tiles[i], true); seen.add(i); mark(); });
    if (!ok) return; clear(); await wait(300); tiles.forEach(t => lit(t, true)); await A.play("st_" + w); await wait(250); await A.play(W(w)); clear();
  }
  $("#slow").onclick = soundOut;
  $("#stretch").onclick = async () => { tiles.forEach(t => lit(t, true)); await A.play("st_" + w); clear(); };
  $("#whole").onclick = async () => { tiles.forEach(t => lit(t, true)); await A.play(W(w)); clear(); };
  let soundsDone = false, helped = false;
  $("#snd").onclick = async () => { if (soundsDone) return; soundsDone = true; $("#snd").disabled = true; await award(1, "p_goodsounds"); };
  $("#rd").onclick = async () => { $("#pic").textContent = pic || "✅"; St.grade(k, !helped, "blend"); await award(2, [cheer(), W(w)]); await wait(300); SCREENS.blend(group); };
  $("#again").onclick = async () => { helped = true; if (await A.play("p_together")) soundOut(); };
  $("#skip").onclick = () => SCREENS.blend(group);
};

// ---------- BUILD A WORD: movable alphabet ----------
SCREENS.build = () => {
  const l = level(), list = levelWords(l).filter(([w]) => PICS[w]);
  const k = St.pick(list.map(([w]) => "build:" + w), { ordered: false });
  const w = k.slice(6), parts = D.tiles(w);
  const extras = St.sample(levelSounds().filter(s => !parts.includes(s) && s.length <= 2), parts.length > 3 ? 3 : 2);
  const tray = St.shuffle([...parts, ...extras]);
  shell("Build a Word", `<section class="card">
    <p class="prompt big">Build the word</p>
    <button class="pic" id="pic" style="background:none;border:none;cursor:pointer" aria-label="Hear the word">${PICS[w]}</button>
    <div class="boxes" id="boxes">${parts.map((p, i) => `<div class="box" data-i="${i}"></div>`).join("")}</div>
    <div class="tiles" id="tray">${tray.map((t, i) => `<button class="tile sm ${tileClass(t)}" data-t="${t}" data-i="${i}">${t}</button>`).join("")}</div>
    <div class="row"><button class="btn" id="hear">🔊 Hear the word</button><button class="btn" id="hint">💡 Next sound</button><button class="btn" id="skip">Skip</button></div></section>`);
  A.preload([W(w), ...tray.map(SN)]);
  const say = () => A.play(["p_build", W(w)], 150);
  say(); $("#hear").onclick = () => A.play(W(w)); $("#pic").onclick = () => A.play(W(w));
  $("#skip").onclick = () => SCREENS.build();
  let pos = 0, miss = 0;
  const boxes = [...app.querySelectorAll(".box")];
  $("#hint").onclick = () => { miss++; A.play(SN(parts[pos])); };
  app.querySelectorAll("#tray .tile").forEach(b => b.onclick = async () => {
    const t = b.dataset.t;
    if (t === parts[pos]) {
      boxes[pos].textContent = t; boxes[pos].classList.add("filled", tileClass(t)); b.classList.add("used");
      pos++;
      if (pos === parts.length) {
        St.grade(k, miss <= 1, "build");
        boxes.forEach(x => x.classList.add("on")); await A.play(parts.map(SN), 250, i => boxes.forEach((x, j) => x.style.transform = j === i ? "translateY(-6px)" : ""));
        boxes.forEach(x => x.style.transform = "");
        await award(miss <= 1 ? 3 : 2, [W(w), cheer()]); await wait(300); SCREENS.build();
      } else A.play(SN(t));
    } else {
      miss++; b.classList.remove("wiggle"); void b.offsetWidth; b.classList.add("wiggle");
      await A.play([SN(t), "p_notquite"], 150);
    }
  });
};

// ---------- READ & MATCH ----------
SCREENS.match = () => {
  const l = level(), list = levelWords(l).filter(([w]) => PICS[w]);
  const k = St.pick(list.map(([w]) => "match:" + w), { ordered: false });
  const w = k.slice(6), parts = D.tiles(w);
  const all = Object.keys(PICS).filter(x => x !== w && PICS[x] !== PICS[w]);
  // distractors that look alike (same first or last letter) make it real reading, not guessing
  const alike = St.shuffle(all.filter(x => x[0] === w[0] || x.slice(-1) === w.slice(-1) || x.length === w.length));
  const ds = []; for (const x of [...alike, ...St.shuffle(all)]) if (ds.length < 2 && !ds.includes(x) && !ds.some(y => PICS[y] === PICS[x])) ds.push(x);
  const opts = St.shuffle([w, ...ds]);
  shell("Read & Match", `<section class="card">
    <p class="prompt">Read the word. Which picture is it?</p>
    <div class="tiles" id="tiles">${tilesHTML(parts, "sm")}</div>
    <div class="choices">${opts.map(x => `<button class="choice" data-w="${x}" aria-label="picture">${PICS[x]}</button>`).join("")}</div>
    <div class="row"><button class="btn" id="help">👣 Help me sound it out</button><button class="btn" id="skip">Skip</button></div></section>`);
  const tiles = [...app.querySelectorAll("#tiles .tile")];
  tiles.forEach(t => t.onclick = async () => { lit(t, true); await A.play(SN(parts[+t.dataset.i])); lit(t, false); });
  let helped = false, miss = 0;
  $("#help").onclick = async () => { helped = true; await A.play(parts.map(SN), 420, i => tiles.forEach((t, j) => lit(t, j === i))); tiles.forEach(t => lit(t, false)); };
  $("#skip").onclick = () => SCREENS.match();
  app.querySelectorAll(".choice").forEach(b => b.onclick = async () => {
    if (b.dataset.w === w) {
      b.classList.add("good"); St.grade(k, !helped && !miss, "match"); St.grade("word:" + w, !helped && !miss);
      await award(!helped && !miss ? 2 : 1, [W(w), cheer()]); SCREENS.match();
    } else { miss++; b.classList.add("bad"); await A.play(["p_thats", W(b.dataset.w), "p_notquite"], 150); }
  });
};

// ---------- TRICKY WORDS ----------
SCREENS.tricky = () => {
  const k = St.pick(D.TRICKY.map(w => "tricky:" + w), { maxNew: 2 });
  const w = k.slice(7);
  shell("Tricky Words", `<section class="card">
    <p class="prompt">Tricky word! You can't sound this one out. Do you know it?</p>
    <button class="tile word" id="t">${esc(w)}</button>
    <p class="prompt" style="font-size:1rem">Look at it, say it, then close your eyes and see it.</p>
    <div class="grown"><p>Grown-up taps</p><div class="row">
      <button class="btn yes big" id="ok">Knew it! +1</button><button class="btn try" id="learn">Learn it</button><button class="btn" id="skip">Skip</button></div></div></section>`);
  const t = $("#t");
  t.onclick = async () => { lit(t, true); await A.play(W(w)); lit(t, false); };
  $("#ok").onclick = async () => { St.grade(k, true, "tricky"); await award(1); SCREENS.tricky(); };
  $("#learn").onclick = async () => { St.grade(k, false, "tricky"); lit(t, true); await A.play(["p_thisword", W(w), W(w)], 450); lit(t, false); };
  $("#skip").onclick = () => SCREENS.tricky();
};

// ---------- STORYBOOK ----------
SCREENS.stories = () => {
  const S = St.S, order = { pink: 0, blue: 1, green: 2 };
  const books = D.STORIES.slice().sort((a, b) => order[a.level] - order[b.level]);
  shell("Storybook", `
    <div class="panel"><p>Read the story to yourself. Tap any word you get stuck on to hear it. Words underlined in yellow are tricky words.</p></div>
    <div class="shelf">${books.map(b => {
      const lv = D.LEVELS.find(l => l.id === b.level), read = S.stories[b.id];
      const locked = !S.unlocked.includes(b.level);
      return `<button class="book ${b.level}" data-id="${b.id}"><span class="cv">${b.cover}</span><b>${esc(b.title)}</b>
        <small>${locked ? "🔒 " : ""}${lv.name}${read ? ` · read ${read.times}×` : ""}</small></button>`;
    }).join("")}</div>`);
  app.querySelectorAll(".book").forEach(b => b.onclick = () => {
    const st = D.STORIES.find(s => s.id === b.dataset.id);
    if (!S.unlocked.includes(st.level)) { toast("This story is on a planet you haven't reached yet.", 3000); return; }
    go("story", st.id);
  });
};
SCREENS.story = (id) => {
  const st = D.STORIES.find(s => s.id === id); if (!st) return go("stories");
  let page = 0, helpWords = new Set();
  const draw = () => {
    if (page >= st.pages.length) return question();
    const [text, ill] = st.pages[page];
    const words = text.split(/\s+/);
    shell(esc(st.title), `<section class="card">
      <div class="illus" aria-hidden="true">${ill}</div>
      <div class="page" id="pg">${words.map((tok, i) => {
        const clean = tok.replace(/[^A-Za-z']/g, "");
        return `<button data-w="${esc(clean)}" class="${TRICKY_SET.has(clean.toLowerCase()) ? "tricky" : ""}">${esc(tok)}</button>`;
      }).join("")}</div>
      <div class="pager">
        <button class="btn" id="prev" ${page ? "" : "disabled"}>← Back</button>
        <div class="dots">${st.pages.map((_, i) => `<i class="${i === page ? "on" : ""}"></i>`).join("")}</div>
        <button class="btn yes" id="next">${page === st.pages.length - 1 ? "Finish ✓" : "Next →"}</button>
      </div>
      <div class="row"><button class="btn" id="read">🔊 Read it to me</button></div></section>`);
    if (page === 0) A.play("title_" + st.id);
    A.preload(["sent_" + st.id + "_" + page, ...words.map(t => W(t.replace(/[^A-Za-z']/g, "")))]);
    app.querySelectorAll("#pg button").forEach(b => b.onclick = async () => {
      app.querySelectorAll("#pg button").forEach(x => lit(x, false)); lit(b, true);
      helpWords.add(b.dataset.w.toLowerCase()); await A.play(W(b.dataset.w)); lit(b, false);
    });
    $("#read").onclick = () => A.play("sent_" + st.id + "_" + page);
    $("#prev").onclick = () => { page--; draw(); };
    $("#next").onclick = async () => { St.touch(); if (page < st.pages.length - 1) await award(1, "p_nice"); page++; draw(); };
  };
  const question = () => {
    const [q, answers] = st.q, opts = St.shuffle(answers);
    shell(esc(st.title), `<section class="card">
      <p class="prompt big">${esc(q)}</p>
      <div class="choices">${opts.map(([w, p]) => `<button class="choice" data-w="${w}" aria-label="${w}">${p}</button>`).join("")}</div>
      <div class="row"><button class="btn" id="hear">🔊 Hear the question</button></div></section>`);
    A.play("q_" + st.id); $("#hear").onclick = () => A.play("q_" + st.id);
    app.querySelectorAll(".choice").forEach(b => b.onclick = async () => {
      if (b.dataset.w === answers[0][0]) {
        b.classList.add("good");
        // words he needed help with come back sooner in practice
        helpWords.forEach(w => { if (levelWords(D.LEVELS.find(l => l.id === st.level)).some(([x]) => x === w)) St.grade("word:" + w, false); });
        St.storyRead(st.id); St.today().acts.stories = (St.today().acts.stories || 0) + 1;
        confetti(120); await award(5, [W(b.dataset.w), "p_finished"]);
        go("stories");
      } else { b.classList.add("bad"); await A.play(["p_thats", W(b.dataset.w), "p_notquite"], 150); }
    });
  };
  draw();
};

// ---------- PROGRESS + GROWN-UP CORNER ----------
SCREENS.progress = () => {
  const S = St.S, d = St.today(), days = [];
  for (let i = 13; i >= 0; i--) { const x = new Date(); x.setDate(x.getDate() - i); const k = St.dayKey(x); days.push([k, S.days[k] || { stars: 0, secs: 0 }, x]); }
  const week = days.slice(-7), weekStars = week.reduce((a, [, v]) => a + (v.stars || 0), 0), weekMin = Math.round(week.reduce((a, [, v]) => a + (v.secs || 0), 0) / 60);
  const max = Math.max(St.GOAL, ...days.map(([, v]) => v.stars || 0));
  const cw = 560, ch = 170, pl = 30, pb = 26, bw = (cw - pl) / 14;
  const y = v => ch - pb - (v / max) * (ch - pb - 12);
  const chart = `<svg class="chart" viewBox="0 0 ${cw} ${ch}" role="img" aria-label="Stars each day for the last two weeks">
    <line x1="${pl}" x2="${cw}" y1="${y(St.GOAL)}" y2="${y(St.GOAL)}" stroke="#FFC83A" stroke-width="2" stroke-dasharray="6 5"/>
    <text x="${pl - 4}" y="${y(St.GOAL) + 4}" text-anchor="end" font-size="11" fill="#5A6688">${St.GOAL}</text>
    <text x="${pl - 4}" y="${ch - pb + 4}" text-anchor="end" font-size="11" fill="#5A6688">0</text>
    <line x1="${pl}" x2="${cw}" y1="${ch - pb}" y2="${ch - pb}" stroke="#D6DCEC"/>
    ${days.map(([k, v, x], i) => { const h = (ch - pb) - y(v.stars || 0), bx = pl + i * bw + 4;
      return `<rect x="${bx}" y="${y(v.stars || 0)}" width="${bw - 8}" height="${Math.max(0, h)}" rx="5" fill="${(v.stars || 0) >= St.GOAL ? "#169B52" : "#7AAEFF"}"/>
      ${v.stars ? `<text x="${bx + (bw - 8) / 2}" y="${y(v.stars) - 4}" text-anchor="middle" font-size="11" fill="#17203F" font-weight="700">${v.stars}</text>` : ""}
      <text x="${bx + (bw - 8) / 2}" y="${ch - 8}" text-anchor="middle" font-size="11" fill="${i === 13 ? "#17203F" : "#5A6688"}" font-weight="${i === 13 ? 700 : 400}">${"SMTWTFS"[x.getDay()]}</text>`; }).join("")}
  </svg>`;
  const allSounds = [...D.PINK_SOUNDS, ...D.GREEN_SOUNDS];
  const seenBox = k => (S.items[k] && S.items[k].seen ? S.items[k].box : -1);
  const cls = s => { const b = Math.max(seenBox("snd:" + s), seenBox("trace:" + s), seenBox("spy:" + soundGroup(s))); return b >= St.MASTERED ? "m" : b >= 1 ? "l2" : b >= 0 ? "l1" : ""; };
  const lvRows = D.LEVELS.map(l => { const ws = levelWords(l), m = ws.filter(([w]) => wordKnown(w)).length;
    const col = { pink: "var(--pink)", blue: "var(--blue)", green: "var(--green)" }[l.id];
    return `<div class="lvrow"><span>${l.name}</span><div class="meter"><i style="width:${m / ws.length * 100}%;background:${col}"></i></div><span>${m}/${ws.length}</span></div>`; }).join("");
  const tricky = D.TRICKY.filter(w => St.mastered("tricky:" + w));
  const weak = Object.entries(S.items).filter(([, v]) => v.seen >= 3 && v.right / v.seen < .6).sort((a, b) => a[1].right / a[1].seen - b[1].right / b[1].seen).slice(0, 10)
    .map(([k]) => k.split(":")[1]);
  const storyList = D.STORIES.filter(s => S.stories[s.id]).map(s => `<span class="chip">📖 ${esc(s.title)} · ${S.stories[s.id].times}×</span>`).join("") || `<p>No stories finished yet.</p>`;
  shell("Progress", `
    <div class="panel"><h3>Today</h3>
      <div class="stats">
        <div class="stat"><b>${d.stars}</b><small>stars today</small></div>
        <div class="stat"><b>${Math.round(d.secs / 60)}</b><small>minutes today</small></div>
        <div class="stat"><b>${d.tries ? Math.round(d.right / d.tries * 100) + "%" : "–"}</b><small>right first time</small></div>
        <div class="stat"><b>${St.streak()}</b><small>day streak</small></div>
      </div>
      <p>This week: ${weekStars} stars in ${weekMin} ${weekMin === 1 ? "minute" : "minutes"}. Goal is ${St.GOAL} stars a day (green bars).</p>
      ${chart}</div>
    <div class="panel"><h3>Letter sounds</h3>
      <div class="soundgrid">${allSounds.map(s => `<div class="sg ${cls(s)}">${D.SOUNDS[s][0]}</div>`).join("")}</div>
      <div class="legend"><span style="--c:#F1F4FB">Not tried</span><span style="--c:#FFF1C9">Started</span><span style="--c:#FFE08A">Learning</span><span style="--c:#CFF2DC">Knows it</span></div></div>
    <div class="panel"><h3>Words he can read</h3>${lvRows}
      <p>Tricky words known: ${tricky.length}/${D.TRICKY.length}${tricky.length ? " · " + tricky.map(esc).join(", ") : ""}</p></div>
    <div class="panel"><h3>Stories read</h3><div class="chips">${storyList}</div></div>
    ${weak.length ? `<div class="panel"><h3>Needs more practice</h3><p>These come up more often until he gets them.</p><div class="chips">${weak.map(w => `<span class="chip">${esc(w)}</span>`).join("")}</div></div>` : ""}
    <div class="panel"><h3>Grown-up corner</h3>
      <ul class="tips">
        <li><b>Short and often:</b> 10 minutes a day beats an hour on Saturday. The daily goal is ${St.GOAL} stars.</li>
        <li><b>Sounds, not letter names:</b> say "mmm," not "em." Stop sounds are short: "b," not "buh."</li>
        <li><b>Three steps (Montessori):</b> Sound Cards teach "This is…", then "Show me…", then "What is this?"</li>
        <li><b>Colours:</b> vowels are blue and consonants red, like the Montessori movable alphabet.</li>
        <li><b>Let him fix mistakes:</b> wrong taps play their own sound so he can hear the difference. Misses never take stars away.</li>
        <li><b>Planets:</b> Moon is 3-letter words, Mars is 4–5 letter words with blends, Saturn is sh, ch, th, ck, ee, oo, ng. Mars opens after 20 Moon words, Saturn after 15 Mars words.</li>
        <li>Progress is saved on this device. On an iPad, tap Share → Add to Home Screen to open it like an app.</li>
      </ul>
      <p>Hold a button for 2 seconds to use it.</p>
      <div class="row">${D.LEVELS.filter(l => !S.unlocked.includes(l.id)).map(l => `<button class="btn hold" data-hold="unlock:${l.id}">Unlock ${l.name}</button>`).join("")}
        <button class="btn try hold" data-hold="reset">Reset progress</button></div></div>`);
  app.querySelectorAll("[data-hold]").forEach(b => {
    let t0 = 0, raf = 0;
    const tick = () => { const p = Math.min(1, (Date.now() - t0) / 2000); b.style.setProperty("--p", p); if (p >= 1) { done(); return; } raf = requestAnimationFrame(tick); };
    const done = () => {
      cancelAnimationFrame(raf); t0 = 0; const [act, l] = b.dataset.hold.split(":");
      if (act === "unlock") { St.unlock(l); toast("Unlocked!"); } else { St.reset(); toast("Progress reset"); }
      SCREENS.progress();
    };
    b.onpointerdown = () => { t0 = Date.now(); raf = requestAnimationFrame(tick); };
    b.onpointerup = b.onpointerleave = b.onpointercancel = () => { cancelAnimationFrame(raf); b.style.setProperty("--p", 0); };
  });
};

route();
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
})();
