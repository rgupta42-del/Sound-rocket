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
        vis: big(PIC2[w]), ans: String(n),
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

  // ---------- picture and look-alike games (they can be played without sound) ----------
  const LSN = x => SN(x === "q" ? "qu" : x);   // q is always said with its u ("kw")
  const LETTER = x => `<span class="letter" style="color:var(${isVowel(x) ? "--vowel" : "--cons"})">${x}</span>`;
  // Letter Match: capital to small letter, with the look-alikes children mix up
  const LOOKS = { a:"oe", b:"dpq", c:"eo", d:"bpq", e:"ac", f:"tl", g:"qy", h:"nb", i:"lj", j:"ig", k:"xh", l:"it", m:"nw", n:"muh", o:"ca", p:"qbd", q:"pgd", r:"nh",
    s:"zc", t:"fl", u:"nv", v:"uy", w:"mv", x:"kz", y:"gv", z:"sx" };
  SK.letters = { name:"Letter Match", ico:"🔠", tag:"Big and small letters",
    keys: () => Object.keys(LOOKS).map(l => "r:abc:" + l),
    gen(g, key) {
      const l = key.split(":")[2], ds = shuffle(LOOKS[l].split("")).slice(0, 2);
      return { q:"Find the small letter that matches", say:["p_matchletter"], vis:`<div class="bigletter">${l.toUpperCase()}</div>`, ans:l,
        choices:shuffle([l, ...ds]).map(x => ({ v:x, html:LETTER(x), say:[LSN(x)] })), after:[LSN(l)] };
    } };
  // Missing Letters: look at the picture and the word, pick what fills the gap (K: the vowel; 1st: sh ch th ck ng; 2nd: vowel teams and bossy r)
  const MISS = {
    k: ["cat","hat","bat","map","cap","jam","van","fan","bag","pig","pin","fin","lip","dog","log","fox","box","mop","pot","sun","bun","bug","rug","mug","cup","bus","nut","bed","hen","pen","ten","net","jet","leg","web"],
    g1: [["fish","sh"],["dish","sh"],["ship","sh"],["chick","ch"],["duck","ck"],["sock","ck"],["rock","ck"],["clock","ck"],["truck","ck"],["ring","ng"],["king","ng"],["wing","ng"],["three","th"],["teeth","th"]],
    g2: [["boat","oa"],["goat","oa"],["coat","oa"],["rain","ai"],["train","ai"],["snail","ai"],["tree","ee"],["bee","ee"],["sheep","ee"],["moon","oo"],["spoon","oo"],["car","ar"],["star","ar"],["jar","ar"],["corn","or"],["fork","or"],["horse","or"],["bird","ir"],["shirt","ir"]] };
  const missOf = (g, w) => g === "k" ? w[1] : MISS[g].find(([x]) => x === w)[1];
  SK.missing = { name:"Missing Letters", ico:"🔡", tag:"Spelling by sight",
    keys: g => (g === "k" ? MISS.k : MISS[g].map(([w]) => w)).map(w => "r:miss:" + w),
    gen(g, key) {
      const w = key.split(":")[2], gap = missOf(g, w), at = w.indexOf(gap, g === "k" ? 1 : 0);
      const pool = g === "k" ? ["a","e","i","o","u"] : g === "g1" ? ["sh","ch","th","ck","ng"] : ["oa","ai","ee","oo","ar","or","ir"];
      const ds = shuffle(pool.filter(x => x !== gap)).slice(0, 2);
      const word = `${w.slice(0, at)}<span class="blank">${"_".repeat(gap.length)}</span>${w.slice(at + gap.length)}`;
      return { q:"Which letters are missing?", say:["p_missing"], vis:`${big(PIC2[w])}<div class="missword">${word}</div>`, ans:gap,
        choices:shuffle([gap, ...ds]).map(x => ({ v:x, html:LETTER(x), say:[SN(x)] })), after:[W(w)] };
    } };
  // Same Word: find the word spelled exactly the same (was / saw, on / no, b / d mix-ups): careful looking at sight words
  const SWAP = { b:"d", d:"b", p:"q", q:"p", m:"n", n:"m", u:"n", h:"n", e:"a", a:"o", o:"a", i:"l", l:"i", t:"f", f:"t", s:"z", w:"m", y:"g", r:"n", c:"e", g:"y", k:"h", v:"w" };
  const twins = w => {
    const out = new Set(), rev = w.split("").reverse().join(""), sw = (s, i) => s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);
    if (rev !== w) out.add(rev);
    for (let i = 0; i < w.length - 1; i++) if (w[i] !== w[i + 1]) out.add(sw(w, i));
    for (let i = 0; i < w.length; i++) if (SWAP[w[i]]) out.add(w.slice(0, i) + SWAP[w[i]] + w.slice(i + 1));
    out.delete(w); return shuffle([...out]);
  };
  const sameWords = g => [...(g === "k" ? [...D.TRICKY_BY.prek, ...D.TRICKY_BY.k] : D.TRICKY_BY.g1)].map(w => w.toLowerCase()).filter(w => w.length >= 2 && twins(w).length >= 2);
  SK.same = { name:"Same Word", ico:"👀", tag:"Look closely",
    keys: g => sameWords(g).map(w => "r:same:" + w),
    gen(g, key) {
      const w = key.split(":")[2];
      return { q:"Find the word that looks <b>exactly</b> the same", say:["p_sameword"], vis:`<div class="bigword">${w}</div>`, ans:w,
        choices:shuffle([w, ...twins(w).slice(0, 2)]).map(x => ({ v:x, html:`<span class="wordchoice">${x}</span>` })), after:[W(w)] };
    } };
  // Read & Find: read a riddle and pick its picture (reading for meaning, no listening needed)
  const RIDDLES = {
    g1: [["elephant","I am big and gray. I have a long trunk.","🐘","🐭","🐸"],["frog","I can swim in a pond. I say ribbit.","🐸","🐟","🦆"],
      ["banana","I am long and yellow. A monkey likes to eat me.","🍌","🍎","🥕"],["bed","You sleep in me. I have a pillow.","🛏️","🚗","🛁"],
      ["sun","I am hot and bright. I am up in the sky in the day.","☀️","🌙","⭐"],["bee","I have wings. I can buzz. I make honey.","🐝","🦋","🐦"],
      ["car","I have four wheels. Mom drives me to the shop.","🚗","🚲","⛵"],["snow","I am cold and white. You can make a snowman with me.","❄️","🔥","🌧️"],
      ["clock","I tick and tock. I tell you the time.","🕰️","📚","🎈"],["dog","I am a pet. I can bark and wag my tail.","🐶","🐱","🐟"],
      ["ball","You can kick me. I am round.","⚽","📦","🧦"],["turtle","I have a shell on my back. I am very slow.","🐢","🐇","🐎"]],
    g2: [["watermelon","I am green on the outside and red on the inside. I have black seeds.","🍉","🥝","🥒"],["octopus","I live in the ocean. I have eight arms.","🐙","🦀","🐠"],
      ["giraffe","I have a long neck and spots. I eat leaves from tall trees.","🦒","🦓","🐘"],["boots","You wear me on your feet when it snows.","🥾","🧤","🎩"],
      ["rain","I fall from the clouds and make puddles.","🌧️","☀️","🌈"],["carrot","I am orange. I grow under the ground. Rabbits like me.","🥕","🍊","🎃"],
      ["penguin","I am a bird, but I cannot fly. I live where it is icy.","🐧","🦅","🦜"],["scissors","You use me to cut paper.","✂️","🖍️","📏"],
      ["moon","I glow in the night sky. My shape seems to change.","🌙","☀️","⚡"],["broom","I have a long handle. You sweep the floor with me.","🧹","🔨","🪣"],
      ["train","I carry lots of people on long rails.","🚆","🚌","✈️"],["icecream","I am sweet and cold. I melt in the sun.","🍦","🍕","🥨"]],
    g3: [["saturn","I am a planet with rings made of ice and rock.","🪐","🌍","☀️"],["triangle","I have three sides and three corners.","🔺","🟥","🔵"],
      ["microscope","Scientists use me to see tiny things up close.","🔬","🔭","📡"],["telescope","Scientists use me to look at faraway stars.","🔭","🔬","🧲"],
      ["magnet","I pull iron things toward me without touching them.","🧲","🔦","🔋"],["ice","I am water that has frozen into a hard block.","🧊","💧","♨️"],
      ["butterfly","I am an insect that starts life as a caterpillar.","🦋","🐜","🐞"],["whale","I am the largest animal that has ever lived, and I live in the ocean.","🐋","🦈","🐬"],
      ["tractor","Farmers use me to plow fields and pull heavy loads.","🚜","🏎️","🛵"],["clockface","I have a face and two hands, but no arms or legs.","🕰️","🧸","🤖"],
      ["crocodile","I am a reptile with a long tail and powerful jaws. I live in rivers.","🐊","🐍","🦎"],["umbrella","I keep you dry when it rains.","☂️","🕶️","🧣"]] };
  SK.riddle = { name:"Riddles", ico:"🕵️", tag:"Reading for meaning",
    keys: g => RIDDLES[g].map(([id]) => "r:riddle:" + id),
    gen(g, key) {
      const [id, text, ans, ...ds] = RIDDLES[g].find(([x]) => x === key.split(":")[2]);
      return { q:`<span class="riddle">${text}</span><br><small>What am I?</small>`, say:["p_readfind"], vis:"", ans,
        choices:shuffle([ans, ...ds]).map(x => ({ v:x, html:`<span class="emo">${x}</span>` })), after:["rd_" + id] };
    } };

  // every word these games say, for tools/export_list.js
  const words = () => [...Object.keys(PIC), ...CLAP.map(c => c[0]), "sheep", "teeth", ...sameWords("k"), ...sameWords("g1")];
  const sentences = () => Object.fromEntries(Object.values(RIDDLES).flat().map(([id, text]) => ["rd_" + id, text]));
  const PHRASES = { rhyme: "Which one rhymes with", claps: "Clap the word, and count the claps.", howmanysounds: "How many sounds do you hear in", endswith: "What sound does it end with?",
    matchletter: "Find the small letter that matches.", missing: "Which letters are missing?", sameword: "Find the word that looks exactly the same.", readfind: "Read the riddle. What am I?" };
  return { SK, words, sentences, PHRASES };
})();
