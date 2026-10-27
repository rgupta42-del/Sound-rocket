(() => {
const D = window.DATA, M = window.MATH, GEO = window.GEO, A = window.Audio2, St = window.Store;
// subjects that use the practice engine (same problem format), and how each is labeled
const PRACTICE = { math: M, geo: GEO };
const SUBJ = { reading: ["📖", "Reading"], math: ["🔢", "Math"], geo: ["🌍", "Geography"] };
const $ = s => document.querySelector(s);
const app = $("#app");
const wait = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- clip names ----------
const W = w => "w_" + (w === "I" ? "cap_i" : w.toLowerCase().replace(/[^a-z]/g, ""));
const SN = s => "s_" + (D.SOUND_CLIP[s] || s);
const isVowel = t => D.VOWELS.includes(D.SOUND_CLIP[t] || t);
const tileClass = t => isVowel(t) ? "v" : "c";
// a word tile: vowel sounds blue, consonants red, silent letters grey, syllable chunks dark
const partClass = p => p.kind === "chunk" ? "k" : p.kind === "silent" ? "x" : tileClass(p.s);
const CHEERS = ["p_great", "p_gotit", "p_awesome", "p_super", "p_yes", "p_wow", "p_nice"];
const MATH_CHEERS = ["p_great", "p_gotit", "p_awesome", "p_yes", "p_wow", "p_nice", "p_correct", "p_smart"];
const cheer = () => { const c = St.S.subject !== "reading" ? MATH_CHEERS : CHEERS; return c[Math.floor(Math.random() * c.length)]; };

// ---------- content helpers ----------
const GRADE = id => D.GRADES.find(g => g.id === id) || D.GRADES[0];
const gradeIndex = id => D.GRADES.findIndex(g => g.id === id);
const rgrade = () => St.S.grade.reading;
const level = () => D.READING[rgrade()] || D.READING.prek;
const levelWords = l => Object.values(l.words).flat();
const PICS = {};
// words whose emoji could mean something else stay out of the picture games
const NOT_PICTURES = new Set(["red", "green", "ten", "six", "three", "nine", "five", "yes", "hot", "sad", "grin", "top", "fog", "man", "kid", "up"]);
Object.values(D.READING).forEach(l => levelWords(l).forEach(([w, p]) => { if (p && !NOT_PICTURES.has(w) && !PICS[w]) PICS[w] = p; }));
Object.values(D.SOUNDS).forEach(([, kw, p]) => { if (p && !PICS[kw] && !NOT_PICTURES.has(kw)) PICS[kw] = p; });
const soundGroup = s => (s === "c" || s === "k") ? "k" : (D.SOUND_CLIP[s] || s);
const firstSound = w => soundGroup(D.tiles(w.replace(/-/g, ""))[0]);
const TRICKY_SET = new Set(D.TRICKY.map(w => w.toLowerCase()));
const wordKnown = w => ["word:", "build:", "match:", "vocab:"].some(p => St.mastered(p + w));
const levelSounds = () => level().sounds || [];
const wordParts = (l, w) => (levelWords(l).find(x => x[0] === w) || [w, "", D.tiles(w).map(t => ({ d: t, s: t, clip: SN(t), kind: "sound" }))])[2];

// ---------- shared UI ----------
// Top of every screen: title, streak, total stars, and the rocket, which fills with today's stars.
// 20 stars today = mission complete and the rocket blasts off; every 20 after that is a bonus blast-off.
const fuel = () => { const t = St.today().stars, done = t >= St.GOAL, f = done ? (t - St.GOAL) % St.GOAL : t;
  return { pct: f / St.GOAL * 100, label: done ? `Mission done! Bonus ${f}/${St.GOAL}` : `${t}/${St.GOAL} stars today`, done }; };
const ROCKET = `<svg class="rocket" id="rocket" viewBox="0 0 40 40" aria-hidden="true">
  <path d="M20 3c7 6 9 14 7 23H13c-2-9 0-17 7-23z" fill="#E8EEFF"/><circle cx="20" cy="15" r="4" fill="#7AAEFF" stroke="#17203F" stroke-width="1.5"/>
  <path d="M13 22l-6 8 7-1zM27 22l6 8-7-1z" fill="#DC3B3B"/><path class="flame" d="M16 27h8l-4 9z" fill="#FFC83A"/></svg>`;
function shell(title, inner, opts = {}) {
  const S = St.S, f = fuel(), streak = St.streak();
  app.innerHTML = `
    <div class="bar">
      ${opts.home ? "" : `<button class="back" id="back" aria-label="Back to home">←</button>`}
      <h1>${title}</h1>
      ${streak ? `<div class="streak" aria-label="${streak} day streak">🔥<span>${streak}</span></div>` : ""}
      <div class="starcount" aria-label="${S.stars} stars"><b>★</b><span id="stars">${S.stars}</span></div>
    </div>
    <div class="fuel ${f.done ? "done" : ""}" id="fuel" role="progressbar" aria-label="Today's mission: fill the rocket with ${St.GOAL} stars" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(f.pct)}">
      ${ROCKET}<div class="gauge"><i id="fuelbar" style="width:${f.pct}%"></i><span id="fuellabel">${f.label}</span></div>
    </div>
    ${roundBar()}${inner}`;
  const b = $("#back"); if (b) b.onclick = () => go("home");
  $("#fuel").onclick = () => toast(f.done ? "Mission complete! Every 20 more stars launches the rocket again 🚀" : `Fill the rocket with ${St.GOAL} stars today and it blasts off! 🚀`, 3200);
}
function refreshStars() {
  const f = fuel();
  const s = $("#stars"); if (s) s.textContent = St.S.stars;
  const fb = $("#fuelbar"); if (fb) fb.style.width = f.pct + "%";
  const fl = $("#fuellabel"); if (fl) fl.textContent = f.label;
  const fu = $("#fuel"); if (fu) fu.classList.toggle("done", f.done);
}
// A big moment: a full-screen card with a bouncing picture, rays and confetti. Tap (or wait) to continue.
const celebrations = [];
function celebrate(o) {
  return new Promise(res => { celebrations.push([o, res]); if (celebrations.length === 1) showNext(); });
  function showNext() {
    const [c, done] = celebrations[0];
    const el = document.createElement("div"); el.className = "celebrate " + (c.kind || ""); el.setAttribute("role", "dialog"); el.setAttribute("aria-label", c.title);
    el.innerHTML = `<div class="rays" aria-hidden="true"></div><div class="cbox"><div class="cpic">${c.pic}</div><h2>${c.title}</h2>${c.sub ? `<p>${c.sub}</p>` : ""}<small>Tap to continue</small></div>`;
    document.body.appendChild(el); confetti(160);
    if (c.clip) A.play(c.clip);
    let closed = false;
    const close = () => { if (closed) return; closed = true; el.classList.add("out"); setTimeout(() => { el.remove(); celebrations.shift(); done(); if (celebrations.length) showNext(); }, 250); };
    el.onclick = close; setTimeout(close, c.ms || 4000);
  }
}
const planetPic = g => `<span class="corb" style="background:${g.orb}"></span>`;
const STREAKS = [3, 7, 14, 30, 50, 100];
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
// Award stars, celebrate, and play praise. Resolves when the praise finishes,
// or never if the player has left the screen meanwhile (so the old activity doesn't redraw over the new one).
async function award(n, clips) {
  const nav = navId;
  St.touch();
  const math = St.S.subject !== "reading";
  const r = St.addStars(n); refreshStars(); pop("+" + n + " ★");
  if (r.launch) {
    const rk = $("#rocket"); if (rk) rk.classList.add("launch");
    if (r.goal) await celebrate({ kind: "mission", pic: "🚀", title: "Mission complete!", sub: `${St.GOAL} stars today. The rocket blasts off!`, clip: math ? "p_mission2" : "p_mission" });
    else { confetti(110); await A.play("p_bonus"); }
    if (rk) { rk.style.transition = "none"; rk.classList.remove("launch"); void rk.offsetWidth; rk.style.transition = ""; }
  } else await A.play(clips || cheer(), 120);
  if (STREAKS.includes(r.streak)) await celebrate({ kind: "streak", pic: "🔥", title: `${r.streak}-day streak!`, sub: "You played every day. Keep it up!", clip: "p_streak" });
  checkUnlocks();
  if (nav !== navId) return new Promise(() => {});
}
// A planet opens when most activities on the one before have a ✓ (2 or more stars in a round).
const doneCount = (sub, g) => lessons(sub, g).filter(([id]) => St.best(`${sub}:${g}:${id}`) >= 2).length;
const doneNeeded = (sub, g) => Math.ceil(lessons(sub, g).length * 0.7);
function checkUnlocks() {
  D.GRADES.slice(0, -1).forEach((g, i) => {
    const next = D.GRADES[i + 1];
    for (const sub of St.SUBJECTS) if (St.isOpen(sub, g.id) && doneCount(sub, g.id) >= doneNeeded(sub, g.id) && St.unlock(sub, next.id))
      celebrate({ kind: "planet", pic: planetPic(next), title: `New planet: ${next.planet}!`, sub: `${SUBJ[sub][0]} ${SUBJ[sub][1]} ${next.label === "K" ? "Kindergarten" : next.label === "Pre-K" ? "Pre-K" : next.label + " grade"} is open.`, clip: "p_levelup" });
  });
}

// ---------- ROUNDS: each activity is played in short rounds with a finish line ----------
// 10 questions (6 on Pre-K and K), fewer if the activity has fewer different questions; no repeats inside a round.
let round = null;
const ACT_SCREENS = ["sounds", "trace", "ispy", "blend", "build", "match", "tricky", "vocab", "math", "geo"];
function startRound(name, arg) {
  if (!ACT_SCREENS.includes(name)) { round = null; return; }
  const sub = PRACTICE[name] ? name : "reading", act = PRACTICE[name] ? arg : name, g = St.S.grade[sub];
  round = { sub, act, g, total: 0, n: 0, right: 0, seen: new Set(), base: ["prek", "k"].includes(g) ? 6 : 10 };
}
const roundSize = (pool = Infinity) => { if (round && !round.total) round.total = Math.max(1, Math.min(round.base, pool)); };
function pickR(keys, opts) {
  if (!round) return St.pick(keys, opts);
  roundSize(keys.length);
  const fresh = keys.filter(k => !round.seen.has(k)), k = St.pick(fresh.length ? fresh : keys, opts);
  round.seen.add(k); return k;
}
const roundBar = () => round && round.total ? `<div class="roundbar" aria-label="Question ${round.n + 1} of ${round.total}">${Array.from({ length: round.total }, (_, i) => `<i class="${i < round.n ? "done" : i === round.n ? "now" : ""}"></i>`).join("")}</div>` : "";
// one question finished: count it, then the next question or the round's results
function advance(ok, cont) {
  if (!round) return cont();
  round.n++; if (ok) round.right++;
  if (round.n >= round.total) return results();
  cont();
}
const starsFor = (right, total) => { const p = right / total; return p >= .9 ? 3 : p >= .7 ? 2 : p >= .5 ? 1 : 0; };
const starRow = n => `<span class="stars" aria-label="${n} of 3 stars">${[1, 2, 3].map(i => i <= n ? "★" : "☆").join("")}</span>`;
async function results() {
  const r = round, stars = starsFor(r.right, r.total), key = `${r.sub}:${r.g}:${r.act}`, prev = St.best(key);
  St.setBest(key, stars);
  const better = stars > prev, bonus = better ? (stars - prev) * 2 : 0;   // bonus only for beating your best, so replays can't farm stars
  const list = lessons(r.sub, r.g), name = (list.find(([id]) => id === r.act) || [])[2] || "Round";
  const nextAct = [...list.slice(list.findIndex(([id]) => id === r.act) + 1), ...list].find(([id]) => id !== r.act && St.lessonOpen(r.sub, r.g, id) && St.best(`${r.sub}:${r.g}:${id}`) < 2)
    || list[list.findIndex(([id]) => id === r.act) + 1];
  const day = St.today(); (day.rounds || (day.rounds = [])).push({ sub: r.sub, g: r.g, act: r.act, name, stars }); St.save();
  const replay = { ...r }; round = null;
  shell("Round done!", `<section class="card results">
    <p class="prompt big">${esc(name)}</p>
    <div class="bigstars" aria-label="${stars} of 3 stars">${[1, 2, 3].map(i => `<span class="bs ${i <= stars ? "on" : ""}" style="animation-delay:${.25 + i * .35}s">${i <= stars ? "★" : "☆"}</span>`).join("")}</div>
    ${stars >= 2 && prev < 2 ? `<div class="stamp">✓ Checked off!</div>` : ""}
    <p class="score">${r.right} of ${r.total} right the first time</p>
    <p class="prompt">${better ? (prev ? "New best! " : "") + (bonus ? `+${bonus} bonus stars ⭐` : "") : stars >= 2 ? "Great job! Your best is " + prev + " stars." : "Keep practicing. Every round makes you stronger!"}</p>
    ${stars >= 2 ? (prev >= 2 ? `<p class="prompt">✓ Already checked off.</p>` : "") : `<p class="prompt">Get ★★ to check off this activity.</p>`}
    <div class="row"><button class="btn yes big" id="again">↻ Play again</button>${nextAct ? `<button class="btn big" id="nextact">Next: ${esc(nextAct[2])} →</button>` : ""}</div>
    <div class="row"><button class="btn" id="home">🏠 Home</button></div></section>`);
  if (stars === 3) confetti(120);
  const open = (sub, act) => { const hash = sub === "reading" ? act : sub + "-" + act; if (location.hash.slice(1) === hash) route(); else go(...(sub === "reading" ? [act] : [sub, act])); };
  $("#again").onclick = () => open(replay.sub, replay.act);
  if (nextAct) $("#nextact").onclick = () => open(replay.sub, nextAct[0]);
  $("#home").onclick = () => go("home");
  const praise = stars >= 2 && prev < 2 ? "p_checked" : stars === 3 ? "p_round3" : "p_roundbest";
  if (bonus) await award(bonus, [praise]); else { A.play(stars >= 2 ? "p_round" : "p_roundtry"); checkUnlocks(); }
}
const lit = (el, on) => el && el.classList.toggle("on", on);
const partsHTML = (parts, extra = "") => parts.map((p, i) => `<button class="tile ${partClass(p)} ${extra}" data-i="${i}">${esc(p.d)}</button>`).join("");
// play the tiles that make a sound, lighting each one as it plays
function playParts(parts, tiles, gap = 420) {
  const idx = parts.map((p, i) => p.clip ? i : -1).filter(i => i >= 0);
  return A.play(idx.map(i => parts[i].clip), gap, j => tiles.forEach((t, k) => lit(t, k === idx[j])));
}

// ---------- router ----------
const SCREENS = {};
let navId = 0;
function go(name, arg) { A.stop(); location.hash = name === "home" ? "" : name + (arg ? "-" + arg : ""); }
function route() {
  A.stop(); document.onkeydown = null; navId++;
  const h = location.hash.slice(1), [name, ...rest] = h.split("-");
  if (!St.kid() && name !== "newkid") return SCREENS.newkid();
  startRound(name, rest.join("-"));
  (SCREENS[name] || SCREENS.home)(rest.join("-"));
  window.scrollTo(0, 0);
}
addEventListener("hashchange", route);
document.addEventListener("pointerdown", () => St.touch(), { passive: true });

// ---------- HOME ----------
const ACTS = D.ACTS, CHUNK_ACTS = D.CHUNK_ACTS;
// the lessons on a grade: [id, icon, name, description, tag]
function lessons(sub, g) {
  if (PRACTICE[sub]) return PRACTICE[sub].GRADE_SKILLS[g].map(([id, desc, name]) => { const sk = PRACTICE[sub].SK[id]; return [id, sk.ico, name || sk.name, desc, sk.tag]; });
  const l = D.READING[g];
  return l.acts.map(id => [id, ...((l.chunks && CHUNK_ACTS[id]) || ACTS[id])]);
}
// The activity to suggest next: the first unfinished one on this planet, else the one with the fewest stars.
function recommended(sub, g) {
  const list = lessons(sub, g).filter(([id]) => St.lessonOpen(sub, g, id));
  if (!list.length) return null;
  const stars = ([id]) => St.best(`${sub}:${g}:${id}`);
  return list.find(a => stars(a) < 2) || list.reduce((a, b) => stars(b) < stars(a) ? b : a);
}
const openAct = (sub, id) => PRACTICE[sub] ? go(sub, id) : go(id);
const labelClip = name => "lbl_" + D.slug(name);
// Pre-K and K can't read the cards yet: the first tap says the name, a second tap opens it
const young = () => ["prek", "k"].includes(St.S.grade[St.S.subject]);
function talkFirst(el, name, action) {
  el.onclick = () => {
    if (!young() || el.classList.contains("armed")) return action();
    app.querySelectorAll(".armed").forEach(x => x.classList.remove("armed"));
    el.classList.add("armed"); A.play(labelClip(name));
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("armed"), 4000);
  };
}
// press and hold for 2 seconds: the grown-up gate, and safety on settings that change progress
function hold(b, fn, ms = 2000) {
  let t0 = 0, raf = 0;
  const tick = () => { const p = Math.min(1, (Date.now() - t0) / ms); b.style.setProperty("--p", p); if (p >= 1) { cancelAnimationFrame(raf); t0 = 0; b.style.setProperty("--p", 0); fn(); return; } raf = requestAnimationFrame(tick); };
  b.onpointerdown = () => { t0 = Date.now(); raf = requestAnimationFrame(tick); };
  b.onpointerup = b.onpointerleave = b.onpointercancel = () => { cancelAnimationFrame(raf); b.style.setProperty("--p", 0); };
  b.oncontextmenu = e => e.preventDefault();
}
// the suggested activity (next unfinished one) glows and says "▶ Next", right in the grid
function homeActs(next) {
  const sub = St.S.subject, g = St.S.grade[sub];
  return lessons(sub, g).map(([id, ico, name, desc]) => { const locked = !St.lessonOpen(sub, g, id), best = St.best(`${sub}:${g}:${id}`);
    return `<button class="act ${locked ? "locked" : ""} ${best >= 2 ? "checked" : ""} ${id === next ? "next" : ""}" data-id="${id}">${id === next ? `<span class="nextbadge">▶ Next</span>` : ""}<span class="ico">${locked ? "🔒" : ico}</span><b>${name}</b>${young() ? "" : `<small>${desc}</small>`}
      <span class="actfoot">${locked ? "" : starRow(best) + (best >= 2 ? `<span class="check">✓</span>` : "")}</span></button>`; }).join("");
}
SCREENS.home = () => {
  const S = St.S, sub = S.subject, cur = GRADE(S.grade[sub]);
  const rec = recommended(sub, cur.id);
  shell("Sound Rocket", `
    <div class="toprow"><button class="kidchip" id="kids" aria-label="Player: ${esc(St.kid().name)}. Change player"><span>${esc(St.kid().ava)}</span><b>${esc(St.kid().name)}</b><small>⇄ Change</small></button>
      <button class="help" id="help" aria-label="How to play">❓</button></div>
    <div class="subjects" role="tablist" aria-label="Subject">
      ${St.SUBJECTS.map(x => `<button role="tab" data-s="${x}" aria-selected="${sub === x}"><span class="si">${SUBJ[x][0]}</span><span>${SUBJ[x][1]}</span></button>`).join("")}</div>
    <div class="planets" role="group" aria-label="Choose a grade">${D.GRADES.map(g => {
      const locked = !St.anyLesson(sub, g.id);
      return `<button class="planet ${locked ? "locked" : ""}" data-l="${g.id}" aria-pressed="${g.id === cur.id}" aria-label="${g.label}, ${g.planet}${locked ? ", locked" : ""}">
        <span class="orb" style="background:${g.orb}"></span><b>${locked ? "🔒 " : ""}${g.label}</b><small>${g.planet}</small></button>`;
    }).join("")}</div>
    <div class="acts">${homeActs(rec && rec[0])}</div>
    ${nextPlanetBar(sub)}
    <button class="grownup hold" id="prog">👪 Grown-ups: press and hold</button>`, { home: true });
  app.querySelectorAll(".subjects button").forEach(b => talkFirst(b, SUBJ[b.dataset.s][1], () => { St.setSubject(b.dataset.s); SCREENS.home(); }));
  app.querySelectorAll(".planet").forEach(b => b.onclick = () => {
    if (!St.anyLesson(sub, b.dataset.l)) { toast("Earn more stars to fly here. A grown-up can unlock it.", 3200); return; }
    St.setLevel(sub, b.dataset.l); SCREENS.home();
  });
  const names = Object.fromEntries(lessons(sub, cur.id).map(([id, , name]) => [id, name]));
  app.querySelectorAll(".act").forEach(b => b.classList.contains("locked")
    ? b.onclick = () => toast("This one is locked. A grown-up can unlock it.", 3000)
    : talkFirst(b, names[b.dataset.id], () => openAct(sub, b.dataset.id)));
  const pg = $("#prog"); hold(pg, () => go("progress")); pg.onclick = () => toast("Grown-ups: press and hold the button for 2 seconds.", 2600);
  $("#kids").onclick = () => go("kids");
  $("#help").onclick = () => go("howto");
};

// How close the next locked planet is: progress is earned on the planet just before it.
function nextPlanetBar(sub) {
  const i = D.GRADES.findIndex(g => !St.isOpen(sub, g.id));
  if (i < 0) return `<div class="nextbar done"><span>🏆 Every ${SUBJ[sub][1].toLowerCase()} planet is open!</span></div>`;
  const next = D.GRADES[i], prev = D.GRADES[i - 1];
  const of = doneNeeded(sub, prev.id), n = Math.min(doneCount(sub, prev.id), of), what = "activities with ✓ (2 stars)";
  const here = St.S.grade[sub] === prev.id;
  return `<div class="nextbar" role="group" aria-label="Next planet">
    <span class="orb" style="background:${next.orb}"></span>
    <div><b>Next planet: ${next.planet} (${next.label})</b>
      <div class="meter"><i style="width:${n / of * 100}%"></i></div>
      <small>${n} of ${of} ${what}${here ? "" : ` on ${prev.planet} (${prev.label})`}</small></div></div>`;
}

// ---------- HOW TO PLAY ----------
SCREENS.howto = () => {
  const steps = [
    ["📚", "Pick a subject", "Reading, Math or Geography. Tap the tabs at the top of the home screen."],
    ["🪐", "Pick a planet", "Each planet is a grade, from the Moon (Pre-K) to Pluto (5th grade). A 🔒 planet isn't open yet."],
    ["👆", "Play an activity", "Tap a card. The one marked ▶ Next is a good one to do now. On Pre-K and K, the first tap says the card's name and the second tap opens it. Tap 🔊 Hear it any time to hear the question again."],
    ["⭐", "Earn stars", "Right answers earn stars. Wrong answers never take stars away: just try again."],
    ["🏁", "Finish rounds", "Each activity is a short round of questions (the dots at the top show how many are left). At the end you get up to 3 stars: ★★ or more checks it off ✓. Play again any time to beat your best."],
    ["🚀", "Fill the rocket", "The bar at the top fills with today's stars. 20 stars is today's mission: the rocket blasts off! Keep going for bonus blast-offs. Play every day to grow your streak 🔥."],
    ["🔓", "Open new planets", "Check off most activities on a planet and the next planet opens. The Next planet bar on the home screen shows how many you've done."],
    ["👪", "For grown-ups", "Press and hold 👪 Grown-ups at the bottom of the home screen for a weekly summary, what your child needs help with, grades and lessons, players and backups."]
  ];
  shell("How to play", `<div class="panel howto">${steps.map(([ico, h, t], i) => `<div class="step"><span class="ico">${ico}</span><div><b>${i + 1}. ${h}</b><p>${t}</p></div></div>`).join("")}
    <button class="btn yes big" id="gotit">Got it! Let's play 🚀</button></div>`);
  try { localStorage.setItem("soundRocket.howto", "1"); } catch (e) {}
  $("#gotit").onclick = () => go("home");
};

// ---------- PLAYERS: one profile per child, each with their own progress ----------
const AVAS = ["🚀", "🦊", "🐼", "🦄", "🐸", "🦁", "🐙", "🦖", "🐧", "🐝", "🌟", "🐬"];
const gradeName = g => g.label === "K" ? "Kindergarten" : g.label === "Pre-K" ? "Pre-K" : g.label + " grade";
SCREENS.kids = () => {
  shell("Who's playing?", `
    <div class="kidlist">${St.kids().map(k => { const s = k.id === St.kid().id;
      return `<button class="kidcard ${s ? "on" : ""}" data-k="${k.id}"><span class="ava">${esc(k.ava)}</span><b>${esc(k.name)}</b>${s ? "<small>Playing now</small>" : ""}</button>`; }).join("")}
      <button class="kidcard add" id="add"><span class="ava">＋</span><b>Add a child</b></button></div>
    <div class="panel"><p>Each child has their own stars, planets and progress on this device. A grown-up can change a child's grades, unlock lessons, back up or remove a child in the grown-ups area (👪 at the bottom of the home screen).</p></div>`);
  app.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { St.switchKid(b.dataset.k); go("home"); });
  $("#add").onclick = () => go("newkid");
};
SCREENS.newkid = () => {
  const first = !St.kid(), pick = { ava: AVAS.find(a => !St.kids().some(k => k.ava === a)) || AVAS[0], reading: "prek", math: "prek", geo: "prek" };
  const gradeRow = sub => `<div class="levels" data-sub="${sub}">${D.GRADES.map(g => `<button data-g="${g.id}" aria-pressed="${g.id === pick[sub]}">${g.label}</button>`).join("")}</div><p class="hint" id="hint-${sub}"></p>`;
  shell(first ? "Welcome!" : "Add a child", `
    <div class="panel setup">
      ${first ? `<p>Sound Rocket teaches reading and math from Pre-K to 5th grade. Set up a player for each child; everyone's progress is kept separately on this device.</p>` : ""}
      <label for="nm"><b>Child's name</b></label>
      <input id="nm" maxlength="20" autocomplete="off" placeholder="Name" value="">
      <p><b>Pick a picture</b></p>
      <div class="avas">${AVAS.map(a => `<button data-a="${a}" aria-pressed="${a === pick.ava}">${a}</button>`).join("")}</div>
      <p><b>📖 Start reading at</b></p>${gradeRow("reading")}
      <p><b>🔢 Start math at</b></p>${gradeRow("math")}
      <p><b>🌍 Start geography at</b></p>${gradeRow("geo")}
      <p>Grades before the starting one stay open for review. You can change this any time in the grown-ups area (👪 at the bottom of the home screen).</p>
      <button class="btn yes big" id="go">Let's go! 🚀</button>
      ${first ? `<label class="btn" id="restore">Restore a backup<input type="file" accept=".json,application/json" hidden></label>` : ""}
    </div>`, { home: first });
  const hint = sub => { const g = GRADE(pick[sub]); $("#hint-" + sub).textContent = `${g.planet} · ${gradeName(g)}: ${sub === "reading" ? D.READING[g.id].blurb : PRACTICE[sub].GRADE_SKILLS[g.id].map(([, d]) => d).slice(0, 3).join(", ")}`; };
  St.SUBJECTS.forEach(hint);
  app.querySelectorAll(".levels button").forEach(b => b.onclick = () => {
    const sub = b.parentElement.dataset.sub; pick[sub] = b.dataset.g;
    b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); hint(sub);
  });
  app.querySelectorAll(".avas button").forEach(b => b.onclick = () => { pick.ava = b.dataset.a; app.querySelectorAll(".avas button").forEach(x => x.setAttribute("aria-pressed", x === b)); });
  $("#go").onclick = () => {
    const name = $("#nm").value.trim();
    if (!name) { $("#nm").focus(); $("#nm").classList.add("bad"); return; }
    St.addKid(name, pick.ava, pick);
    let seen = false; try { seen = !!localStorage.getItem("soundRocket.howto"); } catch (e) {}
    go(seen ? "home" : "howto"); route();
  };
  const r = app.querySelector("#restore input"); if (r) r.onchange = () => restoreFile(r.files[0]);
};
function restoreFile(f) {
  if (!f) return;
  f.text().then(t => { St.importKid(t); toast("Progress restored!"); go("home"); route(); }).catch(() => toast("That file isn't a Sound Rocket backup."));
}

// ---------- SOUND CARDS: Montessori three-period lesson ----------
// 1 "This is /s/" (naming), 2 "Show me /s/" (recognition), 3 "What sound is this?" (recall)
SCREENS.sounds = () => {
  const pool = levelSounds(); if (!pool.length) return go("home");
  const k = pickR(pool.map(s => "snd:" + s));
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
      if (fromP1) soundP3(s, k, pool); else advance(miss === 0, SCREENS.sounds);
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
  let helped = false;
  $("#ok").onclick = async () => { St.grade(k, !helped, "sounds"); await award(1); advance(!helped, SCREENS.sounds); };
  $("#help").onclick = async () => { helped = true; St.grade(k, false, "sounds"); const [, kw] = D.SOUNDS[s]; lit(t, true); await A.play([SN(s), "p_like", W(kw), SN(s)], 200); lit(t, false); };
  $("#skip").onclick = () => advance(false, SCREENS.sounds);
}

// ---------- TRACE IT: sandpaper letters (and sandpaper numerals in math) ----------
SCREENS.trace = () => {
  const pool = levelSounds(); if (!pool.length) return go("home");
  const k = pickR(pool.map(s => "trace:" + s));
  const s = k.slice(6), [disp, kw, pic] = D.SOUNDS[s];
  traceScreen({ title: "Trace It", prompt: "Trace the letter with your finger. Say the sound as you trace.", disp, vowel: isVowel(s),
    kw: `<span>${pic}</span> ${disp}… like ${kw}`, say: ["p_trace", SN(s)], hear: [SN(s), "p_like", W(kw)], clip: SN(s), skipLabel: "Next letter",
    done: async () => { St.grade(k, true, "trace"); await award(1, [SN(s), cheer()]); }, next: () => SCREENS.trace() });
};
function traceScreen(o) {
  const disp = o.disp;
  shell(o.title, `<section class="card">
    <p class="prompt">${o.prompt}</p>
    <canvas class="trace" id="cv" aria-label="Tracing area for ${esc(disp)}"></canvas>
    ${o.kw ? `<div class="kw">${o.kw}</div>` : ""}
    <div class="row"><button class="btn" id="hear">🔊 Hear it</button><button class="btn" id="clear">Clear</button><button class="btn" id="skip">${o.skipLabel}</button></div></section>`);
  A.play(o.say, 200);
  $("#hear").onclick = () => A.play(o.hear, 150);
  $("#skip").onclick = () => advance(false, o.next);
  const cv = $("#cv"), dpr = Math.min(2, devicePixelRatio || 1);
  const size = cv.getBoundingClientRect().width; cv.width = cv.height = Math.round(size * dpr);
  const g = cv.getContext("2d"), mask = document.createElement("canvas"); mask.width = mask.height = cv.width;
  const m = mask.getContext("2d", { willReadFrequently: true });
  const fontPx = cv.width * (disp.length > 2 ? .4 : disp.length > 1 ? .5 : .72);
  const drawLetter = (ctx, color) => { ctx.fillStyle = color; ctx.font = `700 ${fontPx}px Andika, "Century Gothic", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(disp, cv.width / 2, cv.height * .53); };
  function base() {
    g.clearRect(0, 0, cv.width, cv.height);
    // sandpaper texture: speckled letter
    drawLetter(g, o.vowel ? "#BFD3FB" : "#F7C3C3");
    g.globalCompositeOperation = "source-atop";
    for (let i = 0; i < 2500; i++) { g.fillStyle = Math.random() < .5 ? "#0001" : "#fff6"; g.fillRect(Math.random() * cv.width, Math.random() * cv.height, 2 * dpr, 2 * dpr); }
    g.globalCompositeOperation = "source-over";
  }
  // the letter's pixels are read once (and again if the font loads late), not on every finger move
  let maskData = null, total = 0;
  const readMask = () => { maskData = m.getImageData(0, 0, mask.width, mask.height).data; total = 0; };
  document.fonts && document.fonts.ready.then(() => { base(); m.clearRect(0, 0, mask.width, mask.height); drawLetter(m, "#000"); maskData = null; });
  base(); drawLetter(m, "#000");
  const ink = o.vowel ? "#2563EB" : "#DC3B3B";
  let down = false, last = null, done = false, hits = new Set(), rect = null;
  const grid = 14 * dpr;
  function at(e) { const r = rect || cv.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; }
  function stroke(p) {
    g.strokeStyle = ink; g.lineWidth = 16 * dpr; g.lineCap = "round"; g.lineJoin = "round";
    g.beginPath(); g.moveTo(...(last || p)); g.lineTo(...p); g.stroke(); last = p;
    // count letter cells covered
    if (!maskData) readMask();
    const x = p[0] | 0, y = p[1] | 0;
    if (x >= 0 && y >= 0 && x < mask.width && y < mask.height && maskData[(y * mask.width + x) * 4 + 3] > 0) hits.add(((x / grid) | 0) + "," + ((y / grid) | 0));
  }
  cv.onpointerdown = e => { down = true; last = null; rect = cv.getBoundingClientRect(); cv.setPointerCapture(e.pointerId); stroke(at(e)); if (!hits.size) A.play(o.clip); };
  cv.onpointermove = e => { if (down) stroke(at(e)); };
  cv.onpointerup = cv.onpointercancel = async () => {
    down = false; last = null; rect = null;
    if (!maskData) readMask();
    if (!total) { // letter cells in the mask
      const d = maskData, cells = new Set();
      for (let y = 0; y < mask.height; y += 4) for (let x = 0; x < mask.width; x += 4) if (d[(y * mask.width + x) * 4 + 3] > 0) cells.add(((x / grid) | 0) + "," + ((y / grid) | 0));
      total = cells.size;
    }
    if (!done && hits.size / total > .55) {
      done = true; await o.done();
      await wait(400); advance(true, o.next);
    }
  };
  $("#clear").onclick = () => { base(); hits = new Set(); done = false; };
}

// ---------- I SPY: beginning sounds ----------
SCREENS.ispy = () => {
  const words = Object.keys(PICS).filter(w => !["x", "ck", "ng"].includes(firstSound(w)));
  const bySound = {};
  words.forEach(w => (bySound[firstSound(w)] ||= []).push(w));
  const allowed = new Set((rgrade() === "g1" ? [...D.PINK_SOUNDS, ...D.GREEN_SOUNDS] : levelSounds()).map(soundGroup));
  const sounds = Object.keys(bySound).filter(s => allowed.has(s));
  const k = pickR(sounds.map(s => "spy:" + s), { ordered: false });
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
  $("#skip").onclick = () => advance(false, SCREENS.ispy);
  let miss = 0;
  app.querySelectorAll(".choice").forEach(b => b.onclick = async () => {
    const w = b.dataset.w;
    if (w === target) {
      b.classList.add("good"); St.grade(k, miss === 0, "ispy");
      await award(miss ? 1 : 2, [W(w), SN(s), cheer()]); advance(miss === 0, SCREENS.ispy);
    } else {
      miss++; b.classList.add("bad");
      await A.play(["p_thats", W(w), "p_notquite"], 150); ask();
    }
  });
};

// ---------- BLEND IT: sound out with a grown-up (Chunk It from 3rd grade) ----------
SCREENS.blend = (group) => {
  const l = level(), groups = Object.keys(l.words); if (!groups.length) return go("home");
  if (!groups.includes(group)) group = "all";
  const list = group === "all" ? levelWords(l) : l.words[group];
  const k = pickR(list.map(([w]) => "word:" + w), { maxNew: 4, ordered: false });
  const w = k.slice(5), pic = PICS[w] || "", parts = wordParts(l, w), chunks = !!l.chunks;
  shell(chunks ? "Chunk It" : "Blend It", `<section class="card">
    <div class="levels">${["all", ...groups].map(g => `<button aria-pressed="${g === group}" data-g="${esc(g)}">${g === "all" ? "Mix" : esc(g)}</button>`).join("")}</div>
    <p class="prompt">${chunks ? "Tap each chunk and say it. Then read the whole word!" : "Tap each letter and say its sound. Then slide them together!"}</p>
    <div class="tiles" id="tiles">${partsHTML(parts, chunks ? "sm" : "")}</div>
    <div class="slide"><b id="sl"></b></div>
    <div class="pic" id="pic" aria-hidden="true"></div>
    <div class="row"><button class="btn" id="slow">👣 ${chunks ? "Chunk it" : "Sound it out"}</button>${chunks ? "" : `<button class="btn" id="stretch">🐍 Stretch it</button>`}<button class="btn" id="whole">🔊 Word</button></div>
    <div class="grown"><p>Grown-up taps</p><div class="row">
      <button class="btn yes" id="snd">Said the ${chunks ? "chunks" : "sounds"} +1</button><button class="btn yes big" id="rd">Read the word! +2</button></div>
      <div class="row"><button class="btn try" id="again">Try together</button><button class="btn" id="skip">Next word</button></div></div></section>`);
  app.querySelectorAll(".levels button").forEach(b => b.onclick = () => SCREENS.blend(b.dataset.g));
  A.preload([...parts.map(p => p.clip).filter(Boolean), W(w), ...(chunks ? [] : ["st_" + w])]);
  const tiles = [...app.querySelectorAll("#tiles .tile")], seen = new Set();
  const mark = () => $("#sl").style.width = (seen.size / parts.length * 100) + "%";
  const clear = () => tiles.forEach(t => lit(t, false));
  tiles.forEach(t => t.onclick = async () => { const i = +t.dataset.i; clear(); lit(t, true); seen.add(i); mark(); await A.play(parts[i].clip || "p_silent"); lit(t, false); });
  async function soundOut() {
    parts.forEach((_, i) => seen.add(i)); mark();
    const ok = await playParts(parts, tiles, chunks ? 300 : 420);
    if (!ok) return; clear(); await wait(300); tiles.forEach(t => lit(t, true));
    if (!chunks) { await A.play("st_" + w); await wait(250); }
    await A.play(W(w)); clear();
  }
  $("#slow").onclick = soundOut;
  if (!chunks) $("#stretch").onclick = async () => { tiles.forEach(t => lit(t, true)); await A.play("st_" + w); clear(); };
  $("#whole").onclick = async () => { tiles.forEach(t => lit(t, true)); await A.play(W(w)); clear(); };
  let soundsDone = false, helped = false;
  $("#snd").onclick = async () => { if (soundsDone) return; soundsDone = true; $("#snd").disabled = true; await award(1, chunks ? "p_chunks" : "p_goodsounds"); };
  $("#rd").onclick = async () => { $("#pic").textContent = pic || "✅"; St.grade(k, !helped, "blend"); await award(2, [cheer(), W(w)]); await wait(300); advance(!helped, () => SCREENS.blend(group)); };
  $("#again").onclick = async () => { helped = true; if (await A.play("p_together")) soundOut(); };
  $("#skip").onclick = () => advance(false, () => SCREENS.blend(group));
};

// ---------- BUILD A WORD: movable alphabet (syllable tiles from 3rd grade) ----------
SCREENS.build = () => {
  const l = level(), chunks = !!l.chunks, list = levelWords(l).filter(([w]) => chunks || PICS[w]);
  if (!list.length) return go("home");
  const k = pickR(list.map(([w]) => "build:" + w), { ordered: false });
  const w = k.slice(6), parts = wordParts(l, w);
  // spare tiles come from the other words on this planet
  const spare = new Map(); levelWords(l).forEach(([, , ps]) => ps.forEach(p => { if (!parts.some(q => q.d === p.d) && p.clip) spare.set(p.d, p); }));
  const extras = St.sample([...spare.values()], parts.length > 3 ? 3 : 2);
  const tray = St.shuffle([...parts, ...extras]);
  shell("Build a Word", `<section class="card">
    <p class="prompt big">Build the word</p>
    <button class="pic" id="pic" style="background:none;border:none;cursor:pointer" aria-label="Hear the word">${PICS[w] || "🔊"}</button>
    <div class="boxes" id="boxes">${parts.map((p, i) => `<div class="box ${chunks ? "wide" : ""}" data-i="${i}"></div>`).join("")}</div>
    <div class="tiles" id="tray">${tray.map((t, i) => `<button class="tile sm ${partClass(t)}" data-i="${i}">${esc(t.d)}</button>`).join("")}</div>
    <div class="row"><button class="btn" id="hear">🔊 Hear the word</button><button class="btn" id="hint">💡 Next ${chunks ? "chunk" : "sound"}</button><button class="btn" id="skip">Skip</button></div></section>`);
  A.preload([W(w), ...tray.map(t => t.clip).filter(Boolean)]);
  const say = () => A.play(["p_build", W(w)], 150);
  say(); $("#hear").onclick = () => A.play(W(w)); $("#pic").onclick = () => A.play(W(w));
  $("#skip").onclick = () => advance(false, SCREENS.build);
  let pos = 0, miss = 0;
  const boxes = [...app.querySelectorAll(".box")];
  $("#hint").onclick = () => { miss++; A.play(parts[pos].clip || "p_silent"); };
  app.querySelectorAll("#tray .tile").forEach(b => b.onclick = async () => {
    const t = tray[+b.dataset.i];
    if (t.d === parts[pos].d) {
      boxes[pos].textContent = t.d; boxes[pos].classList.add("filled", partClass(parts[pos])); b.classList.add("used");
      pos++;
      if (pos === parts.length) {
        St.grade(k, miss <= 1, "build");
        boxes.forEach(x => x.classList.add("on"));
        const idx = parts.map((p, i) => p.clip ? i : -1).filter(i => i >= 0);
        await A.play(idx.map(i => parts[i].clip), 250, j => boxes.forEach((x, i) => x.style.transform = i === idx[j] ? "translateY(-6px)" : ""));
        boxes.forEach(x => x.style.transform = "");
        await award(miss <= 1 ? 3 : 2, [W(w), cheer()]); await wait(300); advance(miss <= 1, SCREENS.build);
      } else if (t.clip) A.play(t.clip);
    } else {
      miss++; b.classList.remove("wiggle"); void b.offsetWidth; b.classList.add("wiggle");
      await A.play([t.clip, "p_notquite"].filter(Boolean), 150);
    }
  });
};

// ---------- READ & MATCH ----------
SCREENS.match = () => {
  const l = level(), list = levelWords(l).filter(([w]) => PICS[w]);
  if (!list.length) return go("home");
  const k = pickR(list.map(([w]) => "match:" + w), { ordered: false });
  const w = k.slice(6), parts = wordParts(l, w);
  const all = Object.keys(PICS).filter(x => x !== w && PICS[x] !== PICS[w]);
  // distractors that look alike (same first or last letter) make it real reading, not guessing
  const alike = St.shuffle(all.filter(x => x[0] === w[0] || x.slice(-1) === w.slice(-1) || x.length === w.length));
  const ds = []; for (const x of [...alike, ...St.shuffle(all)]) if (ds.length < 2 && !ds.includes(x) && !ds.some(y => PICS[y] === PICS[x])) ds.push(x);
  const opts = St.shuffle([w, ...ds]);
  shell("Read & Match", `<section class="card">
    <p class="prompt">Read the word. Which picture is it?</p>
    <div class="tiles" id="tiles">${partsHTML(parts, "sm")}</div>
    <div class="choices">${opts.map(x => `<button class="choice" data-w="${x}" aria-label="picture">${PICS[x]}</button>`).join("")}</div>
    <div class="row"><button class="btn" id="help">👣 Help me sound it out</button><button class="btn" id="skip">Skip</button></div></section>`);
  const tiles = [...app.querySelectorAll("#tiles .tile")];
  tiles.forEach(t => t.onclick = async () => { lit(t, true); await A.play(parts[+t.dataset.i].clip || "p_silent"); lit(t, false); });
  let helped = false, miss = 0;
  $("#help").onclick = async () => { helped = true; await playParts(parts, tiles); tiles.forEach(t => lit(t, false)); };
  $("#skip").onclick = () => advance(false, SCREENS.match);
  app.querySelectorAll(".choice").forEach(b => b.onclick = async () => {
    if (b.dataset.w === w) {
      b.classList.add("good"); St.grade(k, !helped && !miss, "match"); St.grade("word:" + w, !helped && !miss);
      await award(!helped && !miss ? 2 : 1, [W(w), cheer()]); advance(!helped && !miss, SCREENS.match);
    } else { miss++; b.classList.add("bad"); await A.play(["p_thats", W(b.dataset.w), "p_notquite"], 150); }
  });
};

// ---------- TRICKY WORDS ----------
SCREENS.tricky = () => {
  const list = level().tricky; if (!list.length) return go("home");
  const k = pickR(list.map(w => "tricky:" + w), { maxNew: 2 });
  const w = k.slice(7);
  shell("Tricky Words", `<section class="card">
    <p class="prompt">Tricky word! You can't sound this one out. Do you know it?</p>
    <button class="tile word" id="t">${esc(w)}</button>
    <p class="prompt" style="font-size:1rem">Look at it, say it, then close your eyes and see it.</p>
    <div class="grown"><p>Grown-up taps</p><div class="row">
      <button class="btn yes big" id="ok">Knew it! +1</button><button class="btn try" id="learn">Learn it</button><button class="btn" id="skip">Skip</button></div></div></section>`);
  const t = $("#t");
  t.onclick = async () => { lit(t, true); await A.play(W(w)); lit(t, false); };
  let learned = false;
  $("#ok").onclick = async () => { St.grade(k, !learned, "tricky"); await award(1); advance(!learned, SCREENS.tricky); };
  $("#learn").onclick = async () => { learned = true; St.grade(k, false, "tricky"); lit(t, true); await A.play(["p_thisword", W(w), W(w)], 450); lit(t, false); };
  $("#skip").onclick = () => advance(false, SCREENS.tricky);
};

// ---------- WORD MEANING (3rd to 5th grade vocabulary) ----------
SCREENS.vocab = () => {
  const list = level().vocab; if (!list.length) return go("home");
  const k = pickR(list.map(([w]) => "vocab:" + w), { ordered: false });
  const w = k.slice(6), [, def] = list.find(([x]) => x === w);
  const opts = St.shuffle([[w, def], ...St.sample(list.filter(([x]) => x !== w), 2)]);
  shell("Word Meaning", `<section class="card">
    <p class="prompt">Read the word. What does it mean?</p>
    <button class="tile word" id="t">${esc(w)}</button>
    <div class="defs">${opts.map(([x, d]) => `<div class="def"><button class="choice text" data-w="${esc(x)}">${esc(d)}</button><button class="say" data-say="${esc(x)}" aria-label="Hear this meaning">🔊</button></div>`).join("")}</div>
    <div class="row"><button class="btn" id="hear">🔊 Hear the word</button><button class="btn" id="skip">Skip</button></div></section>`);
  const t = $("#t"), hearWord = async () => { lit(t, true); await A.play(W(w)); lit(t, false); };
  t.onclick = hearWord; $("#hear").onclick = hearWord;
  A.play(["p_meaning"]);
  $("#skip").onclick = () => advance(false, SCREENS.vocab);
  app.querySelectorAll(".say").forEach(b => b.onclick = () => A.play("d_" + D.slug(b.dataset.say)));
  let miss = 0;
  app.querySelectorAll(".choice").forEach(b => b.onclick = async () => {
    if (b.dataset.w === w) {
      b.classList.add("good"); St.grade(k, !miss, "vocab");
      await award(miss ? 1 : 2, [W(w), "d_" + D.slug(w), cheer()]); advance(!miss, SCREENS.vocab);
    } else { miss++; b.classList.add("bad"); await A.play("p_notquite"); }
  });
};

// ---------- STORYBOOK ----------
const answerClip = (st, i) => /^[a-z]+$/i.test(st.q[1][i][0]) ? W(st.q[1][i][0]) : `ans_${st.id}_${i}`;
SCREENS.stories = () => {
  const S = St.S;
  const books = D.STORIES.slice().sort((a, b) => gradeIndex(a.level) - gradeIndex(b.level));
  shell("Storybook", `
    <div class="panel"><p>Read the story to yourself. Tap any word you get stuck on to hear it. Words underlined in yellow are tricky words.</p></div>
    <div class="shelf">${books.map(b => {
      const g = GRADE(b.level), read = S.stories[b.id];
      const locked = !St.lessonOpen("reading", b.level, "stories");
      return `<button class="book" style="border-left-color:${g.color}" data-id="${b.id}"><span class="cv">${b.cover}</span><b>${esc(b.title)}</b>
        <small>${locked ? "🔒 " : ""}${g.label} · ${g.planet}${read ? ` · read ${read.times}×` : ""}</small></button>`;
    }).join("")}</div>`);
  app.querySelectorAll(".book").forEach(b => b.onclick = () => {
    const st = D.STORIES.find(s => s.id === b.dataset.id);
    if (!St.lessonOpen("reading", st.level, "stories")) { toast("This story is on a planet you haven't reached yet.", 3000); return; }
    go("story", st.id);
  });
};
SCREENS.story = (id) => {
  const st = D.STORIES.find(s => s.id === id); if (!st) return go("stories");
  let page = 0, helpWords = new Set();
  const long = gradeIndex(st.level) >= 4;
  const draw = () => {
    if (page >= st.pages.length) return question();
    const [text, ill] = st.pages[page];
    const words = text.split(/\s+/);
    shell(esc(st.title), `<section class="card">
      <div class="illus" aria-hidden="true">${ill}</div>
      <div class="page ${long ? "long" : ""}" id="pg">${words.map((tok, i) => {
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
    $("#next").onclick = async e => { e.currentTarget.disabled = true; St.touch(); if (page < st.pages.length - 1) await award(1, "p_nice"); page++; draw(); };
  };
  const question = () => {
    const [q, answers] = st.q, opts = St.shuffle(answers.map((a, i) => [...a, i]));
    const text = answers.some(([a]) => a.includes(" "));
    shell(esc(st.title), `<section class="card">
      <p class="prompt big">${esc(q)}</p>
      <div class="${text ? "defs" : "choices"}">${opts.map(([w, p, i]) => text
        ? `<button class="choice text" data-i="${i}"><span class="emo">${p}</span> ${esc(w)}</button>`
        : `<button class="choice" data-i="${i}" aria-label="${esc(w)}">${p}</button>`).join("")}</div>
      <div class="row"><button class="btn" id="hear">🔊 Hear the question</button></div></section>`);
    A.play("q_" + st.id); $("#hear").onclick = () => A.play("q_" + st.id);
    app.querySelectorAll(".choice").forEach(b => b.onclick = async () => {
      const i = +b.dataset.i;
      if (i === 0) {
        b.classList.add("good");
        // words they needed help with come back sooner in practice
        const lw = levelWords(D.READING[st.level]);
        helpWords.forEach(w => { if (lw.some(([x]) => x === w)) St.grade("word:" + w, false); });
        St.storyRead(st.id); St.today().acts.stories = (St.today().acts.stories || 0) + 1;
        const mine = D.STORIES.filter(x => x.level === st.level), read = mine.filter(x => St.S.stories[x.id]).length;
        St.setBest(`reading:${st.level}:stories`, read >= mine.length ? 3 : Math.min(2, read));
        confetti(120); await award(5, [answerClip(st, 0), "p_finished"]);
        go("stories");
      } else { b.classList.add("bad"); await A.play(["p_thats", answerClip(st, i), "p_notquite"], 150); }
    });
  };
  draw();
};

// ---------- MATH ----------
// The practice screen for math and geography: multiple choice or a number pad, two tries, then the answer.
SCREENS.math = id => practice("math", id);
SCREENS.geo = id => practice("geo", id);
function practice(sub, id) {
  const P = PRACTICE[sub], g = St.S.grade[sub], sk = P.SK[id], entry = P.GRADE_SKILLS[g].find(e => e[0] === id);
  if (!sk || !entry) return go("home");
  St.setSubject(sub);
  if (sub === "math" && id === "numcards") return numberCards(g);
  if (sub === "math" && id === "tracenum") return traceNumber(g);
  const keys = sk.keys ? sk.keys(g) : null;
  const key = keys ? pickR(keys, { maxNew: 4 }) : (roundSize(), `${sub === "math" ? "m" : "g"}:${id}:${g}`);
  const p = sk.gen(g, keys ? key : null);
  shell(entry[2] || sk.name, `<section class="card math">
    <p class="prompt big">${p.q}</p>
    ${p.vis ? `<div class="mvis">${p.vis}</div>` : ""}
    ${p.choices ? `<div class="mchoices ${p.wide ? "wide" : ""} ${p.maps ? "maps" : ""} ${p.choices.some(c => !/[<]/.test(c.html) && c.html.length > 10) ? "long" : ""}">${p.choices.map((c, i) => `<button class="mchoice" data-i="${i}">${c.html}</button>`).join("")}</div>`
      : `<div class="pad"><output class="padout" id="out" aria-live="polite"></output><div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, p.pad.dec ? "." : "", 0, "⌫"].map(k => k === "" ? "<span></span>" : `<button class="key" data-k="${k}">${k}</button>`).join("")}</div>
        <button class="btn yes big" id="check">Check ✓</button></div>`}
    <div class="row"><button class="btn" id="hear">🔊 Hear it</button><button class="btn" id="skip">Skip</button></div></section>`);
  const ask = () => A.play(p.say, 90);
  const again = () => practice(sub, id);
  ask(); $("#hear").onclick = ask; $("#skip").onclick = () => advance(false, again);
  let miss = 0, busy = false;
  const right = async () => {
    busy = true; const first = miss === 0;
    St.grade(key, first, sub);
    await award(first ? 2 : 1, [...(p.after || []), cheer()].filter(Boolean)); await wait(250); advance(first, again);
  };
  // after two misses, show the answer and move on: no stars lost, and it comes back sooner
  const reveal = async () => {
    busy = true; St.grade(key, false, sub);
    const row = document.createElement("div"); row.className = "reveal";
    row.innerHTML = `<p>The answer is <b>${p.choices ? p.choices.find(c => c.v === p.ans).html : esc(p.ans)}</b></p><button class="btn yes big" id="nextq">Next →</button>`;
    app.querySelector(".card").appendChild(row);
    $("#nextq").onclick = () => advance(false, again);
    await A.play(["p_answeris", ...(p.after || M.N(+p.ans))], 90);
  };
  if (p.choices) {
    app.querySelectorAll(".mchoice").forEach(b => b.onclick = async () => {
      if (busy || b.classList.contains("bad")) return;
      const c = p.choices[+b.dataset.i];
      if (c.v === p.ans) { b.classList.add("good"); right(); }
      else { miss++; b.classList.add("bad"); if (miss >= 2 && p.choices.length > 2) { app.querySelectorAll(".mchoice").forEach((x, i) => p.choices[i].v === p.ans && x.classList.add("good")); reveal(); }
        else await A.play([...(c.say || []), "p_notquite"], 120); }
    });
  } else {
    const out = $("#out"); let val = "";
    const show = () => { out.textContent = val; out.classList.remove("bad"); };
    const press = k => {
      if (busy) return;
      if (k === "⌫") val = val.slice(0, -1);
      else if (k === "." ) { if (p.pad.dec && !val.includes(".")) val = (val || "0") + "."; }
      else if (val.length < 9) val = val === "0" ? String(k) : val + k;
      show();
    };
    const check = async () => {
      if (busy || !val || val === ".") return;
      if (Math.abs(parseFloat(val) - parseFloat(p.ans)) < 1e-9) { out.classList.add("good"); right(); return; }
      miss++; out.classList.add("bad");
      if (miss >= 2) { val = ""; reveal(); return; }
      await A.play("p_notquite");
      val = ""; show();
    };
    app.querySelectorAll(".key").forEach(b => b.onclick = () => press(b.dataset.k));
    $("#check").onclick = check;
    document.onkeydown = e => {
      if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === "." && p.pad.dec) press(".");
      else if (e.key === "Backspace") press("⌫"); else if (e.key === "Enter") check(); else return;
      e.preventDefault();
    };
  }
};

// Number cards: the Montessori three-period lesson with numerals and quantities
function numberCards(g) {
  const keys = M.SK.numcards.keys(g), k = pickR(keys), n = +k.split(":")[2], it = St.item(k);
  const period = !it.seen ? 1 : (it.box >= 2 ? (Math.random() < .65 ? 3 : 2) : (Math.random() < .6 ? 2 : 3));
  const pool = keys.map(x => +x.split(":")[2]), e = M.EMOJI[n % M.EMOJI.length];
  shell("Number Cards", `<section class="card" id="card"></section>`);
  const card = $("#card"), next = () => numberCards(g), say = () => A.play("n_" + n);
  if (period === 1) {
    card.innerHTML = `${dotsHTML(1)}<p class="prompt">New number! Listen, then say it.</p>
      <button class="tile num" id="t">${n}</button>${n ? M.objs(n, e) : `<p class="prompt">zero means none at all</p>`}
      <button class="btn yes big" id="next">I said it! Next step →</button>`;
    $("#t").onclick = say; A.play(["p_thisis", "n_" + n], 150);
    $("#next").onclick = async () => { St.grade(k, true, "math"); await award(1); p2(true); };
  } else if (period === 2) p2(false); else p3();
  function p2(fromP1) {
    const opts = St.shuffle([n, ...St.sample(pool.filter(x => x !== n), 2)]);
    card.innerHTML = `${dotsHTML(2)}<p class="prompt big">Show me…</p><div class="row"><button class="btn" id="again">🔊 Hear it again</button></div>
      <div class="choices">${opts.map(o => `<button class="choice letter" data-n="${o}">${o}</button>`).join("")}</div>`;
    const ask = () => A.play(["p_showme", "n_" + n], 150);
    $("#again").onclick = ask; ask();
    let miss = 0;
    card.querySelectorAll(".choice").forEach(b => b.onclick = async () => {
      if (+b.dataset.n === n) { b.classList.add("good"); St.grade(k, !miss, "math"); await award(miss ? 1 : 2, ["n_" + n, cheer()]); fromP1 ? p3() : advance(!miss, next); }
      else { miss++; b.classList.add("bad"); await A.play(["n_" + b.dataset.n, "p_notquite"], 200); ask(); }
    });
  }
  function p3() {
    card.innerHTML = `${dotsHTML(3)}<p class="prompt big">What number is this?</p><button class="tile num" id="t">${n}</button>
      <div class="grown"><p>Grown-up taps</p><div class="row">
        <button class="btn yes big" id="ok">Said it! +1</button><button class="btn try" id="help">Help me</button><button class="btn" id="skip">Skip</button></div></div>`;
    A.play("m_whatnum"); $("#t").onclick = say;
    let helped = false;
    $("#ok").onclick = async () => { St.grade(k, !helped, "math"); await award(1); advance(!helped, next); };
    $("#help").onclick = () => { helped = true; St.grade(k, false, "math"); A.play(["p_thisis", "n_" + n], 150); };
    $("#skip").onclick = () => advance(false, next);
  }
}
// Sandpaper numerals
function traceNumber(g) {
  const k = pickR(M.SK.tracenum.keys(g)), n = k.split(":")[2];
  traceScreen({ title: "Trace Numbers", prompt: "Trace the number with your finger. Say its name as you trace.", disp: n, vowel: true,
    kw: +n ? M.objs(+n, M.EMOJI[n % M.EMOJI.length]) : "", say: ["m_tracenum", "n_" + n], hear: ["n_" + n], clip: "n_" + n, skipLabel: "Next number",
    done: async () => { St.grade(k, true, "math"); await award(1, ["n_" + n, cheer()]); }, next: () => traceNumber(g) });
}

// ---------- PROGRESS + GROWN-UP CORNER ----------
const lp = { sub: "reading", g: "k" };   // the grown-up lesson picker's selection
// The grown-up area: This week (a summary first, details below), Settings for this child, and Help.
SCREENS.progress = (tab) => {
  tab = ["week", "settings", "help"].includes(tab) ? tab : "week";
  const S = St.S, kid = St.kid(), d = St.today(), days = [];
  for (let i = 13; i >= 0; i--) { const x = new Date(); x.setDate(x.getDate() - i); const k = St.dayKey(x); days.push([k, S.days[k] || { stars: 0, secs: 0 }, x]); }
  const week = days.slice(-7), sum = f => week.reduce((a, [, v]) => a + (f(v) || 0), 0);
  const weekStars = sum(v => v.stars), weekMin = Math.round(sum(v => v.secs) / 60), weekRounds = week.flatMap(([, v]) => v.rounds || []);
  const weekRight = sum(v => v.right), weekTries = sum(v => v.tries);
  const subOf = k => k.startsWith("m:") ? "math" : k.startsWith("g:") ? "geo" : "reading";
  const weak = Object.entries(S.items).filter(([, v]) => v.seen >= 3 && v.right / v.seen < .6).sort((a, b) => a[1].right / a[1].seen - b[1].right / b[1].seen)
    .slice(0, 8).map(([k]) => { const sb = subOf(k); return SUBJ[sb][0] + " " + (PRACTICE[sb] ? PRACTICE[sb].label(k) : k.split(":")[1]); });
  const tabs = `<div class="ptabs" role="tablist">${[["week", "📊 This week"], ["settings", "⚙️ Settings"], ["help", "❓ Help"]].map(([id, t]) =>
    `<button role="tab" data-tab="${id}" aria-selected="${tab === id}">${t}</button>`).join("")}</div>`;
  let body = "";
  if (tab === "week") {
    const max = Math.max(St.GOAL, ...days.map(([, v]) => v.stars || 0)), cw = 560, ch = 170, pl = 30, pb = 26, bw = (cw - pl) / 14;
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
    const allSounds = [...D.PINK_SOUNDS, ...D.GREEN_SOUNDS, ...D.LONG_SOUNDS];
    const seenBox = k => (S.items[k] && S.items[k].seen ? S.items[k].box : -1);
    const cls = s => { const b = Math.max(seenBox("snd:" + s), seenBox("trace:" + s), seenBox("spy:" + soundGroup(s))); return b >= St.MASTERED ? "m" : b >= 1 ? "l2" : b >= 0 ? "l1" : ""; };
    const meter = (name, n, of, col) => `<div class="lvrow"><span>${name}</span><div class="meter"><i style="width:${Math.min(1, n / of) * 100}%;background:${col}"></i></div><span>${n}/${of}</span></div>`;
    const actRows = sub => D.GRADES.filter(g => St.anyLesson(sub, g.id)).map(g => meter(`${g.label} · ${g.planet}`, doneCount(sub, g.id), lessons(sub, g.id).length, g.color)).join("");
    const lvRows = D.GRADES.filter(g => g.id !== "prek").map(g => { const l = D.READING[g.id], ws = [...levelWords(l).map(x => x[0]), ...l.vocab.map(v => v[0])];
      return meter(`${g.label} · ${g.planet}`, ws.filter(wordKnown).length, ws.length, g.color); }).join("");
    const tricky = D.TRICKY.filter(w => St.mastered("tricky:" + w)), facts = Object.keys(S.items).filter(k => /^m:(add|sub|mul|div):/.test(k));
    const storyList = D.STORIES.filter(st => S.stories[st.id]).map(st => `<span class="chip">📖 ${esc(st.title)} · ${S.stories[st.id].times}×</span>`).join("") || `<p>No stories finished yet.</p>`;
    // newest first, one line per activity with its best stars this week
    const finished = new Map(); weekRounds.slice().reverse().forEach(r => { const k = r.sub + r.g + r.act; if (!finished.has(k) || finished.get(k).stars < r.stars) finished.set(k, r); });
    body = `
    <div class="panel summary"><h3>${esc(kid.ava)} ${esc(kid.name)}'s week</h3>
      <div class="stats">
        <div class="stat"><b>${weekMin}</b><small>minutes</small></div>
        <div class="stat"><b>${weekRounds.length}</b><small>rounds finished</small></div>
        <div class="stat"><b>${weekTries ? Math.round(weekRight / weekTries * 100) + "%" : "–"}</b><small>right first time</small></div>
        <div class="stat"><b>${St.streak()}</b><small>day streak</small></div>
      </div>
      <p>Today: ${d.stars} stars (${d.sub.reading} reading, ${d.sub.math} math, ${d.sub.geo || 0} geography) in ${Math.round(d.secs / 60)} minutes. ${weekStars} stars this week.</p>
      <h4>Needs help with</h4>
      ${weak.length ? `<div class="chips">${weak.map(w => `<span class="chip">${esc(w)}</span>`).join("")}</div><p>These come up more often until they stick.</p>` : `<p>Nothing stuck right now. 👍</p>`}
      <h4>Finished this week</h4>
      ${finished.size ? `<div class="chips">${[...finished.values()].map(r => `<span class="chip">${SUBJ[r.sub][0]} ${esc(r.name)} · ${GRADE(r.g).label} ${"★".repeat(r.stars)}${"☆".repeat(3 - r.stars)}</span>`).join("")}</div>` : `<p>No rounds finished yet this week.</p>`}
    </div>
    <div class="panel"><h3>Stars per day</h3><p>The goal is ${St.GOAL} stars a day (green bars), from all subjects together.</p>${chart}</div>
    <details class="panel"><summary>📖 Reading details</summary>
      <h4>Activities checked off (★★ or better) per planet</h4>${actRows("reading")}
      <h4>Letter sounds</h4><div class="soundgrid">${allSounds.map(x => `<div class="sg ${cls(x)}">${D.SOUNDS[x][0]}</div>`).join("")}</div>
      <div class="legend"><span style="--c:#F1F4FB">Not tried</span><span style="--c:#FFF1C9">Started</span><span style="--c:#FFE08A">Learning</span><span style="--c:#CFF2DC">Knows it</span></div>
      <h4>Words read</h4>${lvRows}
      <p>Tricky words known: ${tricky.length}/${D.TRICKY.length}${tricky.length ? " · " + tricky.map(esc).join(", ") : ""}</p>
      <h4>Stories read</h4><div class="chips">${storyList}</div></details>
    <details class="panel"><summary>🔢 Math details</summary>
      <h4>Activities checked off (★★ or better) per planet</h4>${actRows("math")}
      <p>Math facts mastered: ${facts.filter(k => St.mastered(k)).length} of ${facts.length} practiced.</p></details>
    <details class="panel"><summary>🌍 Geography details</summary>
      <h4>Activities checked off (★★ or better) per planet</h4>${actRows("geo")}
      <p>Places and facts mastered: ${Object.keys(S.items).filter(k => k.startsWith("g:") && St.mastered(k)).length}.</p></details>`;
  } else if (tab === "settings") {
    const gradeRow = sub => D.GRADES.map(g => `<button class="btn hold ${g.id === S.grade[sub] ? "yes" : ""}" data-hold="${sub}:${g.id}">${g.label}</button>`).join("");
    body = `
    <div class="panel"><h3>${esc(kid.ava)} ${esc(kid.name)}</h3>
      <div class="row"><button class="btn" id="rename">Rename</button><button class="btn" id="players">Players</button></div></div>
    <div class="panel"><h3>Grades</h3>
      <p>Hold a grade for 2 seconds to move ${esc(kid.name)} there. Grades before it open too.</p>
      ${St.SUBJECTS.map(sub => `<p><b>${SUBJ[sub].join(" ")}</b>: now on ${GRADE(S.grade[sub]).label}</p><div class="row">${gradeRow(sub)}</div>`).join("")}
      <div class="row">${St.SUBJECTS.map(x => `<button class="btn hold" data-hold="all:${x}">Open every ${SUBJ[x][1].toLowerCase()} planet</button>`).join("")}</div></div>
    <div class="panel" id="lessonpick"><h3>Unlock one lesson</h3>
      <p>Open a single lesson on a planet without opening the whole grade. Pick a subject and grade, then hold a lesson for 2 seconds.</p>
      <div class="levels">${St.SUBJECTS.map(x => `<button data-ps="${x}" aria-pressed="${x === lp.sub}">${SUBJ[x].join(" ")}</button>`).join("")}</div>
      <div class="levels">${D.GRADES.map(g => `<button data-pg="${g.id}" aria-pressed="${g.id === lp.g}">${g.label}</button>`).join("")}</div>
      ${St.isOpen(lp.sub, lp.g) ? `<p>Every lesson on ${GRADE(lp.g).planet} (${GRADE(lp.g).label}) is already open.</p>` : ""}
      <div class="lessonlist">${lessons(lp.sub, lp.g).map(([id, ico, name, desc, tag]) => {
        const open = St.isOpen(lp.sub, lp.g), on = St.lessonOpen(lp.sub, lp.g, id);
        return `<div class="lesson"><span>${ico} <b>${esc(name)}</b><small>${esc(desc)} · ${esc(tag)}</small></span>${open ? "" : `<button class="btn hold ${on ? "" : "yes"}" data-hold="lesson:${lp.sub}:${lp.g}:${id}:${on ? 0 : 1}">${on ? "✓ Open · lock" : "Unlock"}</button>`}</div>`; }).join("")}</div></div>
    <div class="panel"><h3>Backup</h3><p>Progress is saved on this device. Back it up to a file to move ${esc(kid.name)} to another phone or tablet.</p>
      <div class="row"><button class="btn" id="backup">Back up progress</button><label class="btn">Restore a backup<input type="file" id="restorefile" accept=".json,application/json" hidden></label></div></div>
    <div class="panel"><h3>Start over</h3><p>Hold for 2 seconds. Starting over keeps ${esc(kid.name)}'s grades; removing deletes ${esc(kid.name)} from this device.</p>
      <div class="row"><button class="btn try hold" data-hold="reset">Start ${esc(kid.name)} over</button><button class="btn try hold" data-hold="remove">Remove ${esc(kid.name)}</button></div></div>`;
  } else {
    body = `
    <div class="panel"><h3>How it works</h3><div class="row"><button class="btn yes" id="howto">Show How to play</button></div>
      <ul class="tips">
        <li><b>Short and often:</b> 10 minutes a day beats an hour on Saturday. The daily goal is ${St.GOAL} stars from all subjects together.</li>
        <li><b>Planets are grades:</b> Moon is Pre-K, Mars K, Jupiter 1st, Saturn 2nd, Uranus 3rd, Neptune 4th and Pluto 5th grade.</li>
        <li><b>Rounds:</b> each activity is a round of 10 questions (6 on Pre-K and K). ★★ or better checks it off; about 70% of a planet checked off opens the next one. Replays only add bonus stars when they beat the best score.</li>
        <li><b>▶ Next:</b> the home screen marks the next unfinished activity, so a child always knows what to play.</li>
        <li><b>The rocket</b> at the top fills with today's stars. ${St.GOAL} stars completes the daily mission and launches it; every ${St.GOAL} after that is a bonus launch.</li>
        <li><b>Little ones:</b> on Pre-K and K, the first tap on a card says its name and the second tap opens it.</li>
        <li><b>Reading:</b> letter sounds (Pre-K), 3-letter words (K), blends and sh ch th (1st), long vowels and bossy r (2nd), then syllables, prefixes, suffixes and roots with word meanings and longer stories (3rd to 5th).</li>
        <li><b>Math:</b> counting, shapes and patterns (Pre-K), adding within 10 (K), facts to 20 and tens and ones (1st), 2-digit numbers, money and time (2nd), times tables and fractions (3rd), multi-digit work and decimals (4th), fraction and decimal operations (5th).</li>
        <li><b>Geography:</b> land and water, places in town and weather (Pre-K and K), continents, oceans, compass and map symbols (1st), landforms and where animals live (2nd), US states, flags and countries (3rd), state capitals and US regions (4th), world capitals, latitude and climate zones (5th).</li>
        <li><b>Sounds, not letter names:</b> say "mmm," not "em." Stop sounds are short: "b," not "buh."</li>
        <li><b>Three steps (Montessori):</b> Sound Cards and Number Cards teach "This is…", then "Show me…", then "What is this?"</li>
        <li><b>Colours:</b> vowels are blue and consonants red, like the Montessori movable alphabet. Silent letters are grey.</li>
        <li><b>Mistakes are fine:</b> wrong taps play their own sound so the difference can be heard. After two misses the answer is shown. Misses never take stars away.</li>
        <li>On an iPhone or iPad, tap Share → Add to Home Screen to open it like an app.</li>
      </ul></div>
    <div class="panel"><h3>🔊 Sound check</h3>
      <p>No sound? Turn the volume up and tap each test. Test 1 plays the way computers do, test 2 the way iPhones and iPads do. If you hear neither, share what the line below says.</p>
      <div class="row"><button class="btn" id="snd1">Test 1</button><button class="btn" id="snd2">Test 2</button></div>
      <p id="sndinfo"></p></div>
    <div class="panel"><h3>👋 Share with friends</h3><p>Send this link to other families. Each family's progress stays on their own phone or tablet, and they can add a player for each of their kids.</p>
      <div class="row"><button class="btn yes" id="share">Share Sound Rocket</button></div></div>`;
  }
  shell("Grown-ups", tabs + body);
  app.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => SCREENS.progress(b.dataset.tab));
  const on = (id, f) => { const e = $(id); if (e) e.onclick = f; };
  on("#howto", () => go("howto"));
  on("#players", () => go("kids"));
  const sndInfo = () => { const i = A.info(), el = $("#sndinfo"); if (el) el.textContent = `Audio: ${i.state}, ${i.rate} Hz, session ${i.session}, played by ${i.path || "nothing yet"}${i.ios ? ", iPhone/iPad mode" : ""}${i.error ? ", problem: " + i.error : ""}`; };
  on("#snd1", async () => { await A.playWebAudio("p_great"); sndInfo(); });
  on("#snd2", async () => { await A.playElement("p_great"); sndInfo(); });
  sndInfo();
  on("#rename", () => { const n = (prompt("Child's name", St.kid().name) || "").trim().slice(0, 20); if (n) { St.editKid(St.kid().id, { name: n }); SCREENS.progress("settings"); } });
  on("#backup", () => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([St.exportKid()], { type: "application/json" }));
    a.download = `sound-rocket-${D.slug(St.kid().name) || "player"}-${St.dayKey()}.json`; document.body.appendChild(a); a.click(); a.remove();
  });
  const rf = $("#restorefile"); if (rf) rf.onchange = e => restoreFile(e.target.files[0]);
  on("#share", async () => {
    const link = location.origin + location.pathname, text = "Sound Rocket: a free reading, math and geography game for kids, Pre-K to 5th grade.";
    try { if (navigator.share) { await navigator.share({ title: "Sound Rocket", text, url: link }); return; } } catch (e) { if (e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(link); toast("Link copied: " + link, 3500); } catch (e) { prompt("Copy this link", link); }
  });
  const toPicker = () => { SCREENS.progress("settings"); $("#lessonpick").scrollIntoView(); };
  app.querySelectorAll("[data-ps]").forEach(b => b.onclick = () => { lp.sub = b.dataset.ps; toPicker(); });
  app.querySelectorAll("[data-pg]").forEach(b => b.onclick = () => { lp.g = b.dataset.pg; toPicker(); });
  app.querySelectorAll("[data-hold]").forEach(b => hold(b, () => {
    const [sub, gid, ...rest] = b.dataset.hold.split(":");
    if (sub === "reset") { St.reset(); toast("Started over"); }
    else if (sub === "remove") { const n = St.kid().name; St.removeKid(St.kid().id); toast(n + " removed"); go("home"); route(); return; }
    else if (sub === "all") { D.GRADES.forEach(g => St.unlock(gid, g.id)); toast("Every planet is open"); }
    else if (sub === "lesson") {
      const [g, act, on1] = rest; St.setLesson(gid, g, act, on1 === "1");
      if (on1 === "1") { St.setSubject(gid); St.setLevel(gid, g); toast("Lesson unlocked! It's on the home screen now."); } else toast("Lesson locked");
      return toPicker();
    }
    else { D.GRADES.slice(0, gradeIndex(gid) + 1).forEach(g => St.unlock(sub, g.id)); St.setLevel(sub, gid); toast("Moved to " + GRADE(gid).label); }
    SCREENS.progress("settings");
  }));
};

// reading screens set the subject so stars and praise go to the right place
["sounds", "trace", "ispy", "blend", "build", "match", "tricky", "vocab", "stories", "story"].forEach(n => {
  const f = SCREENS[n]; SCREENS[n] = arg => { St.setSubject("reading"); return f(arg); };
});

route();
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
})();
