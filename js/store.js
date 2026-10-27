// Progress, daily log and the practice scheduler. Saved in this browser (localStorage).
// Each child on the device has a profile with their own progress. Reading and Math each have their own
// grade (prek, k, g1..g5) and unlocked grades; stars and the daily mission are shared between them.
window.Store = (() => {
  const KEY = "soundRocket.v2";                 // progress from before profiles (kept as it was)
  const PKEY = "soundRocket.profiles", kidKey = id => "soundRocket.kid." + id;
  const GRADE_IDS = ["prek", "k", "g1", "g2", "g3", "g4", "g5"];
  const GOAL = 20;                       // stars for a "mission complete" day
  // Review gaps for each mastery box (Leitner-style spaced repetition)
  const GAP = [30e3, 5 * 60e3, 20 * 3600e3, 2 * 864e5, 5 * 864e5, 12 * 864e5];
  const MASTERED = 3;

  const SUBJECTS = ["reading", "math", "geo"];
  const fresh = () => ({ subject: "reading", grade: { reading: "prek", math: "prek", geo: "prek" }, open: { reading: ["prek"], math: ["prek"], geo: ["prek"] }, mathRight: {}, geoRight: {}, lessons: {}, best: {} });
  const blank = () => ({ stars: 0, launches: 0, items: {}, days: {}, stories: {}, recent: [], lastAct: 0, goalDays: {}, migrated: true, ...fresh() });
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  // bring older saved progress up to date
  function upgrade(s) {
    s = { ...blank(), migrated: false, ...s };
    if (!s.lessons) s.lessons = {};
    // subjects added later start at Pre-K
    for (const sub of SUBJECTS) { if (!s.grade[sub]) s.grade[sub] = "prek"; if (!s.open[sub]) s.open[sub] = ["prek"]; }
    if (!s.geoRight) s.geoRight = {};
    if (!s.best) s.best = {};
    // Before grade levels, reading had three planets: pink (3-letter words, now K), blue and green (now 1st grade)
    if (Array.isArray(s.unlocked)) {
      const map = { pink: "k", blue: "g1", green: "g1" };
      s.open = { reading: ["prek", ...new Set(s.unlocked.map(l => map[l]).filter(Boolean))], math: ["prek"] };
      s.grade = { reading: map[s.level] || "k", math: "prek" };
      delete s.unlocked; delete s.level;
    }
    // carry over stars from the first version of the game
    const old = read("soundRocket"); if (old && !s.migrated) { s.stars += old.pts || 0; s.launches += old.launches || 0; }
    s.migrated = true;
    return s;
  }

  // Profiles: { kids: [{id, name, ava}], cur: id }. Progress from before profiles becomes the first child.
  let P = read(PKEY) || { kids: [], cur: null };
  if (!P.kids.length && read(KEY)) { P = { kids: [{ id: "k1", name: "Player 1", ava: "🚀" }], cur: "k1" }; write(kidKey("k1"), upgrade(read(KEY))); write(PKEY, P); }
  let S = blank();
  if (P.cur && P.kids.some(k => k.id === P.cur)) S = upgrade(read(kidKey(P.cur)) || {}); else P.cur = null;
  let timer = null;
  const flush = () => { clearTimeout(timer); timer = null; if (P.cur) write(kidKey(P.cur), S); };
  const save = () => { clearTimeout(timer); timer = setTimeout(flush, 150); };
  addEventListener("pagehide", () => { if (timer) flush(); });

  const kids = () => P.kids;
  const kid = () => P.kids.find(k => k.id === P.cur) || null;
  function switchKid(id) { if (timer) flush(); P.cur = id; write(PKEY, P); S = upgrade(read(kidKey(id)) || {}); }
  // a new child starts at the grades a grown-up picked: those grades and everything before them are open
  function addKid(name, ava, start) {
    const id = "k" + Date.now().toString(36);
    P.kids.push({ id, name, ava }); write(PKEY, P);
    const s = blank();
    for (const sub of SUBJECTS) { const g = start[sub] || "prek"; s.grade[sub] = g; s.open[sub] = GRADE_IDS.slice(0, GRADE_IDS.indexOf(g) + 1); }
    write(kidKey(id), s); switchKid(id); return id;
  }
  function editKid(id, f) { Object.assign(P.kids.find(k => k.id === id), f); write(PKEY, P); }
  function removeKid(id) {
    P.kids = P.kids.filter(k => k.id !== id); try { localStorage.removeItem(kidKey(id)); } catch (e) {}
    if (P.cur === id) { if (P.kids.length) switchKid(P.kids[0].id); else { P.cur = null; S = blank(); } }
    write(PKEY, P);
  }
  // back up one child's progress to a file, and bring it back on another device
  const exportKid = () => { flush(); return JSON.stringify({ app: "sound-rocket", kid: kid(), progress: S }); };
  function importKid(text) {
    const d = JSON.parse(text); if (d.app !== "sound-rocket" || !d.progress) throw new Error("not a Sound Rocket backup");
    const id = "k" + Date.now().toString(36);
    P.kids.push({ id, name: (d.kid && d.kid.name) || "Player", ava: (d.kid && d.kid.ava) || "🚀" }); write(PKEY, P);
    write(kidKey(id), upgrade(d.progress)); switchKid(id); return id;
  }

  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  function today() {
    const k = dayKey();
    if (!S.days[k]) S.days[k] = { stars: 0, secs: 0, right: 0, tries: 0, acts: {}, stories: [] };
    if (!S.days[k].sub) S.days[k].sub = { reading: 0, math: 0 };
    return S.days[k];
  }
  // Count active minutes: time between taps, ignoring gaps over 90 seconds
  function touch() {
    const now = Date.now(), d = today();
    if (S.lastAct && now - S.lastAct < 90e3) d.secs += (now - S.lastAct) / 1000;
    S.lastAct = now; save();
  }

  function item(k) { return S.items[k] || (S.items[k] = { box: 0, seen: 0, right: 0, due: 0, last: 0 }); }
  function grade(k, ok, act) {
    const it = item(k), now = Date.now(), d = today();
    it.seen++; it.last = now;
    if (ok) { it.right++; it.box = Math.min(it.box + 1, GAP.length - 1); }
    else it.box = Math.max(0, it.box - 1);
    it.due = now + GAP[it.box] * (ok ? 1 : 0.5);
    d.tries++; if (ok) d.right++;
    if (act) d.acts[act] = (d.acts[act] || 0) + 1;
    save();
  }
  const box = k => (S.items[k] ? S.items[k].box : -1);
  const mastered = k => box(k) >= MASTERED;

  // Pick the next thing to practice: never one of the last few shown, favour items that are due or weak,
  // bring in new items a few at a time. Randomized so the order never feels fixed.
  function pick(keys, opts = {}) {
    const now = Date.now(), maxNew = opts.maxNew ?? 3;
    const avoid = new Set(S.recent.slice(-Math.min(8, Math.max(0, keys.length - 2))));
    let pool = keys.filter(k => !avoid.has(k));
    if (!pool.length) pool = keys.filter(k => k !== S.recent[S.recent.length - 1]);
    if (!pool.length) pool = keys.slice();
    const learning = keys.filter(k => S.items[k] && S.items[k].seen && S.items[k].box < MASTERED).length;
    // new items come in the order given (e.g. the Montessori letter order), a couple at a time
    const nextNew = new Set(keys.filter(k => !(S.items[k] && S.items[k].seen)).slice(0, opts.ordered === false ? keys.length : 2));
    const w = pool.map(k => {
      const it = S.items[k];
      if (!it || !it.seen) return !nextNew.has(k) ? 0.05 : (learning < maxNew + 3 ? 2.5 : 0.4);  // new
      let x = 1 / (it.box + 1);
      if (it.due <= now) x += 2.5;
      if (it.seen >= 3 && it.right / it.seen < 0.6) x += 1.5;
      return x;
    });
    let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0;
    while (i < w.length - 1 && (r -= w[i]) > 0) i++;
    const k = pool[i];
    S.recent.push(k); if (S.recent.length > 30) S.recent.shift(); save();
    return k;
  }
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (a, n) => shuffle(a).slice(0, n);

  // Stars: returns {launch, goal} so the game can celebrate
  function addStars(n, subject = S.subject) {
    const before = Math.floor(S.stars / 20), d = today(), had = d.stars;
    S.stars += n; d.stars += n; d.sub[subject] = (d.sub[subject] || 0) + n;
    const launch = Math.floor(S.stars / 20) > before;
    if (launch) S.launches++;
    const goal = had < GOAL && d.stars >= GOAL;
    if (goal) S.goalDays[dayKey()] = true;
    save(); return { launch, goal };
  }
  function streak() {
    let n = 0; const d = new Date();
    if (!(S.days[dayKey(d)] && S.days[dayKey(d)].stars)) d.setDate(d.getDate() - 1); // today not played yet: count up to yesterday
    while (S.days[dayKey(d)] && S.days[dayKey(d)].stars > 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function storyRead(id) {
    const d = today(); if (!d.stories.includes(id)) d.stories.push(id);
    const s = S.stories[id] || (S.stories[id] = { times: 0, first: dayKey() }); s.times++; s.last = dayKey(); save();
  }
  const isOpen = (subject, g) => S.open[subject].includes(g);
  function unlock(subject, g) { if (!isOpen(subject, g)) { S.open[subject].push(g); save(); return true; } return false; }
  // Single lessons a grown-up opened on a planet that is otherwise still locked ("math:g3:fractions")
  const lessonOpen = (subject, g, act) => isOpen(subject, g) || !!S.lessons[`${subject}:${g}:${act}`];
  const anyLesson = (subject, g) => isOpen(subject, g) || Object.keys(S.lessons).some(k => S.lessons[k] && k.startsWith(`${subject}:${g}:`));
  function setLesson(subject, g, act, on) { if (on) S.lessons[`${subject}:${g}:${act}`] = true; else delete S.lessons[`${subject}:${g}:${act}`]; save(); }
  function setLevel(subject, g) { S.grade[subject] = g; save(); }
  function setSubject(s) { S.subject = s; save(); }
  // first-try right answers in each math or geography grade (opens the next planet)
  const rightField = sub => sub === "geo" ? "geoRight" : "mathRight";
  function mathRight(g, sub = "math") { const f = S[rightField(sub)]; f[g] = (f[g] || 0) + 1; save(); return f[g]; }
  const rightCount = (sub, g) => S[rightField(sub)][g] || 0;
  // best round score (0-3 stars) for each activity on each planet: "math:g3:fractions"
  const best = key => S.best[key] || 0;
  function setBest(key, stars) { const prev = best(key); if (stars > prev) { S.best[key] = stars; save(); } return prev; }
  // start this child over, keeping the grades they're on
  function reset() { const keep = { grade: S.grade, open: S.open, subject: S.subject }; S = { ...blank(), ...keep }; save(); }

  return { get S() { return S; }, GOAL, MASTERED, dayKey, today, touch, item, grade, box, mastered, pick, shuffle, sample, addStars, streak, storyRead,
    SUBJECTS, rightCount, best, setBest, isOpen, lessonOpen, anyLesson, setLesson, unlock, setLevel, setSubject, mathRight, reset, save,
    kids, kid, switchKid, addKid, editKid, removeKid, exportKid, importKid };
})();
