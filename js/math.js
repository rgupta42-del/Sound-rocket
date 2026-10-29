// Sound Rocket math: skills for each grade, Pre-K to 5th, on the same planets as reading.
// Each skill makes practice problems. Montessori touches: number cards (three-period lesson), sandpaper numerals,
// golden beads for place value, ten frames and bead-style arrays.
// Spoken parts are recorded clips: n_0..n_100 plus hundred/thousand/million are joined to say any number.

window.MATH = (() => {
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const one = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  const fmt = n => Number(n).toLocaleString("en-US");

  // ---------- spoken numbers ----------
  const ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
  const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const numWord = n => n < 20 ? ONES[n] : n < 100 ? TENS[n / 10 | 0] + (n % 10 ? "-" + ONES[n % 10] : "") : "one hundred";
  function N3(n) { if (n <= 100) return ["n_" + n]; const r = n % 100; return ["n_" + (n / 100 | 0), "n_hundred", ...(r ? ["n_" + r] : [])]; }
  // N(47382) -> ["n_47","n_thousand","n_3","n_hundred","n_82"]
  function N(n) {
    n = Math.round(Math.abs(n)); if (n <= 100) return ["n_" + n];
    const out = [];
    for (const [v, c] of [[1e6, "n_million"], [1e3, "n_thousand"]]) if (n >= v) { out.push(...N3(Math.floor(n / v)), c); n %= v; }
    if (n) out.push(...N3(n));
    return out;
  }
  // decimals are read digit by digit after the point: 3.45 -> three point four five
  function Dc(s) { s = String(s); const [a, b] = s.split("."); return [...N(+a), ...(b ? ["m_point", ...b.split("").map(d => "n_" + d)] : [])]; }
  const DENOM = { 2:["half","halves"], 3:["third","thirds"], 4:["fourth","fourths"], 5:["fifth","fifths"], 6:["sixth","sixths"], 7:["seventh","sevenths"],
    8:["eighth","eighths"], 9:["ninth","ninths"], 10:["tenth","tenths"], 12:["twelfth","twelfths"],
    15:["fifteenth","fifteenths"], 16:["sixteenth","sixteenths"], 20:["twentieth","twentieths"], 100:["hundredth","hundredths"] };
  const F = (n, d) => d === 1 ? N(n) : [...N(n), "fr_" + d + (n === 1 ? "" : "p")];

  // Math prompts (clip name -> text)
  const PHRASES = {
    m_howmany:"How many?", m_quicklook:"Quick look! How many did you see?", m_numline:"What number is the arrow pointing to?", m_make:"make", m_whichmany:"Which group has this many?", m_whatnum:"What number is this?", m_tracenum:"Trace the number with your finger. Say its name.",
    m_more:"Which group has more?", m_fewer:"Which group has fewer?", m_bigger:"Which number is bigger?", m_smaller:"Which number is smaller?",
    m_sign:"Which sign goes in the middle?", m_greater:"is greater than", m_less:"is less than", m_equal:"is equal to",
    m_next:"What comes next?", m_whatis:"What is", m_plus:"plus", m_minus:"minus", m_times:"times", m_divby:"divided by", m_equals:"equals",
    m_make10:"How many more to make ten?", m_beads:"What number do the beads show?", m_digitvalue:"What is the value of the digit", m_in:"in",
    m_whattime:"What time is it?", m_oclock:"o'clock", m_oh:"oh", m_howmuch:"How much money is this?", m_cents:"cents",
    m_countby:"Count by", m_missing:"What number is missing?", m_evenodd:"Is this number even or odd?", m_even:"Even", m_odd:"Odd",
    m_iseven:"is even.", m_isodd:"is odd.", m_remainder:"remainder", m_fracshaded:"What fraction is shaded?", m_bigfrac:"Which fraction is bigger?",
    m_round:"Round", m_tonearest:"to the nearest", m_area:"What is the area?", m_perimeter:"What is the perimeter?", m_volume:"What is the volume?",
    m_squnits:"square units", m_units:"units", m_cubunits:"cubic units", m_point:"point", m_asdecimal:"Which decimal means the same?",
    m_bigdec:"Which decimal is bigger?", m_factorof:"Which number is a factor of", m_primeq:"Is this number prime or composite?",
    m_prime:"Prime", m_composite:"Composite", m_order:"Use the order of operations. What is the answer?", m_and:"and"
  };
  const SHAPES2D = ["circle", "square", "triangle", "rectangle", "star", "heart"];
  const SHAPES_K = [...SHAPES2D, "oval", "hexagon", "rhombus", "cube", "sphere", "cone", "cylinder"];
  // every clip this file can ask for, for tools/export_list.js
  function clips() {
    const out = { ...PHRASES };
    for (let n = 0; n <= 100; n++) out["n_" + n] = numWord(n);
    Object.assign(out, { n_hundred:"hundred", n_thousand:"thousand", n_million:"million" });
    for (const [d, [s, p]] of Object.entries(DENOM)) { out["fr_" + d] = s; out["fr_" + d + "p"] = p; }
    SHAPES_K.forEach(s => out["sh_" + s] = s);
    return out;
  }

  // ---------- pictures ----------
  const EMOJI = ["🍎", "⭐", "🐟", "🚀", "🌸", "🐞", "🍪", "⚽", "🦆", "🎈", "🍓", "🐢"];
  const PAL = ["#F59AC2", "#7AAEFF", "#72D394", "#FFC83A", "#B79CFF", "#FF9F6B"];
  // objects in groups of five so they're easy to count
  function objs(n, e, crossFrom = n) {
    let h = "", i = 0;
    while (i < n) { let g = ""; for (let j = 0; j < 5 && i < n; j++, i++) g += `<i class="${i >= crossFrom ? "x" : ""}">${e}</i>`; h += `<span class="grp">${g}</span>`; }
    return `<div class="objs">${h || "<span class='grp'>&nbsp;</span>"}</div>`;
  }
  const tenFrame = n => `<div class="tenframe">${Array.from({ length: 10 }, (_, i) => `<span>${i < n ? "<i></i>" : ""}</span>`).join("")}</div>`;
  // Montessori golden beads: hundred squares, ten bars, unit beads
  const beads = (h, t, o) => `<div class="beads">${"<span class='hsq'></span>".repeat(h)}${"<span class='tbar'></span>".repeat(t)}<span class="units">${"<i></i>".repeat(o)}</span></div>`;
  const frac = (n, d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`;
  // "1 1/4" style for fractions that may be whole or mixed
  function fracVal(n, d) {
    const g = gcd(n, d); n /= g; d /= g;
    if (d === 1) return { html: String(n), say: N(n), v: n + "/1" };
    if (n > d) { const w = n / d | 0, r = n % d; return { html: `${w} ${frac(r, d)}`, say: [...N(w), "m_and", ...F(r, d)], v: n + "/" + d }; }
    return { html: frac(n, d), say: F(n, d), v: n + "/" + d };
  }
  function clock(h, m) {
    const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
    const hand = (a, len, w, c) => { const r = (a - 90) * Math.PI / 180; return `<line x1="100" y1="100" x2="${(100 + len * Math.cos(r)).toFixed(1)}" y2="${(100 + len * Math.sin(r)).toFixed(1)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`; };
    let ticks = "", nums = "";
    for (let i = 0; i < 60; i++) { const r = (i * 6 - 90) * Math.PI / 180, a = i % 5 ? 86 : 80; ticks += `<line x1="${(100 + a * Math.cos(r)).toFixed(1)}" y1="${(100 + a * Math.sin(r)).toFixed(1)}" x2="${(100 + 90 * Math.cos(r)).toFixed(1)}" y2="${(100 + 90 * Math.sin(r)).toFixed(1)}" stroke="#5A6688" stroke-width="${i % 5 ? 1 : 2.5}"/>`; }
    for (let i = 1; i <= 12; i++) { const r = (i * 30 - 90) * Math.PI / 180; nums += `<text x="${(100 + 66 * Math.cos(r)).toFixed(1)}" y="${(100 + 66 * Math.sin(r) + 7).toFixed(1)}" text-anchor="middle" font-size="20" font-weight="700" fill="#17203F">${i}</text>`; }
    return `<svg class="clock" viewBox="0 0 200 200" role="img" aria-label="clock"><circle cx="100" cy="100" r="94" fill="#fff" stroke="#17203F" stroke-width="5"/>${ticks}${nums}
      ${hand(ha, 45, 8, "#DC3B3B")}${hand(ma, 72, 5, "#2563EB")}<circle cx="100" cy="100" r="6" fill="#17203F"/></svg>`;
  }
  const timeText = (h, m) => h + ":" + String(m).padStart(2, "0");
  const timeSay = (h, m) => m === 0 ? ["n_" + h, "m_oclock"] : m < 10 ? ["n_" + h, "m_oh", "n_" + m] : ["n_" + h, "n_" + m];
  const COIN = { 25:["quarter", 64, "#C9CED8"], 10:["dime", 44, "#D5DAE3"], 5:["nickel", 54, "#BFC5CF"], 1:["penny", 48, "#D9915A"] };
  const coins = list => `<div class="coins">${list.map(c => `<span class="coin" style="--s:${COIN[c][1]}px;--c:${COIN[c][2]}" title="${COIN[c][0]}">${c}¢</span>`).join("")}</div>`;
  function fracPic(n, d, kind) {
    const fill = i => i < n ? "#7AAEFF" : "#fff";
    if (kind === "bar") return `<svg class="fracpic" viewBox="0 0 244 64" role="img" aria-label="fraction bar">${Array.from({ length: d }, (_, i) => `<rect x="${2 + i * 240 / d}" y="2" width="${240 / d}" height="60" fill="${fill(i)}" stroke="#17203F" stroke-width="3"/>`).join("")}</svg>`;
    const pt = a => [100 + 90 * Math.cos((a - 90) * Math.PI / 180), 100 + 90 * Math.sin((a - 90) * Math.PI / 180)].map(v => v.toFixed(1)).join(",");
    return `<svg class="fracpic round" viewBox="0 0 200 200" role="img" aria-label="fraction circle">${Array.from({ length: d }, (_, i) => `<path d="M100,100 L${pt(i * 360 / d)} A90,90 0 0 1 ${pt((i + 1) * 360 / d)} Z" fill="${fill(i)}" stroke="#17203F" stroke-width="3"/>`).join("")}</svg>`;
  }
  const grid = (w, h) => `<svg class="grid" viewBox="0 0 ${w * 34 + 4} ${h * 34 + 4}" role="img" aria-label="${w} by ${h} grid">${Array.from({ length: w * h }, (_, i) => `<rect x="${2 + (i % w) * 34}" y="${2 + (i / w | 0) * 34}" width="34" height="34" fill="#DCE8FF" stroke="#2563EB" stroke-width="2"/>`).join("")}</svg>`;
  function rectPic(w, h, u) {
    const s = Math.min(220 / w, 120 / h), W = w * s, H = h * s;
    return `<svg class="rectpic" viewBox="0 0 ${W + 90} ${H + 50}" role="img" aria-label="rectangle ${w} by ${h}"><rect x="45" y="12" width="${W}" height="${H}" fill="#DCE8FF" stroke="#2563EB" stroke-width="3"/>
      <text x="${45 + W / 2}" y="${H + 40}" text-anchor="middle" font-size="18" font-weight="700" fill="#17203F">${w} ${u}</text>
      <text x="${W + 52}" y="${12 + H / 2 + 6}" font-size="18" font-weight="700" fill="#17203F">${h} ${u}</text></svg>`;
  }
  function boxPic(l, w, h) {
    const s = 16, L = l * s, H = h * s, D = w * s * .5;
    return `<svg class="rectpic" viewBox="0 0 ${L + D + 80} ${H + D + 50}" role="img" aria-label="box ${l} by ${w} by ${h}">
      <polygon points="20,${D + 10} ${20 + D},10 ${20 + D + L},10 ${20 + L},${D + 10}" fill="#FFE08A" stroke="#7A5A00" stroke-width="2"/>
      <polygon points="${20 + L},${D + 10} ${20 + D + L},10 ${20 + D + L},${10 + H} ${20 + L},${D + 10 + H}" fill="#F2C14E" stroke="#7A5A00" stroke-width="2"/>
      <rect x="20" y="${D + 10}" width="${L}" height="${H}" fill="#FFC83A" stroke="#7A5A00" stroke-width="2"/>
      <text x="${20 + L / 2}" y="${D + H + 34}" text-anchor="middle" font-size="16" font-weight="700" fill="#17203F">${l}</text>
      <text x="${28 + L + D}" y="${15 + D / 2 + H / 2}" font-size="16" font-weight="700" fill="#17203F">${h}</text>
      <text x="${30 + L + D / 2}" y="${12 + D / 2}" font-size="16" font-weight="700" fill="#17203F">${w}</text></svg>`;
  }
  const arrayPic = (r, c) => `<div class="arr" style="grid-template-columns:repeat(${c},1fr)">${"<i></i>".repeat(r * c)}</div>`;
  const vert = (a, op, b) => `<div class="vert"><span>${fmt(a)}</span><span><b>${op}</b>${fmt(b)}</span></div>`;
  const eq = s => `<div class="eq">${s}</div>`;
  function shape(name, color = one(PAL)) {
    const st = `fill="${color}" stroke="#17203F" stroke-width="3" stroke-linejoin="round"`;
    const poly = (n, r, rot = -90) => Array.from({ length: n }, (_, i) => { const a = (rot + i * 360 / n) * Math.PI / 180; return (50 + r * Math.cos(a)).toFixed(1) + "," + (50 + r * Math.sin(a)).toFixed(1); }).join(" ");
    const star = Array.from({ length: 10 }, (_, i) => { const a = (-90 + i * 36) * Math.PI / 180, r = i % 2 ? 18 : 42; return (50 + r * Math.cos(a)).toFixed(1) + "," + (52 + r * Math.sin(a)).toFixed(1); }).join(" ");
    const s = {
      circle:`<circle cx="50" cy="50" r="40" ${st}/>`, square:`<rect x="14" y="14" width="72" height="72" ${st}/>`, rectangle:`<rect x="4" y="26" width="92" height="48" ${st}/>`,
      triangle:`<polygon points="50,10 92,86 8,86" ${st}/>`, star:`<polygon points="${star}" ${st}/>`, oval:`<ellipse cx="50" cy="50" rx="45" ry="28" ${st}/>`,
      heart:`<path d="M50 88 C14 62 4 36 24 20 C38 10 50 22 50 32 C50 22 62 10 76 20 C96 36 86 62 50 88 Z" ${st}/>`,
      hexagon:`<polygon points="${poly(6, 42, 0)}" ${st}/>`, rhombus:`<polygon points="50,6 86,50 50,94 14,50" ${st}/>`,
      cube:`<polygon points="14,34 34,16 86,16 66,34" fill="#fff8" stroke="#17203F" stroke-width="3"/><polygon points="66,34 86,16 86,68 66,86" fill="#0002" stroke="#17203F" stroke-width="3"/><rect x="14" y="34" width="52" height="52" ${st}/><polygon points="14,34 34,16 86,16 66,34" fill="${color}" opacity=".7" stroke="#17203F" stroke-width="3"/>`,
      sphere:`<circle cx="50" cy="50" r="40" ${st}/><ellipse cx="50" cy="52" rx="40" ry="11" fill="none" stroke="#17203F" stroke-width="2" stroke-dasharray="4 4"/><ellipse cx="36" cy="34" rx="10" ry="7" fill="#fff8"/>`,
      cone:`<path d="M50 8 L86 78 A36 11 0 0 1 14 78 Z" ${st}/><ellipse cx="50" cy="78" rx="36" ry="11" fill="none" stroke="#17203F" stroke-width="2" stroke-dasharray="4 4"/>`,
      cylinder:`<path d="M16 22 V78 A34 11 0 0 0 84 78 V22" ${st}/><ellipse cx="50" cy="22" rx="34" ry="11" ${st}/>`
    }[name];
    return `<svg class="shape" viewBox="0 0 100 100" role="img" aria-label="${name}">${s}</svg>`;
  }

  // ---------- answers ----------
  // a few nearby numbers for multiple choice, all different and >= lo
  function near(ans, n = 3, spread = 3, lo = 0) {
    const out = new Set([ans]); let guard = 0;
    while (out.size < n && guard++ < 200) { const v = ans + ri(-spread, spread); if (v >= lo && v !== ans) out.add(v); }
    for (let v = lo; out.size < n; v++) out.add(v);
    return shuffle([...out]).map(v => ({ v: String(v), html: fmt(v), say: N(v) }));
  }
  const numChoices = vals => shuffle(vals).map(v => ({ v: String(v), html: fmt(v), say: N(v) }));

  // ---------- skills ----------
  // keys(g): practice items for spaced repetition (in teaching order). gen(g, key): one problem.
  // A problem: { q, say, vis, ans, choices?: [{v, html, say}], pad?: {dec}, after?: clips said when it's right }
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const SK = {};

  SK.numcards = { name:"Number Cards", ico:"🔢", tag:"Montessori 3-step lesson", special:true,
    keys: g => range(g === "prek" ? 1 : 0, g === "prek" ? 10 : 20).concat(g === "prek" ? [0] : []).map(n => "m:num:" + n) };
  SK.tracenum = { name:"Trace Numbers", ico:"✍️", tag:"Sandpaper numerals", special:true,
    keys: g => range(0, g === "prek" ? 9 : 20).map(n => "m:trace:" + n) };

  SK.count = { name:"Count It", ico:"🍎", tag:"Counting",
    keys: g => range(1, g === "prek" ? 10 : 20).map(n => "m:count:" + n),
    gen(g, key) { const n = +key.split(":")[2], e = one(EMOJI);
      return { q:"How many?", say:["m_howmany"], vis:objs(n, e), ans:String(n), choices:near(n, g === "prek" ? 3 : 4, 2, 1), after:N(n) }; } };

  SK.compare = { name:"More or Less", ico:"⚖️", tag:"Comparing",
    gen(g) {
      if (g === "prek") {
        let a = ri(1, 8), b = ri(1, 8); while (b === a) b = ri(1, 8);
        const e = one(EMOJI), more = Math.random() < .7, ans = (more ? a > b : a < b) ? "A" : "B";
        return { q: more ? "Which group has <b>more</b>?" : "Which group has <b>fewer</b>?", say:[more ? "m_more" : "m_fewer"], vis:"",
          ans, choices:[{ v:"A", html:objs(a, e), say:N(a) }, { v:"B", html:objs(b, e), say:N(b) }], wide:true };
      }
      if (g === "k") {
        let a = ri(0, 20), b = ri(0, 20); while (b === a) b = ri(0, 20);
        const big = Math.random() < .6;
        return { q: big ? "Which number is <b>bigger</b>?" : "Which number is <b>smaller</b>?", say:[big ? "m_bigger" : "m_smaller"], vis:"",
          ans:String(big ? Math.max(a, b) : Math.min(a, b)), choices:numChoices([a, b]) };
      }
      const [lo, hi] = g === "g1" ? [10, 99] : [100, 999];
      let a = ri(lo, hi), b = Math.random() < .15 ? a : ri(lo, hi);
      if (Math.random() < .4 && a !== b) b = +String(a).split("").reverse().join("") || b; // 34 vs 43 is the real test
      const sign = a > b ? ">" : a < b ? "<" : "=", word = { ">":"m_greater", "<":"m_less", "=":"m_equal" };
      return { q:"Which sign goes in the middle?", say:["m_sign"], vis:eq(`${a} <span class="blank">?</span> ${b}`), ans:sign,
        choices:[">", "<", "="].map(s => ({ v:s, html:s, say:[word[s]] })), after:[...N(a), word[sign], ...N(b)] };
    } };

  SK.shapes = { name:"Shapes", ico:"🔷", tag:"Geometry",
    keys: g => (g === "prek" ? SHAPES2D : SHAPES_K).map(s => "m:shape:" + s),
    gen(g, key) { const s = key.split(":")[2], pool = (g === "prek" ? SHAPES2D : SHAPES_K).filter(x => x !== s);
      const opts = shuffle([s, ...shuffle(pool).slice(0, 2)]);
      return { q:`Show me the <b>${s}</b>`, say:["p_showme", "sh_" + s], vis:"", ans:s, choices:opts.map(o => ({ v:o, html:shape(o), say:["sh_" + o] })), after:["sh_" + s] }; } };

  SK.pattern = { name:"Patterns", ico:"🎨", tag:"What comes next",
    gen(g) {
      const [A, B, C] = shuffle(["🍎", "🍌", "🫐", "⭐", "🌙", "❤️", "🐸", "🚗", "🎈"]);
      const units = g === "prek" ? [[A, B]] : [[A, B], [A, A, B], [A, B, B], [A, B, C]];
      const u = one(units), len = u.length * 2 + ri(1, u.length), seq = Array.from({ length: len }, (_, i) => u[i % u.length]);
      const ans = u[len % u.length], opts = shuffle([...new Set([A, B, C])]);
      return { q:"What comes next?", say:["m_next"], vis:`<div class="pattern">${seq.map(x => `<i>${x}</i>`).join("")}<i class="blank">?</i></div>`,
        ans, choices:opts.map(o => ({ v:o, html:`<span class="emo">${o}</span>` })) };
    } };

  // addition and subtraction facts are items; bigger numbers are random problems
  SK.add = { name:"Add", ico:"➕", tag:"Addition",
    keys(g) {
      if (g === "k") { const k = []; for (let s = 2; s <= 10; s++) for (let a = 1; a < s; a++) k.push(`m:add:${a}+${s - a}`); return k; }
      if (g === "g1") { const k = []; for (let s = 0; s <= 20; s++) for (let a = 0; a <= 10; a++) if (s - a >= 0 && s - a <= 10) k.push(`m:add:${a}+${s - a}`); return k; }
      return null;
    },
    gen(g, key) {
      let a, b;
      if (key) [a, b] = key.split(":")[2].split("+").map(Number);
      else if (g === "g2") { a = ri(10, 89); b = ri(10, 99 - a); }
      else if (g === "g3") { a = ri(100, 899); b = ri(100, 999 - a); }
      else { a = ri(1000, 8999); b = ri(1000, 9999 - a); }
      const s = a + b, say = ["m_whatis", ...N(a), "m_plus", ...N(b)], after = [...N(a), "m_plus", ...N(b), "m_equals", ...N(s)];
      if (g === "k") { const e = one(EMOJI); return { q:`${a} + ${b} = ?`, say, vis:`<div class="sum">${objs(a, e)}<b>+</b>${objs(b, e)}</div>`, ans:String(s), choices:near(s, 3, 2, 0), after }; }
      if (g === "g1") return { q:"Add", say, vis:eq(`${a} + ${b} = <span class="blank">?</span>`), ans:String(s), pad:{}, after };
      return { q:"Add", say, vis:vert(a, "+", b), ans:String(s), pad:{}, after };
    } };
  SK.sub = { name:"Subtract", ico:"➖", tag:"Subtraction",
    keys(g) {
      if (g === "k") { const k = []; for (let a = 2; a <= 10; a++) for (let b = 1; b < a; b++) k.push(`m:sub:${a}-${b}`); return k; }
      if (g === "g1") { const k = []; for (let a = 1; a <= 20; a++) for (let b = Math.max(0, a - 10); b <= Math.min(a, 10); b++) k.push(`m:sub:${a}-${b}`); return k; }
      return null;
    },
    gen(g, key) {
      let a, b;
      if (key) [a, b] = key.split(":")[2].split("-").map(Number);
      else if (g === "g2") { a = ri(20, 99); b = ri(10, a); }
      else { a = ri(200, 999); b = ri(100, a); }
      const d = a - b, say = ["m_whatis", ...N(a), "m_minus", ...N(b)], after = [...N(a), "m_minus", ...N(b), "m_equals", ...N(d)];
      if (g === "k") return { q:`${a} − ${b} = ?`, say, vis:objs(a, one(EMOJI), a - b), ans:String(d), choices:near(d, 3, 2, 0), after };
      if (g === "g1") return { q:"Subtract", say, vis:eq(`${a} − ${b} = <span class="blank">?</span>`), ans:String(d), pad:{}, after };
      return { q:"Subtract", say, vis:vert(a, "−", b), ans:String(d), pad:{}, after };
    } };

  SK.make10 = { name:"Make Ten", ico:"🔟", tag:"Ten frame",
    keys: g => range(g === "k" ? 1 : 0, g === "k" ? 9 : 10).map(n => "m:m10:" + n),
    gen(g, key) { const n = +key.split(":")[2], a = 10 - n;
      return { q:"How many more to make 10?", say:["m_make10"], vis:tenFrame(n), ans:String(a), ...(g === "k" ? { choices:near(a, 3, 2, 0) } : { pad:{} }),
        after:[...N(n), "m_plus", ...N(a), "m_equals", "n_10"] }; } };

  SK.placevalue = { name:"Place Value", ico:"🟨", tag:"Golden beads",
    gen(g) {
      if (g === "g1" || g === "g2") {
        const h = g === "g2" ? ri(1, 9) : 0, t = ri(g === "g1" ? 1 : 0, 9), o = ri(0, 9), n = h * 100 + t * 10 + o;
        return { q:"What number do the beads show?", say:["m_beads"], vis:beads(h, t, o), ans:String(n), pad:{}, after:N(n) };
      }
      let n = ri(10000, 999999), s = String(n), i = ri(0, s.length - 1);
      while (s[i] === "0" || s.indexOf(s[i]) !== s.lastIndexOf(s[i])) { n = ri(10000, 999999); s = String(n); i = ri(0, s.length - 1); }
      const d = +s[i], p = s.length - 1 - i, val = d * 10 ** p;
      const pows = shuffle(range(0, s.length - 1).filter(x => x !== p)).slice(0, 3);
      return { q:`What is the value of the <b>${d}</b> in ${fmt(n)}?`, say:["m_digitvalue", "n_" + d, "m_in", ...N(n)], vis:"", ans:String(val),
        choices:numChoices([val, ...pows.map(x => d * 10 ** x)]), after:N(val) };
    } };

  SK.time = { name:"Clock", ico:"🕒", tag:"Telling time",
    gen(g) {
      const h = ri(1, 12), m = g === "g1" ? one([0, 30]) : g === "g2" ? ri(0, 11) * 5 : ri(0, 59);
      const opts = new Map([[timeText(h, m), [h, m]]]), add = (H, M) => { H = (H + 11) % 12 + 1; if (M >= 0 && M < 60) opts.set(timeText(H, M), [H, M]); };
      if (g === "g1") { add(h, 30 - m); add(h + 1, m); add(h - 1, m); }
      else { add(m / 5 | 0 || 12, h * 5 % 60); add(h + 1, m); add(h, (m + 5) % 60); add(h - 1, m); add(h, (m + 30) % 60); }
      const list = [...opts].slice(0, g === "g1" ? 3 : 4);
      return { q:"What time is it?", say:["m_whattime"], vis:clock(h, m), ans:timeText(h, m),
        choices:shuffle(list).map(([t, [H, M]]) => ({ v:t, html:t, say:timeSay(H, M) })), after:timeSay(h, m) };
    } };

  SK.money = { name:"Money", ico:"🪙", tag:"Coins",
    gen() {
      let list = [];
      while (list.length < 2) list = [...Array(ri(0, 3)).fill(25), ...Array(ri(0, 3)).fill(10), ...Array(ri(0, 2)).fill(5), ...Array(ri(0, 4)).fill(1)];
      const t = list.reduce((a, b) => a + b, 0);
      return { q:"How many cents?", say:["m_howmuch"], vis:coins(list), ans:String(t), pad:{}, after:[...N(t), "m_cents"] };
    } };

  SK.skip = { name:"Skip Count", ico:"🦘", tag:"Number patterns",
    keys: () => [2, 5, 10, 100, 3, 4].map(s => "m:skip:" + s),
    gen(g, key) { const st = +key.split(":")[2], start = st * ri(0, st === 100 ? 4 : 6), miss = ri(1, 4);
      const seq = range(0, 4).map(i => start + i * st), ans = seq[miss];
      return { q:`Count by ${st}s. What number is missing?`, say:["m_countby", ...N(st), "m_missing"],
        vis:`<div class="seq">${seq.map((v, i) => i === miss ? `<span class="blank">?</span>` : `<span>${fmt(v)}</span>`).join("")}</div>`, ans:String(ans), pad:{}, after:N(ans) }; } };

  SK.evenodd = { name:"Even or Odd", ico:"👯", tag:"Pairs",
    gen() { const n = Math.random() < .5 ? ri(1, 20) : ri(21, 99), even = n % 2 === 0;
      const vis = n <= 20 ? `<div class="pairs">${Array.from({ length: Math.ceil(n / 2) }, (_, i) => `<span><i></i>${2 * i + 1 < n ? "<i></i>" : ""}</span>`).join("")}</div>` : "";
      return { q:`Is <b>${n}</b> even or odd?`, say:["m_evenodd"], vis:eq(String(n)) + vis, ans:even ? "even" : "odd",
        choices:[{ v:"even", html:"Even", say:["m_even"] }, { v:"odd", html:"Odd", say:["m_odd"] }], after:[...N(n), even ? "m_iseven" : "m_isodd"] }; } };

  // times tables in a friendly order: 2s, 10s, 5s first
  const TABLES = [2, 10, 5, 3, 4, 1, 0, 6, 7, 8, 9];
  SK.mult = { name:"Multiply", ico:"✖️", tag:"Times tables",
    keys: g => g === "g3" ? TABLES.flatMap(a => range(0, 10).map(b => `m:mul:${a}x${b}`)) : null,
    gen(g, key) {
      let a, b;
      if (key) [a, b] = key.split(":")[2].split("x").map(Number);
      else if (g === "g4") { if (Math.random() < .3) { a = ri(1, 9) * one([10, 100]); b = ri(2, 9); } else { a = ri(12, 99); b = ri(2, 9); } }
      else { a = ri(12, 99); b = ri(11, 49); }
      if (key && Math.random() < .5) [a, b] = [b, a];
      const p = a * b, say = ["m_whatis", ...N(a), "m_times", ...N(b)], after = [...N(a), "m_times", ...N(b), "m_equals", ...N(p)];
      if (g === "g3") return { q:"Multiply", say, vis:eq(`${a} × ${b} = <span class="blank">?</span>`) + (a && b && a <= 6 && b <= 6 ? arrayPic(a, b) : ""), ans:String(p), pad:{}, after };
      return { q:"Multiply", say, vis:vert(a, "×", b), ans:String(p), pad:{}, after };
    } };
  SK.div = { name:"Divide", ico:"➗", tag:"Sharing equally",
    keys: g => g === "g3" ? TABLES.filter(b => b > 0).flatMap(b => range(0, 10).map(q => `m:div:${b * q}/${b}`)) : null,
    gen(g, key) {
      if (key) { const [p, b] = key.split(":")[2].split("/").map(Number), q = p / b;
        return { q:"Divide", say:["m_whatis", ...N(p), "m_divby", ...N(b)], vis:eq(`${p} ÷ ${b} = <span class="blank">?</span>`), ans:String(q), pad:{}, after:[...N(p), "m_divby", ...N(b), "m_equals", ...N(q)] }; }
      if (g === "g4") {
        const b = ri(2, 9), q = ri(3, 12), r = ri(0, b - 1), p = b * q + r, show = (Q, R) => R ? `${Q} R${R}` : String(Q);
        const opts = new Map([[show(q, r), [q, r]]]);
        for (const [Q, R] of shuffle([[q + 1, r], [q - 1, r], [q, (r + 1) % b], [q + 1, 0], [q, r + b]])) if (opts.size < 4 && Q > 0 && !opts.has(show(Q, R))) opts.set(show(Q, R), [Q, R]);
        const sayQR = (Q, R) => [...N(Q), ...(R ? ["m_remainder", ...N(R)] : [])];
        return { q:"Divide", say:["m_whatis", ...N(p), "m_divby", ...N(b)], vis:eq(`${p} ÷ ${b} = <span class="blank">?</span>`), ans:show(q, r),
          choices:shuffle([...opts]).map(([t, [Q, R]]) => ({ v:t, html:t, say:sayQR(Q, R) })), after:[...N(p), "m_divby", ...N(b), "m_equals", ...sayQR(q, r)] };
      }
      const b = ri(11, 25), q = ri(4, Math.floor(999 / b)), p = b * q;
      return { q:"Divide", say:["m_whatis", ...N(p), "m_divby", ...N(b)], vis:eq(`${p} ÷ ${b} = <span class="blank">?</span>`), ans:String(q), pad:{}, after:[...N(p), "m_divby", ...N(b), "m_equals", ...N(q)] };
    } };

  SK.fractions = { name:"Fractions", ico:"🍕", tag:"Parts of a whole",
    keys: g => g === "g3" ? [2, 4, 3, 8, 6].flatMap(d => range(1, d - 1).map(n => `m:frac:${n}/${d}`)) : null,
    gen(g, key) {
      if (key) {
        const [n, d] = key.split(":")[2].split("/").map(Number), seen = new Set([n + "/" + d]), opts = [[n, d]];
        for (const [a, b] of shuffle([[d - n, d], [n, d + 1], [n + 1, d], [n, d * 2], [n - 1 || 1, d], [n, d - 1]])) if (opts.length < 4 && a > 0 && b > 0 && a !== b && !seen.has(a + "/" + b)) { seen.add(a + "/" + b); opts.push([a, b]); }
        return { q:"What fraction is shaded?", say:["m_fracshaded"], vis:fracPic(n, d, one(["bar", "pie"])), ans:n + "/" + d,
          choices:shuffle(opts).map(([a, b]) => ({ v:a + "/" + b, html:frac(a, b), say:F(a, b) })), after:F(n, d) };
      }
      if (g === "g4") {
        if (Math.random() < .5) {
          const d = one([2, 3, 4, 5]), n = ri(1, d - 1), k = ri(2, 4);
          return { q:"Fill in the missing number.", say:["m_missing"], vis:eq(`${frac(n, d)} = ${frac(`<span class="blank">?</span>`, d * k)}`), ans:String(n * k), pad:{}, after:[...F(n, d), "m_equals", ...F(n * k, d * k)] };
        }
        let a, b, c, d; do { b = one([2, 3, 4, 5, 6, 8, 10, 12]); d = one([2, 3, 4, 5, 6, 8, 10, 12]); a = ri(1, b - 1); c = ri(1, d - 1); } while (b === d || a * d === c * b);
        const big = a * d > c * b ? [a, b] : [c, d];
        return { q:"Which fraction is bigger?", say:["m_bigfrac"], vis:"", ans:big.join("/"), choices:[[a, b], [c, d]].map(([x, y]) => ({ v:x + "/" + y, html:frac(x, y), say:F(x, y) })) };
      }
      // 5th: add, subtract or multiply fractions with unlike denominators
      const D = [2, 3, 4, 5, 6, 8, 10, 12];
      let a, b, c, d, n, m, op;
      do {
        b = one(D); d = one(D); a = ri(1, b - 1); c = ri(1, d - 1); op = one(["+", "−", "×"]);
        if (op === "+") { n = a * d + c * b; m = b * d; } else if (op === "−") { n = a * d - c * b; m = b * d; } else { n = a * c; m = b * d; }
      } while (b === d && op !== "×" || n <= 0 || n >= m || !DENOM[m / gcd(n, m)]);  // answers stay in denominators we can say
      const right = fracVal(n, m), seen = new Set([right.v]), opts = [right];
      const tryAdd = (x, y) => { if (opts.length >= 4 || x <= 0 || y <= 0 || x >= y) return; const f = fracVal(x, y); const [p, q] = f.v.split("/").map(Number); if (p * m === n * q || seen.has(f.v) || !DENOM[q]) return; seen.add(f.v); opts.push(f); };
      if (op === "+") tryAdd(a + c, b + d); if (op === "−") tryAdd(Math.abs(a - c), Math.abs(b - d)); if (op === "×") tryAdd(a * d, b * c);
      const [rn, rd] = right.v.split("/").map(Number);
      for (const [x, y] of shuffle([[rn + 1, rd], [rn - 1, rd], [rn, rd + 1], [rn, rd - 1], [rn + 1, rd + 2], [n, m + 1]])) tryAdd(x, y);
      for (const y of [rd, 2, 3, 4, 5, 6, 8, 10, 12]) for (let x = 1; x < y && opts.length < 4; x++) tryAdd(x, y);
      const opw = { "+":"m_plus", "−":"m_minus", "×":"m_times" }[op];
      return { q:"Solve. Pick the simplest answer.", say:["m_whatis", ...F(a, b), opw, ...F(c, d)], vis:eq(`${frac(a, b)} ${op} ${frac(c, d)} = <span class="blank">?</span>`),
        ans:right.v, choices:shuffle(opts).map(f => ({ v:f.v, html:f.html, say:f.say })), after:[...F(a, b), opw, ...F(c, d), "m_equals", ...right.say] };
    } };

  SK.round = { name:"Rounding", ico:"🎯", tag:"Estimating",
    gen(g) {
      const [n, to] = g === "g3" ? (Math.random() < .5 ? [ri(11, 999), 10] : [ri(101, 999), 100]) : (Math.random() < .5 ? [ri(1001, 9999), 100] : [ri(1001, 99999), 1000]);
      if (n % to === 0) return SK.round.gen(g);
      const lo = Math.floor(n / to) * to, hi = lo + to, ans = n - lo >= to / 2 ? hi : lo;
      const wrong = [lo, hi].concat([Math.round(n / (to * 10)) * to * 10, lo - to, hi + to].filter(v => v >= 0 && v !== lo && v !== hi)).slice(0, 3);
      const toClip = { 10:"n_10", 100:"n_hundred", 1000:"n_thousand" }[to];
      const line = `<svg class="nline" viewBox="0 0 300 60" role="img" aria-label="number line"><line x1="20" y1="30" x2="280" y2="30" stroke="#17203F" stroke-width="3"/>
        <line x1="20" y1="20" x2="20" y2="40" stroke="#17203F" stroke-width="3"/><line x1="280" y1="20" x2="280" y2="40" stroke="#17203F" stroke-width="3"/><line x1="150" y1="24" x2="150" y2="36" stroke="#5A6688" stroke-width="2"/>
        <circle cx="${20 + (n - lo) / to * 260}" cy="30" r="7" fill="#DC3B3B"/><text x="20" y="58" text-anchor="middle" font-size="14" fill="#17203F">${fmt(lo)}</text><text x="280" y="58" text-anchor="middle" font-size="14" fill="#17203F">${fmt(hi)}</text></svg>`;
      return { q:`Round <b>${fmt(n)}</b> to the nearest ${fmt(to)}.`, say:["m_round", ...N(n), "m_tonearest", toClip], vis:g === "g3" ? line : "", ans:String(ans),
        choices:numChoices([...new Set(wrong.includes(ans) ? wrong : [ans, ...wrong])].slice(0, 3)), after:N(ans) };
    } };

  SK.area = { name:"Area", ico:"📐", tag:"Measurement",
    gen(g) {
      if (g === "g3") { const w = ri(2, 6), h = ri(2, 5), a = w * h;
        return { q:"What is the area? Count the squares.", say:["m_area"], vis:grid(w, h), ans:String(a), pad:{}, after:[...N(a), "m_squnits"] }; }
      if (g === "g4") { const w = ri(3, 12), h = ri(2, 10), u = one(["cm", "m", "ft", "in"]), per = Math.random() < .5, a = per ? 2 * (w + h) : w * h;
        return { q:per ? "What is the perimeter?" : "What is the area?", say:[per ? "m_perimeter" : "m_area"], vis:rectPic(w, h, u), ans:String(a), pad:{}, after:[...N(a), per ? "m_units" : "m_squnits"] }; }
      const l = ri(2, 9), w = ri(2, 6), h = ri(2, 7), v = l * w * h;
      return { q:"What is the volume?", say:["m_volume"], vis:boxPic(l, w, h), ans:String(v), pad:{}, after:[...N(v), "m_cubunits"] };
    } };

  SK.decimals = { name:"Decimals", ico:"🔘", tag:"Tenths and hundredths",
    gen(g) {
      const t = Math.random();
      if (g === "g4") {
        if (t < .5) { const d = one([10, 100]), n = d === 10 ? ri(1, 9) : ri(1, 99), dec = (n / d).toFixed(d === 10 ? 1 : 2);
          // the usual mix-ups: wrong place, or the number written as a whole
          const opts = [...new Set([dec, (n / (d === 10 ? 100 : 10)).toFixed(d === 10 ? 2 : 1), String(n) + ".0", (n / 1000).toFixed(3)].filter(x => +x > 0))].slice(0, 4);
          return { q:"Which decimal means the same?", say:["m_asdecimal"], vis:eq(frac(n, d)), ans:dec, choices:shuffle(opts).map(v => ({ v, html:v, say:Dc(v) })), after:Dc(dec) }; }
        let a = (ri(1, 9) / 10).toFixed(1), b = (ri(11, 99) / 100).toFixed(2); while (+a === +b) b = (ri(11, 99) / 100).toFixed(2);
        const big = +a > +b ? a : b;
        return { q:"Which decimal is bigger?", say:["m_bigdec"], vis:"", ans:big, choices:shuffle([a, b]).map(v => ({ v, html:v, say:Dc(v) })) };
      }
      if (t < .5) { const a = ri(100, 999) / 100, b = ri(10, 999) / 100, add = Math.random() < .6 || a < b, r = add ? a + b : a - b;
        return { q:add ? "Add" : "Subtract", say:["m_whatis", ...Dc(a.toFixed(2)), add ? "m_plus" : "m_minus", ...Dc(b.toFixed(2))], vis:vert(a.toFixed(2), add ? "+" : "−", b.toFixed(2)),
          ans:String(+r.toFixed(2)), pad:{ dec:true }, after:Dc(String(+r.toFixed(2))) }; }
      const a = ri(11, 999) / 100, p = one([10, 100, 1000]), mul = Math.random() < .6, r = mul ? a * p : a / p, ans = String(+r.toFixed(5));
      return { q:mul ? "Multiply" : "Divide", say:["m_whatis", ...Dc(String(a)), mul ? "m_times" : "m_divby", ...N(p)], vis:eq(`${a} ${mul ? "×" : "÷"} ${fmt(p)} = <span class="blank">?</span>`),
        ans, pad:{ dec:true }, after:Dc(ans) };
    } };

  SK.factors = { name:"Factors", ico:"🧱", tag:"Number sense",
    gen() {
      if (Math.random() < .5) { const n = ri(2, 50), divs = range(2, n - 1).filter(d => n % d === 0), prime = divs.length === 0;
        return { q:`Is <b>${n}</b> prime or composite?`, say:["m_primeq"], vis:eq(String(n)), ans:prime ? "prime" : "composite",
          choices:[{ v:"prime", html:"Prime", say:["m_prime"] }, { v:"composite", html:"Composite", say:["m_composite"] }] }; }
      const n = one([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 54, 56, 60, 63, 72]);
      const f = one(range(2, n - 1).filter(d => n % d === 0)), non = shuffle(range(2, Math.min(n - 1, 20)).filter(d => n % d !== 0)).slice(0, 2);
      return { q:`Which number is a factor of <b>${n}</b>?`, say:["m_factorof", ...N(n)], vis:"", ans:String(f), choices:numChoices([f, ...non]) };
    } };

  SK.order = { name:"Order of Operations", ico:"🧮", tag:"Expressions",
    gen() {
      const a = ri(2, 9), b = ri(2, 9), c = ri(2, 9), e = ri(1, Math.min(9, a * b));
      const forms = [[`${a} + ${b} × ${c}`, a + b * c], [`(${a} + ${b}) × ${c}`, (a + b) * c], [`${a} × ${b} − ${e}`, a * b - e],
        [`${a * c} ÷ ${c} + ${b}`, a + b], [`${a} × (${b} + ${c})`, a * (b + c)], [`${a + b * c} − ${b} × ${c}`, a]];
      const [s, v] = one(forms);
      return { q:"Use the order of operations.", say:["m_order"], vis:eq(`${s} = <span class="blank">?</span>`), ans:String(v), pad:{}, after:["p_answeris", ...N(v)] };
    } };

  // Quick Look (subitizing): dots flash for a moment, then "how many did you see?" Small amounts in dice
  // patterns, bigger ones in ten frames, so children learn to see amounts without counting one by one.
  const DICE = { 1:[[1,1]], 2:[[0,0],[2,2]], 3:[[0,0],[1,1],[2,2]], 4:[[0,0],[0,2],[2,0],[2,2]], 5:[[0,0],[0,2],[1,1],[2,0],[2,2]], 6:[[0,0],[1,0],[2,0],[0,2],[1,2],[2,2]] };
  const dice = n => `<div class="dice">${Array.from({ length: 9 }, (_, i) => `<span>${DICE[n].some(([r, c]) => r * 3 + c === i) ? "<i></i>" : ""}</span>`).join("")}</div>`;
  SK.quicklook = { name:"Quick Look", ico:"👀", tag:"Seeing amounts (subitizing)",
    keys: g => range(1, g === "prek" ? 5 : 10).map(n => "m:ql:" + n),
    gen(g, key) {
      const n = +key.split(":")[2], pic = n <= 6 && Math.random() < .7 ? dice(n) : tenFrame(n);
      return { q:"Quick look! How many did you see?", say:["m_quicklook"],
        vis:`<button class="flash" aria-label="Look again" onclick="this.classList.remove('flash');void this.offsetWidth;this.classList.add('flash')">${pic}</button><small class="hint">Tap the box to look again</small>`,
        ans:String(n), choices:near(n, g === "prek" ? 3 : 4, 2, 1), after:N(n) };
    } };
  // Number bonds: a whole and its two parts; one is missing
  SK.bonds = { name:"Number Bonds", ico:"🔗", tag:"Part-part-whole",
    keys: g => { const k = []; for (let w = g === "k" ? 3 : 6; w <= (g === "k" ? 10 : 20); w++) for (let a = 0; a <= w; a++) if (g !== "k" || w <= 10) k.push(`m:bond:${w}-${a}`); return k.filter((_, i) => g === "k" || i % 2 === 0); },
    gen(g, key) {
      const [w, a] = key.split(":")[2].split("-").map(Number), b = w - a, hide = one(["whole", "part"]);
      const ans = hide === "whole" ? w : b, cell = (v, top) => `<span class="bond ${top ? "top" : ""}">${v}</span>`;
      const vis = `<div class="bonds">${cell(hide === "whole" ? `<span class="blank">?</span>` : w, true)}<div class="parts">${cell(a)}${cell(hide === "part" ? `<span class="blank">?</span>` : b)}</div></div>`;
      return { q: hide === "whole" ? "The parts make the whole. What is the whole?" : "The parts make the whole. What is the missing part?", say:["m_missing"], vis, ans:String(ans),
        ...(g === "k" ? { choices:near(ans, 3, 2, 0) } : { pad:{} }), after:[...N(a), "m_and", ...N(b), "m_make", ...N(w)] };
    } };
  // Number line: where is the arrow?
  SK.numline = { name:"Number Line", ico:"📏", tag:"Numbers in order",
    gen(g) {
      const [max, step, lab] = g === "k" ? [10, 1, 5] : g === "g1" ? [20, 1, 5] : [100, 10, 50];
      // 2nd grade lands on fives along a 0-100 line; younger grades on any whole number
      const target = g === "g2" ? ri(1, 19) * 5 : ri(1, max - 1), x = v => 20 + v / max * 300;
      const ticks = range(0, max / step).map(i => i * step).map(v => `<line x1="${x(v)}" y1="${v % lab ? 34 : 28}" x2="${x(v)}" y2="${v % lab ? 46 : 52}" stroke="#17203F" stroke-width="${v % lab ? 2 : 3}"/>${v % lab ? "" : `<text x="${x(v)}" y="72" text-anchor="middle" font-size="15" font-weight="700" fill="#17203F">${v}</text>`}`).join("");
      const minor = g === "g2" ? range(0, 20).map(i => i * 5).filter(v => v % 10).map(v => `<line x1="${x(v)}" y1="36" x2="${x(v)}" y2="44" stroke="#5A6688" stroke-width="1.5"/>`).join("") : "";
      const vis = `<svg class="nline big" viewBox="0 0 340 80" role="img" aria-label="number line"><line x1="20" y1="40" x2="320" y2="40" stroke="#17203F" stroke-width="3"/>${ticks}${minor}
        <path d="M${x(target)} 26 l-9 -14 h18 z" fill="#DC3B3B"/></svg>`;
      return { q:"What number is the arrow pointing to?", say:["m_numline"], vis, ans:String(target), choices:numChoices([...new Set([target, target + (g === "g2" ? 5 : 1), target - (g === "g2" ? 5 : 1), target + (g === "g2" ? 10 : 2)])].filter(v => v >= 0 && v <= max).slice(0, 3)), after:N(target) };
    } };

  // The skills each grade shows: [skill, short description, name override]
  const GRADE_SKILLS = {
    prek:[["numcards", "Numbers 0 to 10"], ["quicklook", "See up to 5 at a glance"], ["count", "Count up to 10 things"], ["tracenum", "Trace 0 to 9"], ["compare", "Which group has more?"], ["shapes", "Circle, square, triangle"], ["pattern", "What comes next?"]],
    k:[["numcards", "Numbers 0 to 20"], ["quicklook", "See up to 10 at a glance"], ["count", "Count up to 20 things"], ["bonds", "Parts that make 3 to 10"], ["add", "Add within 10 with pictures"], ["sub", "Take away within 10"],
      ["make10", "How many more make 10?"], ["numline", "Number line 0 to 10"], ["compare", "Which number is bigger?"], ["tracenum", "Trace 0 to 20"], ["shapes", "Flat and solid shapes"], ["pattern", "Trickier patterns"]],
    g1:[["add", "Add within 20"], ["sub", "Subtract within 20"], ["bonds", "Number bonds to 20"], ["make10", "Make 10 fast"], ["placevalue", "Tens and ones"], ["numline", "Number line 0 to 20"], ["compare", "Greater than, less than"], ["time", "Hour and half hour"]],
    g2:[["add", "Add 2-digit numbers"], ["sub", "Subtract 2-digit numbers"], ["placevalue", "Hundreds, tens and ones"], ["skip", "Count by 2s, 5s, 10s, 100s"], ["numline", "Number line 0 to 100"],
      ["evenodd", "Even or odd?"], ["money", "Count coins"], ["time", "Time to 5 minutes"], ["compare", "Compare 3-digit numbers"]],
    g3:[["mult", "Times tables to 10 × 10"], ["div", "Division facts"], ["fractions", "Name the fraction"], ["round", "Round to 10 and 100"],
      ["area", "Area with squares"], ["time", "Time to the minute"], ["add", "Add 3-digit numbers"], ["sub", "Subtract 3-digit numbers"]],
    g4:[["mult", "Multiply by 1 digit"], ["div", "Divide with remainders"], ["fractions", "Equivalent and compare"], ["decimals", "Tenths and hundredths"],
      ["placevalue", "Value of a digit"], ["round", "Round big numbers"], ["factors", "Factors and primes"], ["area", "Area and perimeter"]],
    g5:[["fractions", "Add, subtract, multiply"], ["decimals", "Decimal operations"], ["mult", "2-digit by 2-digit"], ["div", "Divide by 2 digits"],
      ["order", "Order of operations"], ["area", "Volume of boxes", "Volume"]]
  };

  // readable label for a practice item, e.g. "m:mul:7x8" -> "7 × 8"
  function label(k) {
    const [, s, v] = k.split(":");
    if (!v || isNaN(parseInt(v))) return SK[s] ? SK[s].name : v || s;
    return { add:v.replace("+", " + "), sub:v.replace("-", " − "), mul:v.replace("x", " × "), div:v.replace("/", " ÷ "), m10:v + " + ? = 10", frac:v, skip:"by " + v + "s", count:"count " + v, num:"number " + v, trace:"trace " + v }[s] || v;
  }

  return { SK, GRADE_SKILLS, PHRASES, N, F, Dc, clips, label, objs, shape, numWord, EMOJI };
})();
