// Progress, daily log and the practice scheduler. Saved in this browser (localStorage).
// Reading and Math each have their own grade (prek, k, g1..g5) and unlocked grades; stars and the daily mission are shared.
window.Store = (() => {
  const KEY = "soundRocket.v2";
  const GOAL = 20;                       // stars for a "mission complete" day
  // Review gaps for each mastery box (Leitner-style spaced repetition)
  const GAP = [30e3, 5 * 60e3, 20 * 3600e3, 2 * 864e5, 5 * 864e5, 12 * 864e5];
  const MASTERED = 3;

  const fresh = () => ({ subject: "reading", grade: { reading: "prek", math: "prek" }, open: { reading: ["prek"], math: ["prek"] }, mathRight: {}, lessons: {} });
  let S = { stars: 0, launches: 0, items: {}, days: {}, stories: {}, recent: [], lastAct: 0, goalDays: {}, ...fresh() };
  try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) S = { ...S, ...s }; } catch (e) {}
  // Before grade levels, reading had three planets: pink (3-letter words, now K), blue and green (now 1st grade)
  if (!S.lessons) S.lessons = {};
  if (Array.isArray(S.unlocked)) {
    const map = { pink: "k", blue: "g1", green: "g1" };
    S.open = { reading: ["prek", ...new Set(S.unlocked.map(l => map[l]).filter(Boolean))], math: ["prek"] };
    S.grade = { reading: map[S.level] || "k", math: "prek" };
    delete S.unlocked; delete S.level;
  }
  // carry over stars from the first version of the game
  try { const old = JSON.parse(localStorage.getItem("soundRocket") || "null"); if (old && !S.migrated) { S.stars += old.pts || 0; S.launches += old.launches || 0; S.migrated = true; } } catch (e) {}
  let timer = null;
  const save = () => { clearTimeout(timer); timer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }, 150); };

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
  // first-try right answers in each math grade (opens the next math planet)
  function mathRight(g) { S.mathRight[g] = (S.mathRight[g] || 0) + 1; save(); return S.mathRight[g]; }
  function reset() { S = { stars: 0, launches: 0, items: {}, days: {}, stories: {}, recent: [], lastAct: 0, goalDays: {}, migrated: true, ...fresh() }; save(); }

  return { get S() { return S; }, GOAL, MASTERED, dayKey, today, touch, item, grade, box, mastered, pick, shuffle, sample, addStars, streak, storyRead,
    isOpen, lessonOpen, anyLesson, setLesson, unlock, setLevel, setSubject, mathRight, reset, save };
})();
