// Sound Rocket geography: skills for each grade, Pre-K to 5th, on the same planets as reading and math.
// Same problem format as js/math.js, so the same practice screen runs both.
// Maps come from js/geo-maps.js (built by tools/build_geo.js). Every name is a recorded clip: gn_<name>.

window.GEO = (() => {
  const G = window.GEOMAPS;
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const one = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const slug = s => s.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
  const NM = s => "gn_" + slug(s);                 // clip for a spoken name
  const SAY = {};                                    // every name used, for tools/export_list.js
  const nm = s => { SAY[NM(s)] = s; return NM(s); };
  // choices from a correct answer and wrong ones; each choice says its name
  const pickFrom = (ans, pool, n = 3, html = x => x) => shuffle([ans, ...shuffle(pool.filter(x => x !== ans)).slice(0, n - 1)]).map(x => ({ v: x, html: html(x), say: [nm(x)] }));

  // ---------- content ----------
  const CONT = { AF: "Africa", AN: "Antarctica", AS: "Asia", EU: "Europe", NA: "North America", OC: "Australia", SA: "South America" };
  const OCEANS = { Pacific: ["pacificN", "pacificS", "pacificW"], Atlantic: ["atlanticN", "atlanticS"], Indian: ["indian", "indianW"], Arctic: ["arctic", "arcticW"], Southern: ["southern", "southernW"] };
  // [code, name, capital]
  const COUNTRIES = [["US", "United States", "Washington, D.C."], ["CA", "Canada", "Ottawa"], ["MX", "Mexico", "Mexico City"], ["CU", "Cuba", "Havana"], ["JM", "Jamaica", "Kingston"],
    ["BR", "Brazil", "Brasília"], ["AR", "Argentina", "Buenos Aires"], ["CL", "Chile", "Santiago"], ["PE", "Peru", "Lima"], ["CO", "Colombia", "Bogotá"], ["VE", "Venezuela", "Caracas"],
    ["GB", "United Kingdom", "London"], ["FR", "France", "Paris"], ["DE", "Germany", "Berlin"], ["IT", "Italy", "Rome"], ["ES", "Spain", "Madrid"], ["PT", "Portugal", "Lisbon"],
    ["IE", "Ireland", "Dublin"], ["NL", "Netherlands", "Amsterdam"], ["GR", "Greece", "Athens"], ["SE", "Sweden", "Stockholm"], ["NO", "Norway", "Oslo"], ["FI", "Finland", "Helsinki"],
    ["DK", "Denmark", "Copenhagen"], ["PL", "Poland", "Warsaw"], ["CH", "Switzerland", "Bern"], ["AT", "Austria", "Vienna"], ["UA", "Ukraine", "Kyiv"], ["RU", "Russia", "Moscow"], ["IS", "Iceland", "Reykjavik"],
    ["CN", "China", "Beijing"], ["IN", "India", "New Delhi"], ["JP", "Japan", "Tokyo"], ["KR", "South Korea", "Seoul"], ["TH", "Thailand", "Bangkok"], ["VN", "Vietnam", "Hanoi"],
    ["ID", "Indonesia", "Jakarta"], ["PH", "Philippines", "Manila"], ["SA", "Saudi Arabia", "Riyadh"], ["TR", "Turkey", "Ankara"], ["PK", "Pakistan", "Islamabad"], ["IR", "Iran", "Tehran"], ["MN", "Mongolia", "Ulaanbaatar"],
    ["EG", "Egypt", "Cairo"], ["NG", "Nigeria", "Abuja"], ["KE", "Kenya", "Nairobi"], ["ZA", "South Africa", "Pretoria"], ["ET", "Ethiopia", "Addis Ababa"], ["MA", "Morocco", "Rabat"], ["GH", "Ghana", "Accra"],
    ["AU", "Australia", "Canberra"], ["NZ", "New Zealand", "Wellington"]];
  const C = Object.fromEntries(COUNTRIES.map(([a, n, c]) => [a, { a, name: n, cap: c, cont: G.world.countries[a] && G.world.countries[a].cont }]));
  const flag = a => String.fromCodePoint(...[...a].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65));
  // countries big enough to see on the world map
  const VISIBLE = COUNTRIES.map(c => c[0]).filter(a => G.world.countries[a] && G.world.countries[a].area > 0.004);

  const STATES = { Alabama: "Montgomery", Alaska: "Juneau", Arizona: "Phoenix", Arkansas: "Little Rock", California: "Sacramento", Colorado: "Denver", Connecticut: "Hartford",
    Delaware: "Dover", Florida: "Tallahassee", Georgia: "Atlanta", Hawaii: "Honolulu", Idaho: "Boise", Illinois: "Springfield", Indiana: "Indianapolis", Iowa: "Des Moines",
    Kansas: "Topeka", Kentucky: "Frankfort", Louisiana: "Baton Rouge", Maine: "Augusta", Maryland: "Annapolis", Massachusetts: "Boston", Michigan: "Lansing", Minnesota: "Saint Paul",
    Mississippi: "Jackson", Missouri: "Jefferson City", Montana: "Helena", Nebraska: "Lincoln", Nevada: "Carson City", "New Hampshire": "Concord", "New Jersey": "Trenton",
    "New Mexico": "Santa Fe", "New York": "Albany", "North Carolina": "Raleigh", "North Dakota": "Bismarck", Ohio: "Columbus", Oklahoma: "Oklahoma City", Oregon: "Salem",
    Pennsylvania: "Harrisburg", "Rhode Island": "Providence", "South Carolina": "Columbia", "South Dakota": "Pierre", Tennessee: "Nashville", Texas: "Austin", Utah: "Salt Lake City",
    Vermont: "Montpelier", Virginia: "Richmond", Washington: "Olympia", "West Virginia": "Charleston", Wisconsin: "Madison", Wyoming: "Cheyenne" };
  const STATE_NAMES = Object.keys(STATES);
  // the five-region map most US classrooms use
  const REGIONS = { Northeast: ["Maine", "New Hampshire", "Vermont", "Massachusetts", "Rhode Island", "Connecticut", "New York", "New Jersey", "Pennsylvania"],
    Southeast: ["Delaware", "Maryland", "Virginia", "West Virginia", "North Carolina", "South Carolina", "Georgia", "Florida", "Kentucky", "Tennessee", "Alabama", "Mississippi", "Arkansas", "Louisiana"],
    Midwest: ["Ohio", "Indiana", "Illinois", "Michigan", "Wisconsin", "Minnesota", "Iowa", "Missouri", "North Dakota", "South Dakota", "Nebraska", "Kansas"],
    Southwest: ["Arizona", "New Mexico", "Texas", "Oklahoma"],
    West: ["Colorado", "Wyoming", "Montana", "Idaho", "Utah", "Nevada", "California", "Oregon", "Washington", "Alaska", "Hawaii"] };
  const regionOf = s => Object.keys(REGIONS).find(r => REGIONS[r].includes(s));

  const PLACES = { home: "🏠", school: "🏫", store: "🏪", hospital: "🏥", "fire station": "🚒", library: "📚", farm: "🚜", "police car": "🚓", bank: "🏦", playground: "🛝", "post office": "🏤", park: "🌳" };
  const WEATHER = { sunny: "☀️", rainy: "🌧️", snowy: "❄️", windy: "🌬️", cloudy: "☁️", stormy: "⛈️", foggy: "🌫️", rainbow: "🌈" };
  const SEASONS = { winter: ["⛄", "It is cold and it might snow."], spring: ["🌷", "Flowers start to grow."], summer: ["🏖️", "It is hot and the days are long."], fall: ["🍂", "Leaves change color and fall."] };
  const SYMBOLS = { "🌲": "forest", "🏫": "school", "⛰️": "mountains", "✈️": "airport", "🏥": "hospital", "🏕️": "campground", "🌉": "bridge", "🚂": "train station", "⛪": "church", "🏖️": "beach", "🏰": "castle", "⚓": "harbor" };
  const LANDFORMS = { island: ["🏝️", "land with water all around it"], mountain: ["🏔️", "very high land with a peak at the top"], volcano: ["🌋", "a mountain that can erupt with hot lava"],
    desert: ["🏜️", "very dry land with little rain"], valley: ["🏞️", "low land between hills or mountains"], ocean: ["🌊", "a huge body of salt water"],
    beach: ["🏖️", "sandy land next to the water"], forest: ["🌲", "land covered with lots of trees"], plain: ["🌾", "wide, flat land"], glacier: ["🧊", "a huge, slow river of ice"] };
  const WATERWORDS = { peninsula: "land with water on three sides", isthmus: "a narrow strip of land joining two larger lands", archipelago: "a group of islands",
    gulf: "a large part of an ocean that reaches into land", bay: "water partly surrounded by land, smaller than a gulf", strait: "a narrow waterway joining two larger bodies of water",
    delta: "land formed where a river spreads out into the sea", plateau: "high, flat land", canyon: "a deep valley with steep, rocky sides",
    tributary: "a stream or river that flows into a larger river", coast: "land next to the ocean", "river mouth": "where a river empties into a bigger body of water" };
  const ANIMALS = { kangaroo: ["🦘", "OC"], koala: ["🐨", "OC"], panda: ["🐼", "AS"], tiger: ["🐅", "AS"], lion: ["🦁", "AF"], zebra: ["🦓", "AF"], giraffe: ["🦒", "AF"], hippo: ["🦛", "AF"],
    penguin: ["🐧", "AN"], bison: ["🦬", "NA"], moose: ["🫎", "NA"], llama: ["🦙", "SA"], sloth: ["🦥", "SA"] };
  const SIZES = ["home", "town", "state", "country", "continent", "planet Earth"];
  const SIZE_PIC = { home: "🏠", town: "🏘️", state: "🗺️", country: "🏳️", continent: "🌎", "planet Earth": "🌍" };

  // ---------- pictures ----------
  const FILL = "#E8F1D8", HL = "#F29A1E";
  // world map; hl: {cont} or {country}; dot: [x, y]; lines: equator and prime meridian; zones: tropics and polar circles
  function world(o = {}) {
    const W = G.world, id = "c" + Math.random().toString(36).slice(2, 7);
    let hl = "";
    if (o.cont) {
      hl = `<path d="${W.cont[o.cont]}" fill="${HL}" stroke="#7A4A00" stroke-width="1"/>`;
      // Russia is in both: Europe west of the Urals, Asia east of them
      if (o.cont === "EU" || o.cont === "AS") hl += `<clipPath id="${id}"><rect x="${o.cont === "EU" ? 0 : W.urals}" y="0" width="${o.cont === "EU" ? W.urals : W.w}" height="${W.h}"/></clipPath><path d="${W.russia}" fill="${HL}" stroke="#7A4A00" stroke-width="1" clip-path="url(#${id})"/>`;
    }
    if (o.country) { const c = W.countries[o.country]; hl = `<path d="${c.d}" fill="${HL}" stroke="#7A4A00" stroke-width="1"/>` + (c.area < 0.02 ? `<circle cx="${c.c[0]}" cy="${c.c[1]}" r="24" fill="none" stroke="${HL}" stroke-width="6"/>` : ""); }
    const lines = o.lines ? `<path d="${W.equator}" stroke="#DC3B3B" stroke-width="4" fill="none"/><path d="${W.meridian}" stroke="#2563EB" stroke-width="4" fill="none"/>
      <text x="8" y="${+W.equator.split(",")[1].split("L")[0] - 6}" font-size="30" font-weight="800" fill="#DC3B3B">Equator</text>` : "";
    const zones = o.zones ? [...W.tropics, ...W.polar].map((d, i) => `<path d="${d}" stroke="${i < 2 ? "#DC3B3B" : "#2563EB"}" stroke-width="2" stroke-dasharray="7 6" fill="none"/>`).join("") : "";
    const dot = o.dot ? `<circle cx="${o.dot[0]}" cy="${o.dot[1]}" r="17" fill="#DC3B3B" stroke="#fff" stroke-width="6"/>` : "";
    return `<svg class="map ${o.small ? "small" : ""}" viewBox="0 0 ${W.w} ${W.h}" role="img" aria-label="world map"><path d="${W.outline}" fill="#BFE0FF" stroke="#7FA7D6" stroke-width="1.5"/>
      <g fill="${FILL}" stroke="#9BB59A" stroke-width=".6">${Object.values(W.countries).map(c => `<path d="${c.d}"/>`).join("")}</g>${hl}${zones}${lines}${dot}</svg>`;
  }
  function usa(o = {}) {
    const U = G.us, hl = [].concat(o.hl || []);
    return `<svg class="map ${o.small ? "small" : ""}" viewBox="-10 0 ${U.w + 20} ${U.h}" role="img" aria-label="map of the United States"><g stroke="#fff" stroke-width="1.2">${Object.entries(U.states).map(([n, s]) =>
      `<path d="${s.d}" fill="${hl.includes(n) ? HL : "#CFE3C0"}"/>`).join("")}</g>
      ${hl.map(n => U.states[n] && U.states[n].area < 900 ? `<circle cx="${U.states[n].c[0]}" cy="${U.states[n].c[1]}" r="20" fill="none" stroke="${HL}" stroke-width="4"/>` : "").join("")}</svg>`;
  }
  // compass rose: only North is labeled, the arrow points somewhere
  const DIRS = { North: 0, "North East": 45, East: 90, "South East": 135, South: 180, "South West": 225, West: 270, "North West": 315 };
  function compass(dir) {
    const a = (DIRS[dir] - 90) * Math.PI / 180, x = 100 + 62 * Math.cos(a), y = 100 + 62 * Math.sin(a);
    const ticks = Object.values(DIRS).map(d => { const r = (d - 90) * Math.PI / 180, l = d % 90 ? 60 : 84; return `<line x1="100" y1="100" x2="${(100 + l * Math.cos(r)).toFixed(1)}" y2="${(100 + l * Math.sin(r)).toFixed(1)}" stroke="#9AA6C4" stroke-width="${d % 90 ? 3 : 6}" stroke-linecap="round"/>`; }).join("");
    return `<svg class="compass" viewBox="0 0 200 200" role="img" aria-label="compass"><circle cx="100" cy="100" r="96" fill="#fff" stroke="#17203F" stroke-width="4"/>${ticks}
      <text x="100" y="20" text-anchor="middle" font-size="22" font-weight="800" fill="#DC3B3B" dy="6">N</text>
      <line x1="100" y1="100" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#F29A1E" stroke-width="10" stroke-linecap="round"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="#F29A1E"/><circle cx="100" cy="100" r="8" fill="#17203F"/></svg>`;
  }
  // a box with something above, below or beside it
  const POS = { above: [0, 1], below: [2, 1], "next to": [1, one([0, 2])], left: [1, 0], right: [1, 2] };
  function scene(item, pos) {
    const [r, c] = pos === "next to" ? [1, one([0, 2])] : POS[pos];
    return `<div class="scene">${Array.from({ length: 9 }, (_, i) => `<span>${i === 4 ? "📦" : (i / 3 | 0) === r && i % 3 === c ? item : ""}</span>`).join("")}</div>`;
  }
  const big = e => `<span class="emo big">${e}</span>`;
  const withPic = (pic, w) => `<span class="emo">${pic}</span><span class="cap">${w}</span>`;

  // ---------- skills ----------
  // Same as math: keys(g) are practice items in teaching order; gen(g, key) makes one problem.
  const SK = {};
  SK.landwater = { name: "Land or Water", ico: "🏝️", tag: "Maps",
    gen() {
      const water = Math.random() < .5;
      const dot = water ? G.world.pt[one(Object.values(OCEANS).flat())] : G.world.countries[one(VISIBLE.filter(a => G.world.countries[a].area > .02))].c;
      return { q: "Is the red dot on <b>land</b> or <b>water</b>?", say: [nm("Is the red dot on land or water?")], vis: world({ dot }), ans: water ? "water" : "land",
        choices: [{ v: "land", html: withPic("🟩", "Land"), say: [nm("Land")] }, { v: "water", html: withPic("🟦", "Water"), say: [nm("Water")] }], wide: true };
    } };
  SK.places = { name: "My Town", ico: "🏘️", tag: "Community",
    keys: g => Object.keys(PLACES).slice(0, g === "prek" ? 7 : 12).map(p => "g:place:" + p),
    gen(g, key) { const p = key.split(":")[2], pool = Object.keys(PLACES).slice(0, g === "prek" ? 7 : 12);
      return { q: `Show me the <b>${p}</b>`, say: ["p_showme", nm(p)], vis: "", ans: p, choices: pickFrom(p, pool, 3, x => big(PLACES[x])), after: [nm(p)] }; } };
  SK.weather = { name: "Weather", ico: "🌦️", tag: "Weather and seasons",
    gen(g) {
      if (g === "k" && Math.random() < .5) { const s = one(Object.keys(SEASONS));
        return { q: `${SEASONS[s][1]} Which season is it?`, say: [nm(SEASONS[s][1] + " Which season is it?")], vis: "", ans: s, choices: pickFrom(s, Object.keys(SEASONS), 4, x => withPic(SEASONS[x][0], x)), after: [nm(s)] }; }
      const w = one(Object.keys(WEATHER).slice(0, g === "prek" ? 5 : 8));
      return { q: `Show me <b>${w}</b> weather`, say: ["p_showme", nm(w)], vis: "", ans: w, choices: pickFrom(w, Object.keys(WEATHER).slice(0, g === "prek" ? 5 : 8), 3, x => big(WEATHER[x])), after: [nm(w)] };
    } };
  SK.position = { name: "Where Is It?", ico: "📦", tag: "Position words",
    gen(g) {
      const opts = g === "prek" ? ["above", "below", "next to"] : ["above", "below", "left", "right"], pos = one(opts), item = one(["🐱", "🐶", "⭐", "⚽", "🐥", "🍎"]);
      const label = { above: "Above", below: "Below", "next to": "Next to", left: "Left of", right: "Right of" };
      return { q: "Where is it? Look at the box.", say: [nm("Where is it? Look at the box.")], vis: scene(item, pos), ans: pos,
        choices: opts.map(o => ({ v: o, html: label[o], say: [nm(label[o])] })), after: [nm(label[pos])] };
    } };
  SK.continents = { name: "Continents", ico: "🌎", tag: "World map",
    keys: () => ["NA", "SA", "AF", "EU", "AS", "OC", "AN"].map(c => "g:cont:" + c),
    gen(g, key) {
      const c = key.split(":")[2];
      if (g === "g2" && Math.random() < .5) {  // find it: three maps, which one shows it?
        const opts = shuffle([c, ...shuffle(Object.keys(CONT).filter(x => x !== c)).slice(0, 2)]);
        return { q: `Where is <b>${CONT[c]}</b>?`, say: [nm("Where is"), nm(CONT[c])], vis: "", ans: c, choices: opts.map(x => ({ v: x, html: world({ cont: x, small: true }), say: [nm(CONT[x])] })), maps: true, after: [nm(CONT[c])] };
      }
      return { q: "Which continent is orange?", say: [nm("Which continent is orange?")], vis: world({ cont: c }), ans: CONT[c], choices: pickFrom(CONT[c], Object.values(CONT), 4), after: [nm(CONT[c])] };
    } };
  SK.oceans = { name: "Oceans", ico: "🌊", tag: "World map",
    keys: () => Object.keys(OCEANS).map(o => "g:ocean:" + o),
    gen(g, key) { const o = key.split(":")[2];
      return { q: "Which ocean has the red dot?", say: [nm("Which ocean has the red dot?")], vis: world({ dot: G.world.pt[one(OCEANS[o])] }), ans: o,
        choices: pickFrom(o, Object.keys(OCEANS), 4, x => x + " Ocean").map(c => ({ ...c, say: [nm(c.v + " Ocean")] })), after: [nm(o + " Ocean")] }; } };
  SK.compass = { name: "Compass", ico: "🧭", tag: "Directions",
    keys: g => (g === "g1" ? ["North", "East", "South", "West"] : Object.keys(DIRS)).map(d => "g:dir:" + d),
    gen(g, key) { const d = key.split(":")[2], pool = g === "g1" ? ["North", "East", "South", "West"] : Object.keys(DIRS);
      return { q: "Which way is the arrow pointing?", say: [nm("Which way is the arrow pointing?")], vis: compass(d), ans: d, choices: pickFrom(d, pool, 4), after: [nm(d)] }; } };
  SK.symbols = { name: "Map Symbols", ico: "🗺️", tag: "Map keys",
    keys: () => Object.keys(SYMBOLS).map(s => "g:sym:" + s),
    gen(g, key) { const s = key.split(":")[2], m = SYMBOLS[s];
      return { q: "On a map, what does this symbol stand for?", say: [nm("On a map, what does this symbol stand for?")], vis: big(s), ans: m, choices: pickFrom(m, Object.values(SYMBOLS), 3), after: [nm(m)] }; } };
  SK.landforms = { name: "Landforms", ico: "🏔️", tag: "Land and water",
    keys: () => Object.keys(LANDFORMS).map(l => "g:land:" + l),
    gen(g, key) { const l = key.split(":")[2];
      return { q: `Which one is <b>${LANDFORMS[l][1]}</b>?`, say: [nm("Which one is " + LANDFORMS[l][1] + "?")], vis: "", ans: l, choices: pickFrom(l, Object.keys(LANDFORMS), 3, x => withPic(LANDFORMS[x][0], x)), after: [nm(l)] }; } };
  SK.animals = { name: "Animals of the World", ico: "🦘", tag: "Continents",
    keys: () => Object.keys(ANIMALS).map(a => "g:animal:" + a),
    gen(g, key) { const a = key.split(":")[2], [pic, c] = ANIMALS[a];
      return { q: `Wild <b>${a}s</b> live on which continent?`, say: [nm(`Wild ${a}s live on which continent?`)], vis: big(pic), ans: CONT[c], choices: pickFrom(CONT[c], Object.values(CONT), 3), after: [nm(CONT[c])] }; } };
  SK.sizes = { name: "Big and Small", ico: "🪆", tag: "Where I live",
    gen() {
      const [a, b] = shuffle(SIZES).slice(0, 2), bigger = Math.random() < .6, ans = (SIZES.indexOf(a) > SIZES.indexOf(b)) === bigger ? a : b;
      return { q: bigger ? "Which is <b>bigger</b>?" : "Which is <b>smaller</b>?", say: [nm(bigger ? "Which is bigger?" : "Which is smaller?")], vis: "", ans,
        choices: [a, b].map(x => ({ v: x, html: withPic(SIZE_PIC[x], x), say: [nm(x)] })), after: [nm(ans)] };
    } };
  SK.flags = { name: "Flags", ico: "🏳️", tag: "Countries",
    keys: () => COUNTRIES.map(c => "g:flag:" + c[0]),
    gen(g, key) { const a = key.split(":")[2];
      return { q: "Whose flag is this?", say: [nm("Whose flag is this?")], vis: `<span class="flag">${flag(a)}</span>`, ans: C[a].name, choices: pickFrom(C[a].name, COUNTRIES.map(c => c[1]), 4), after: [nm(C[a].name)] }; } };
  SK.countrycont = { name: "Countries and Continents", ico: "🌍", tag: "Countries",
    keys: () => COUNTRIES.filter(c => c[0] !== "NZ" && C[c[0]].cont).map(c => "g:cc:" + c[0]),
    gen(g, key) { const a = key.split(":")[2], c = CONT[C[a].cont];
      return { q: `Which continent is <b>${C[a].name}</b> on?`, say: [nm("Which continent is"), nm(C[a].name), nm("on?")], vis: `<span class="flag">${flag(a)}</span>`, ans: c, choices: pickFrom(c, Object.values(CONT).filter(x => x !== "Antarctica"), 4), after: [nm(c)] }; } };
  SK.usstates = { name: "US States", ico: "🇺🇸", tag: "US map",
    keys: () => STATE_NAMES.map(s => "g:state:" + s),
    gen(g, key) {
      const s = key.split(":")[2], near = REGIONS[regionOf(s)].filter(x => x !== s);
      if (g === "g4" && Math.random() < .5) {   // find it: three maps
        const opts = shuffle([s, ...shuffle(near).slice(0, 2)]);
        return { q: `Where is <b>${s}</b>?`, say: [nm("Where is"), nm(s)], vis: "", ans: s, choices: opts.map(x => ({ v: x, html: usa({ hl: x, small: true }), say: [nm(x)] })), maps: true, after: [nm(s)] };
      }
      // wrong answers come from the same region, so it takes real map reading
      const opts = shuffle([s, ...shuffle(near).slice(0, 2), one(STATE_NAMES.filter(x => x !== s && !near.includes(x)))]);
      return { q: "Which state is orange?", say: [nm("Which state is orange?")], vis: usa({ hl: s }), ans: s, choices: opts.map(x => ({ v: x, html: x, say: [nm(x)] })), after: [nm(s)] };
    } };
  SK.statecaps = { name: "State Capitals", ico: "🏛️", tag: "US states",
    keys: () => STATE_NAMES.map(s => "g:scap:" + s),
    gen(g, key) { const s = key.split(":")[2];
      return { q: `What is the capital of <b>${s}</b>?`, say: [nm("What is the capital of"), nm(s)], vis: usa({ hl: s }), ans: STATES[s], choices: pickFrom(STATES[s], Object.values(STATES), 4), after: [nm(STATES[s])] }; } };
  SK.regions = { name: "US Regions", ico: "🧩", tag: "US map",
    keys: () => STATE_NAMES.map(s => "g:reg:" + s),
    gen(g, key) { const s = key.split(":")[2], r = regionOf(s);
      return { q: `<b>${s}</b> is in which region?`, say: [nm(s), nm("is in which region?")], vis: usa({ hl: s }), ans: r, choices: Object.keys(REGIONS).map(x => ({ v: x, html: x, say: [nm(x)] })), after: [nm(r)] }; } };
  SK.waterwords = { name: "Land and Water Words", ico: "🏞️", tag: "Vocabulary",
    keys: () => Object.keys(WATERWORDS).map(w => "g:ww:" + w),
    gen(g, key) { const w = key.split(":")[2];
      return { q: `Which word means <b>${WATERWORDS[w]}</b>?`, say: [nm("Which word means " + WATERWORDS[w] + "?")], vis: "", ans: w, choices: pickFrom(w, Object.keys(WATERWORDS), 4), after: [nm(w)] }; } };
  SK.capitals = { name: "World Capitals", ico: "🏙️", tag: "Countries",
    keys: () => COUNTRIES.map(c => "g:cap:" + c[0]),
    gen(g, key) { const a = key.split(":")[2];
      return { q: `What is the capital of <b>${C[a].name}</b>?`, say: [nm("What is the capital of"), nm(C[a].name)], vis: `<span class="flag">${flag(a)}</span>`, ans: C[a].cap, choices: pickFrom(C[a].cap, COUNTRIES.map(c => c[2]), 4), after: [nm(C[a].cap)] }; } };
  SK.findcountry = { name: "Countries on the Map", ico: "📍", tag: "World map",
    keys: () => VISIBLE.map(a => "g:fc:" + a),
    gen(g, key) { const a = key.split(":")[2], same = VISIBLE.filter(x => x !== a && C[x].cont === C[a].cont);
      const opts = shuffle([a, ...shuffle(same).slice(0, 2), one(VISIBLE.filter(x => x !== a && !same.includes(x)))]).filter(Boolean);
      return { q: "Which country is orange?", say: [nm("Which country is orange?")], vis: world({ country: a }), ans: C[a].name, choices: opts.map(x => ({ v: C[x].name, html: C[x].name, say: [nm(C[x].name)] })), after: [nm(C[a].name)] }; } };
  const LATWORDS = [["Lines that run east and west around the Earth are lines of…", "latitude"], ["Lines that run from the North Pole to the South Pole are lines of…", "longitude"],
    ["The line of latitude at zero degrees is the…", "equator"], ["The line of longitude at zero degrees is the…", "prime meridian"], ["Half of the Earth is called a…", "hemisphere"]];
  SK.latlong = { name: "Latitude and Longitude", ico: "🌐", tag: "Globe skills",
    gen() {
      const t = Math.random();
      if (t < .3) { const [q, a] = one(LATWORDS); return { q, say: [nm(q)], vis: "", ans: a, choices: pickFrom(a, LATWORDS.map(x => x[1]), 4), after: [nm(a)] }; }
      const ns = t < .65, pool = VISIBLE.filter(a => Math.abs(G.world.countries[a].ll[ns ? 1 : 0]) > 10), a = one(pool), ll = G.world.countries[a].ll;
      const ans = ns ? (ll[1] > 0 ? "Northern" : "Southern") : (ll[0] > 0 ? "Eastern" : "Western");
      const q = ns ? "Is the red dot in the Northern or Southern Hemisphere?" : "Is the red dot in the Eastern or Western Hemisphere?";
      return { q, say: [nm(q)], vis: world({ dot: G.world.countries[a].c, lines: true }), ans, choices: (ns ? ["Northern", "Southern"] : ["Eastern", "Western"]).map(x => ({ v: x, html: x, say: [nm(x)] })), wide: true, after: [nm(ans + " Hemisphere")] };
    } };
  const ZONES = { tropical: "hot and often rainy all year, near the equator", temperate: "warm summers and cold winters, between the tropics and the poles", polar: "very cold all year, near the North and South Poles" };
  SK.climate = { name: "Climate Zones", ico: "🌡️", tag: "Globe skills",
    gen() {
      if (Math.random() < .4) { const z = one(Object.keys(ZONES)); return { q: `Which climate zone is <b>${ZONES[z]}</b>?`, say: [nm(`Which climate zone is ${ZONES[z]}?`)], vis: "", ans: z, choices: Object.keys(ZONES).map(x => ({ v: x, html: x, say: [nm(x)] })), after: [nm(z)] }; }
      const pts = Object.entries(G.world.countries).filter(([, c]) => c.area > .01 && (Math.abs(c.ll[1]) < 15 || (Math.abs(c.ll[1]) > 30 && Math.abs(c.ll[1]) < 58) || Math.abs(c.ll[1]) > 70));
      const [, c] = one(pts), lat = Math.abs(c.ll[1]), z = lat < 23.5 ? "tropical" : lat < 66.5 ? "temperate" : "polar";
      return { q: "What is the climate zone where the red dot is?", say: [nm("What is the climate zone where the red dot is?")], vis: world({ dot: c.c, zones: true }), ans: z,
        choices: Object.keys(ZONES).map(x => ({ v: x, html: x, say: [nm(x)] })), after: [nm(z)] };
    } };

  // The skills each grade shows: [skill, short description, name override]
  const GRADE_SKILLS = {
    prek: [["landwater", "Is it land or water?"], ["places", "School, store, park"], ["weather", "Sunny, rainy, snowy"], ["position", "Above, below, next to"]],
    k: [["landwater", "Land and water on a map"], ["places", "Places in a town"], ["weather", "Weather and seasons"], ["position", "Left, right, above, below"], ["sizes", "Home, town, state, country"]],
    g1: [["continents", "The 7 continents"], ["oceans", "The 5 oceans"], ["compass", "North, south, east, west"], ["symbols", "What map symbols mean"], ["sizes", "From home to planet Earth"]],
    g2: [["continents", "Find the continents"], ["landforms", "Islands, mountains, deserts"], ["animals", "Which animals live where"], ["oceans", "Oceans review"], ["symbols", "Map keys"]],
    g3: [["usstates", "Name the states on a map"], ["flags", "Flags of the world"], ["countrycont", "Which continent is it on?"], ["compass", "Northeast, southwest…", "Compass Rose"]],
    g4: [["statecaps", "Capitals of all 50 states"], ["regions", "Northeast, Midwest, West…"], ["usstates", "Find the states"], ["waterwords", "Peninsula, delta, strait…"]],
    g5: [["capitals", "Capitals of the world"], ["findcountry", "Find countries on the map"], ["latlong", "Equator, hemispheres"], ["climate", "Tropical, temperate, polar"]]
  };
  function label(k) { const [, s, v] = k.split(":"); return v ? (C[v] ? C[v].name : CONT[v] || v) : (SK[s] ? SK[s].name : s); }

  // every spoken clip: run each generator over all its items so nm() sees every name
  function clips() {
    for (const [g, list] of Object.entries(GRADE_SKILLS)) for (const [id] of list) {
      const sk = SK[id], keys = sk.keys ? sk.keys(g) : null;
      for (let i = 0; i < (keys ? keys.length * 6 : 300); i++) sk.gen(g, keys ? keys[i % keys.length] : null);
    }
    [...Object.values(CONT), ...Object.keys(OCEANS).map(o => o + " Ocean"), ...Object.keys(PLACES), ...Object.keys(WEATHER), ...Object.keys(SEASONS), ...Object.keys(DIRS),
     ...Object.values(SYMBOLS), ...Object.keys(LANDFORMS), ...SIZES, ...COUNTRIES.flatMap(c => [c[1], c[2]]), ...STATE_NAMES, ...Object.values(STATES), ...Object.keys(REGIONS),
     ...Object.keys(WATERWORDS), ...LATWORDS.map(x => x[1]), ...Object.keys(ZONES), "Northern Hemisphere", "Southern Hemisphere", "Eastern Hemisphere", "Western Hemisphere"].forEach(nm);
    return { ...SAY };
  }
  return { SK, GRADE_SKILLS, label, clips };
})();
