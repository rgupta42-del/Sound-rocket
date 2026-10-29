// Sound Rocket phonemic-awareness games (listening skills that come before and alongside phonics):
// Rhyme Time, Clap It (syllables), Sound Boxes (Elkonin boxes: how many sounds) and Last Sound.
// Same problem format as js/math.js, so they run on the same practice screen.

window.READGAMES = (() => {
  const D = window.DATA;
  const one = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const W = w => "w_" + w.toLowerCase().replace(/[^a-z]/g, "");
  const big = e => `<span class="emo big">${e}</span>`;

  // picture words to play with (the emoji has to be clear)
  const PIC = { cat:"🐱", hat:"🎩", bat:"🦇", rat:"🐀", map:"🗺️", cap:"🧢", jam:"🍓", pan:"🍳", van:"🚐", fan:"🪭", can:"🥫", bag:"👜",
    pig:"🐷", pin:"📌", fin:"🦈", lip:"👄", dog:"🐶", log:"🪵", fox:"🦊", box:"📦", mop:"🧹", pot:"🍲",
    sun:"☀️", bun:"🍔", bug:"🐛", rug:"🧶", mug:"☕", cup:"🥤", pup:"🐕", bus:"🚌", nut:"🥜", hut:"🛖",
    bed:"🛏️", hen:"🐔", pen:"🖊️", ten:"🔟", net:"🥅", jet:"✈️", leg:"🦵", web:"🕸️",
    cake:"🎂", snake:"🐍", lake:"🏞️", boat:"⛵", goat:"🐐", coat:"🧥", car:"🚗", star:"⭐", jar:"🫙",
    bee:"🐝", tree:"🌳", three:"3️⃣", moon:"🌙", spoon:"🥄", ring:"💍", king:"🤴", wing:"🪽", duck:"🦆", truck:"🚚", sock:"🧦", rock:"🪨", clock:"🕰️",
    fish:"🐟", dish:"🍽️", ship:"🚢", chick:"🐥", frog:"🐸", drum:"🥁", crab:"🦀", flag:"🚩", plant:"🌱", tent:"⛺", nest:"🪺", hand:"✋",
    kite:"🪁", bone:"🦴", rain:"🌧️", train:"🚆", snail:"🐌", bird:"🐦", horse:"🐴", corn:"🌽", fork:"🍴", shirt:"👕" };
  const rime = w => w.replace(/^[^aeiou]+/, "");          // cat -> at, ship -> ip, snake -> ake
  const RHYMES = {};
  Object.keys(PIC).forEach(w => (RHYMES[rime(w)] ||= []).push(w));
  const RHYME_WORDS = Object.keys(PIC).filter(w => RHYMES[rime(w)].length >= 2);

  // syllables, for clapping: [word, picture, claps]
  const CLAP = [["cat","🐱",1],["dog","🐶",1],["sun","☀️",1],["fish","🐟",1],["frog","🐸",1],["star","⭐",1],["boat","⛵",1],["cake","🎂",1],
    ["apple","🍎",2],["rabbit","🐇",2],["rocket","🚀",2],["pumpkin","🎃",2],["turtle","🐢",2],["zebra","🦓",2],["pencil","✏️",2],["lemon","🍋",2],["monkey","🐒",2],["tiger","🐯",2],["robot","🤖",2],["cupcake","🧁",2],
    ["octopus","🐙",3],["banana","🍌",3],["elephant","🐘",3],["butterfly","🦋",3],["dinosaur","🦕",3],["kangaroo","🦘",3],["umbrella","☂️",3],["computer","💻",3],
    ["caterpillar","🐛",4],["watermelon","🍉",4],["helicopter","🚁",4],["alligator","🐊",4]];
  const CLAPS = n => "👏".repeat(n);

  // sound boxes: picture words and their sounds (sh, ch, th, ck, ee, oo, ng count as one sound)
  const BOX_WORDS = ["cat","pig","sun","dog","bed","hen","fox","bug","map","web","fish","ship","duck","chick","sock","moon","bee","tree","ring","frog","drum","crab","flag","nest","hand","tent","plant","truck","spoon","sheep","teeth"]
    .filter(w => PIC[w] || ["sheep","teeth"].includes(w));
  const PIC2 = { ...PIC, sheep:"🐑", teeth:"🦷" };

  // last sound: CVC picture words whose final sound is clear
  const LAST = ["cat","bat","map","cap","jam","van","fan","bag","pig","pin","lip","fin","dog","log","fox","box","mop","pot","sun","bug","cup","bus","nut","bed","hen","net","leg","web","duck","fish","ship","moon","ring","drum"];
  const lastSound = w => D.tiles(w).slice(-1)[0];
  const SN = s => "s_" + (D.SOUND_CLIP[s] || s);
  const isVowel = t => D.VOWELS.includes(D.SOUND_CLIP[t] || t);

  const SK = {};
  SK.rhyme = { name: "Rhyme Time", ico: "🎵", tag: "Rhyming",
    keys: () => RHYME_WORDS.map(w => "r:rhyme:" + w),
    gen(g, key) {
      const w = key.split(":")[2], match = one(RHYMES[rime(w)].filter(x => x !== w));
      const others = shuffle(Object.keys(PIC).filter(x => rime(x) !== rime(w) && (x[0] === w[0] || x.slice(-1) === w.slice(-1) || Math.random() < .3)));
      const ds = []; for (const x of others) if (ds.length < 2 && !ds.some(y => rime(y) === rime(x))) ds.push(x);
      return { q: `Which one rhymes with <b>${w}</b>?`, say: ["p_rhyme", W(w)], vis: big(PIC[w]), ans: match,
        choices: shuffle([match, ...ds]).map(x => ({ v: x, html: `<span class="emo">${PIC[x]}</span>`, say: [W(x)] })), after: [W(w), W(match)] };
    } };
  SK.clap = { name: "Clap It", ico: "👏", tag: "Syllables",
    keys: g => CLAP.filter(c => g !== "prek" || c[2] <= 3).map(([w]) => "r:clap:" + w),   // Pre-K claps up to 3
    gen(g, key) {
      const [w, pic, n] = CLAP.find(c => c[0] === key.split(":")[2]), max = g === "prek" ? 3 : 4;
      const opts = [1, 2, 3, 4].slice(0, max);
      return { q: `Clap the word <b>${w}</b>. How many claps?`, say: ["p_claps", W(w)], vis: big(pic), ans: String(n),
        choices: opts.map(c => ({ v: String(c), html: `<span class="claps">${CLAPS(c)}</span>`, say: ["n_" + c] })), after: [W(w), "n_" + n] };
    } };
  SK.boxes = { name: "Sound Boxes", ico: "🟦", tag: "Elkonin boxes",
    keys: () => BOX_WORDS.map(w => "r:boxes:" + w),
    gen(g, key) {
      const w = key.split(":")[2], parts = D.tiles(w), n = parts.length;
      const opts = [2, 3, 4, 5].filter(x => x !== n).slice(0, 2).concat(n).sort();
      return { q: `How many sounds do you hear in <b>${w}</b>?`, say: ["p_howmanysounds", W(w)],
        vis: `${big(PIC2[w])}<div class="soundboxes">${parts.map(() => "<i></i>").join("")}</div>`, ans: String(n),
        choices: opts.map(c => ({ v: String(c), html: `<span class="boxrow">${"<i></i>".repeat(c)}</span>${c}`, say: ["n_" + c] })),
        // the answer is shown as the word in its boxes, one sound each, while the sounds play
        after: [...parts.map(SN), W(w)], reveal: `<div class="soundboxes full">${parts.map(p => `<i class="${isVowel(p) ? "v" : "c"}">${p}</i>`).join("")}</div>` };
    } };
  SK.lastsound = { name: "Last Sound", ico: "🔚", tag: "Ending sounds",
    keys: () => LAST.map(w => "r:last:" + w),
    gen(g, key) {
      const w = key.split(":")[2], s = lastSound(w);
      const pool = shuffle(["t","p","m","n","g","x","s","d","b","ck","sh","ng"].filter(x => x !== s)).slice(0, 2);
      return { q: `What sound does <b>${w}</b> end with?`, say: ["p_endswith", W(w)], vis: big(PIC[w]), ans: s,
        choices: shuffle([s, ...pool]).map(x => ({ v: x, html: `<span class="letter" style="color:var(${isVowel(x) ? "--vowel" : "--cons"})">${D.SOUNDS[x][0]}</span>`, say: [SN(x)] })), after: [W(w), SN(s)] };
    } };

  // every word these games say, for tools/export_list.js
  const words = () => [...Object.keys(PIC), ...CLAP.map(c => c[0]), "sheep", "teeth"];
  const PHRASES = { rhyme: "Which one rhymes with", claps: "Clap the word, and count the claps.", howmanysounds: "How many sounds do you hear in", endswith: "What sound does it end with?" };
  return { SK, words, PHRASES };
})();
