// Sound Rocket content. Reading and Math share one ladder of grade levels, Pre-K to 5th grade, one planet each.
// Reading follows the Montessori series up to 1st grade (letter sounds, pink CVC words, blue blends, green phonograms),
// then long vowels (2nd), syllables and endings (3rd), prefixes and suffixes (4th), Greek and Latin roots (5th).
// Every word, sentence and prompt here has a matching recorded clip in /audio (built by tools/build_audio.py).

window.DATA = (() => {
  // The shared grade ladder. Math and Reading each unlock these separately.
  const GRADES = [
    { id:"prek", label:"Pre-K", planet:"Moon",    color:"#F59AC2", orb:"radial-gradient(circle at 35% 35%,#fff,#d9d9e3 40%,#9ea1b8)" },
    { id:"k",    label:"K",     planet:"Mars",    color:"#FF9F6B", orb:"radial-gradient(circle at 35% 35%,#ffb39a,#e0603a 55%,#9c3416)" },
    { id:"g1",   label:"1st",   planet:"Jupiter", color:"#7AAEFF", orb:"repeating-linear-gradient(170deg,#f3d9b1 0 7px,#c98f5a 7px 12px,#e8c39a 12px 18px)" },
    { id:"g2",   label:"2nd",   planet:"Saturn",  color:"#72D394", orb:"radial-gradient(circle at 35% 35%,#fff1c4,#e7c26a 55%,#a07a2a)" },
    { id:"g3",   label:"3rd",   planet:"Uranus",  color:"#B79CFF", orb:"radial-gradient(circle at 35% 35%,#e6fbff,#8fe3ec 55%,#3f9fb0)" },
    { id:"g4",   label:"4th",   planet:"Neptune", color:"#5FD4D4", orb:"radial-gradient(circle at 35% 35%,#b9ccff,#3c63d6 55%,#1d2f86)" },
    { id:"g5",   label:"5th",   planet:"Pluto",   color:"#FFC83A", orb:"radial-gradient(circle at 35% 35%,#fff4e6,#d8b99a 55%,#8a6a50)" }
  ];

  // How each sound card is spoken: key -> [display, keyword, keyword picture]
  const SOUNDS = {
    a:["a","apple","🍎"], b:["b","ball","⚽"], c:["c","cat","🐱"], d:["d","dog","🐶"], e:["e","egg","🥚"],
    f:["f","fish","🐟"], g:["g","goat","🐐"], h:["h","hat","🎩"], i:["i","insect","🐜"], j:["j","jam","🍓"],
    k:["k","kite","🪁"], l:["l","lion","🦁"], m:["m","moon","🌙"], n:["n","nest","🪺"], o:["o","octopus","🐙"],
    p:["p","pig","🐷"], qu:["qu","queen","👑"], r:["r","rocket","🚀"], s:["s","sun","☀️"], t:["t","turtle","🐢"],
    u:["u","up","⬆️"], v:["v","van","🚐"], w:["w","web","🕸️"], x:["x","fox","🦊"], y:["y","yo-yo","🪀"], z:["z","zebra","🦓"],
    sh:["sh","ship","🚢"], ch:["ch","chick","🐥"], th:["th","thumb","👍"], ck:["ck","duck","🦆"],
    ee:["ee","tree","🌳"], oo:["oo","moon","🌙"], ng:["ng","ring","💍"],
    // 2nd grade: long vowels and bossy r
    a_e:["a_e","cake","🎂"], i_e:["i_e","kite","🪁"], o_e:["o_e","bone","🦴"], u_e:["u_e","cube","🧊"],
    ai:["ai","rain","🌧️"], ay:["ay","hay","🌾"], oa:["oa","boat","⛵"], igh:["igh","night","🌃"],
    ar:["ar","car","🚗"], or:["or","corn","🌽"], er:["er","fern","🌿"], ir:["ir","bird","🐦"], ur:["ur","purse","👛"]
  };
  // Sounds that share one recording (a_e and ai say the same thing as ay)
  const SOUND_CLIP = { a_e:"ay", ai:"ay", i_e:"igh", o_e:"oa", u_e:"ue", ir:"er", ur:"er" };
  // Montessori order for introducing letter sounds (most useful first)
  const PINK_SOUNDS = "s a t p i n m d g o c k e u r h b f l j v w y z x qu".split(" ");
  const GREEN_SOUNDS = ["sh","ch","th","ck","ee","oo","ng"];
  const LONG_SOUNDS = ["a_e","ai","ay","i_e","igh","o_e","oa","u_e","ar","or","er","ir","ur"];
  const VOWELS = ["a","e","i","o","u","ee","oo","ay","igh","oa","ue","ar","or","er"];
  const PHONOGRAMS = ["sh","ch","th","ck","ee","oo","ng","qu"];

  // Split a word into sound tiles: "ship" -> ["sh","i","p"], "duck" -> ["d","u","ck"]
  function tiles(w){
    const out=[]; let i=0;
    while(i<w.length){
      const two=w.slice(i,i+2);
      if(PHONOGRAMS.includes(two)){ out.push(two); i+=2; }
      else { out.push(w[i]); i++; }
    }
    return out;
  }
  const slug = s => s.toLowerCase().replace(/[^a-z]/g, "");

  // A word's tiles: {d: what's shown, s: sound key or null if silent, clip: recording, kind}
  //   plain:  "cat"                 -> c a t, each tile says its letter sound
  //   sounds: "c|a:a_e|k|e:"        -> tiles with a sound each; "e:" is a silent e
  //   chunks: "rab|bit", "lem|on=un" -> syllable chunks; "=un" is how the chunk is said
  function parse(spec, mode){
    if (mode === "chunks") return spec.split("|").map(seg => { const [d, say] = seg.split("="); return { d, s:null, clip:"c_" + slug(say || d), kind:"chunk" }; });
    if (!spec.includes("|")) return tiles(spec).map(t => ({ d:t, s:t, clip:"s_" + t, kind:"sound" }));
    return spec.split("|").map(seg => {
      const [d, s0] = seg.split(":"), s = s0 === undefined ? d : (s0 || null);
      return { d, s, clip: s ? "s_" + (SOUND_CLIP[s] || s) : null, kind: s ? "sound" : "silent" };
    });
  }
  // words: { group: [[spec, picture], ...] } -> { group: [[word, picture, tiles], ...] }
  function wordList(groups, mode){
    const out = {};
    for (const [g, list] of Object.entries(groups)) out[g] = list.map(([spec, pic]) => {
      const parts = parse(spec, mode);
      return [parts.map(p => p.d).join(""), pic, parts];
    });
    return out;
  }

  // Sight words by grade (Dolch-style). They can't be sounded out, so they're learned by sight.
  const TRICKY_BY = {
    prek:["the","a","I","is","to","and","see","my","you","we"],
    k:["he","she","said","was","of","go","no","like","are","here","has","his","they","what","do"],
    g1:["could","would","should","there","where","were","some","come","one","two","once","who","why","does","again","any","many","very","every","their"],
    g2:["because","been","both","buy","done","eight","enough","laugh","only","pretty","please","sure","though","through","together","wash","water","warm","wear","write"],
    g3:["although","answer","busy","caught","carry","different","early","either","eye","friend","heard","hour","island","learn","neighbor","ocean","thought","touch","women","young"]
  };
  const TRICKY = Object.values(TRICKY_BY).flat();
  // Heart words: the letters (by position) that don't follow the phonics a child knows yet, learned "by heart" ❤
  const HEART = {"the": [2], "a": [0], "is": [1], "to": [1], "my": [1], "you": [1, 2], "we": [1], "he": [1], "she": [2], "said": [1, 2], "was": [1, 2], "of": [0, 1], "go": [1], "no": [1], "like": [1, 3], "are": [0, 1, 2], "here": [1, 2, 3], "has": [2], "his": [2], "they": [2, 3], "what": [2], "do": [1], "could": [1, 2, 3], "would": [1, 2, 3], "should": [2, 3, 4], "there": [2, 3, 4], "where": [2, 3, 4], "were": [1, 2, 3], "some": [1, 3], "come": [1, 3], "one": [0, 1, 2], "two": [1, 2], "once": [0, 1, 2, 3], "who": [0, 2], "why": [2], "does": [1, 2], "again": [2, 3], "any": [0], "many": [1], "very": [3], "every": [4], "their": [2, 3, 4], "because": [3, 4, 5, 6], "been": [1, 2], "both": [1], "buy": [1, 2], "done": [1, 3], "eight": [0, 1, 2, 3], "enough": [0, 2, 3, 4, 5], "laugh": [1, 2, 3, 4], "only": [0], "pretty": [2], "please": [3, 5], "sure": [0, 1, 2, 3], "though": [2, 3, 4, 5], "through": [3, 4, 5, 6], "together": [1], "wash": [1], "water": [1], "warm": [1, 2], "wear": [1, 2, 3], "write": [0]};

  // Word meanings for Word Meaning (3rd to 5th grade)
  const VOCAB = {
    g3:[["enormous","very, very big"],["tiny","very small"],["gather","to bring things together"],["brave","not afraid to do something hard"],
        ["shiver","to shake because you are cold"],["whisper","to talk very quietly"],["journey","a long trip"],["delicious","tastes very good"],
        ["gentle","soft and careful"],["hurry","to move fast"],["nervous","a little worried or scared"],["discover","to find something new"],
        ["tumble","to fall and roll over"],["cozy","warm and comfortable"],["grin","a big smile"]],
    g4:[["ancient","very, very old"],["cautious","careful to stay away from danger"],["fragile","easy to break"],["reluctant","not wanting to do something"],
        ["abundant","more than enough"],["observe","to watch carefully"],["predict","to guess what will happen next"],["vast","huge and wide"],
        ["exhausted","extremely tired"],["furious","very angry"],["unusual","not common, strange"],["rebuild","to build again"],
        ["careless","not paying attention"],["fearless","not afraid of anything"],["disagree","to not agree"]],
    g5:[["analyze","to study something closely to understand it"],["benevolent","kind and wanting to help others"],["consequence","something that happens because of an action"],
        ["elaborate","full of detail"],["inevitable","sure to happen"],["meticulous","very careful about small details"],["persevere","to keep trying even when it is hard"],
        ["scarce","hard to find, not enough"],["transparent","clear enough to see through"],["vivid","bright and full of life"],["hypothesis","a guess that can be tested"],
        ["contradict","to say the opposite"],["biography","the story of a person's life, written by someone else"],["autograph","a person's own signature"],
        ["microscope","a tool that makes tiny things look bigger"]]
  };

  // Reading content for each grade. [word, picture]: a picture is "" when no clear picture exists.
  const K_WORDS = {
    "short a":[["cat","🐱"],["hat","🎩"],["map","🗺️"],["bag","👜"],["van","🚐"],["jam","🍓"],["fan","🪭"],["rat","🐀"],["pan","🍳"],["cap","🧢"],["bat","🦇"],["ham","🍖"],["man","👨"],["sad","😢"],["can","🥫"]],
    "short i":[["pig","🐷"],["lip","👄"],["fin","🦈"],["big",""],["dig","⛏️"],["six","6️⃣"],["wig",""],["pin","📌"],["bib",""],["zip",""],["kid","🧒"],["hit",""],["sit",""],["mix",""],["lid",""]],
    "short o":[["dog","🐶"],["pot","🍲"],["fox","🦊"],["log","🪵"],["mop","🧹"],["box","📦"],["top","🔝"],["hot","🔥"],["cot",""],["hop",""],["dot",""],["job",""],["rod",""],["sob",""],["fog","🌫️"]],
    "short u":[["sun","☀️"],["bug","🐛"],["cup","☕"],["bus","🚌"],["hug","🤗"],["run","🏃"],["nut","🥜"],["tub","🛁"],["pup","🐕"],["gum",""],["mud",""],["rug",""],["cub",""],["jug",""],["bun",""]],
    "short e":[["bed","🛏️"],["hen","🐔"],["net","🥅"],["leg","🦵"],["red","🔴"],["ten","🔟"],["web","🕸️"],["jet","✈️"],["pen","🖊️"],["wet","💧"],["pet",""],["vet",""],["men",""],["fed",""],["yes","✅"]]
  };
  const G1_WORDS = {
    "blends":[["frog","🐸"],["flag","🚩"],["crab","🦀"],["drum","🥁"],["clap","👏"],["stop","🛑"],["swim","🏊"],["sled","🛷"],["plum",""],["plug","🔌"],["hand","✋"],["milk","🥛"],["lamp","🪔"],["nest","🪺"],["tent","⛺"],["belt",""],["desk",""],["jump",""],["gift","🎁"],["mask","🎭"],["pond",""],["sand",""],["spin",""],["step",""],["snap",""],["trip",""],["grin","😁"],["skip",""],["slug",""],["vest","🦺"]],
    "5 letters":[["stamp",""],["plant","🌱"],["trunk",""],["blimp",""],["twist",""],["frost",""],["skunk","🦨"],["print",""],["stand",""],["crisp",""],["grand",""],["crust",""],["drink","🥤"],["spend",""],["blend",""],["strap",""],["split",""]],
    "sh ch th":[["ship","🚢"],["fish","🐟"],["dish",""],["shop",""],["shed",""],["chin",""],["chip",""],["chop",""],["much",""],["bath","🛁"],["moth",""],["math",""],["lunch",""],["shell","🐚"],["brush","🪥"]],
    "ck ng":[["duck","🦆"],["sock","🧦"],["rock","🪨"],["kick",""],["neck",""],["back",""],["truck","🚚"],["chick","🐥"],["ring","💍"],["king","🤴"],["wing",""],["sing",""],["long",""],["swing",""],["sting",""]],
    "ee oo":[["tree","🌳"],["bee","🐝"],["feet","🦶"],["seed",""],["sheep","🐑"],["teeth","🦷"],["three","3️⃣"],["green","🟢"],["moon","🌙"],["food",""],["boot","👢"],["spoon","🥄"],["broom","🧹"],["zoom",""],["pool",""]]
  };
  const G2_WORDS = {
    "magic e":[["c|a:a_e|k|e:","🎂"],["k|i:i_e|t|e:","🪁"],["b|o:o_e|n|e:","🦴"],["r|o:o_e|p|e:","🪢"],["c|u:u_e|b|e:","🧊"],["g|a:a_e|t|e:",""],["l|a:a_e|k|e:","🏞️"],
      ["n|i:i_e|n|e:","9️⃣"],["f|i:i_e|v|e:","5️⃣"],["p|l|a:a_e|n|e:","🛩️"],["s|l|i:i_e|d|e:","🛝"],["s|m|i:i_e|l|e:","😊"],["s|n|a:a_e|k|e:","🐍"],["h|o:o_e|m|e:","🏠"],["m|u:u_e|l|e:",""]],
    "vowel teams":[["r|ai|n","🌧️"],["t|r|ai|n","🚆"],["s|n|ai|l","🐌"],["t|ai|l",""],["m|ai|l","📬"],["p|l|ay",""],["h|ay","🌾"],["t|r|ay",""],
      ["b|oa|t","⛵"],["c|oa|t","🧥"],["r|oa|d","🛣️"],["s|oa|p","🧼"],["t|oa|s|t","🍞"],["n|igh|t","🌃"],["l|igh|t","💡"]],
    "bossy r":[["c|ar","🚗"],["s|t|ar","⭐"],["j|ar","🫙"],["sh|ar|k",""],["f|ar|m","🚜"],["c|or|n","🌽"],["f|or|k","🍴"],["h|or|s|e:","🐴"],["s|t|or|m","⛈️"],
      ["b|ir|d","🐦"],["g|ir|l","👧"],["sh|ir|t","👕"],["n|ur|s|e:",""],["p|ur|s|e:","👛"],["f|er|n","🌿"]]
  };
  const G3_WORDS = {
    "compound words":[["sun|set","🌅"],["rain|bow=bo","🌈"],["cup|cake","🧁"],["foot|ball","🏈"],["pop|corn","🍿"],["snow=sno|man","⛄"],["back|pack","🎒"],
      ["mail|box",""],["air|plane",""],["star|fish",""],["home|work",""],["sand|box",""],["pan|cake","🥞"],["bed|time",""],["sun|flow=flau|er=ur","🌻"]],
    "two syllables":[["rab|bit","🐇"],["pic|nic=nick","🧺"],["kit|ten","🐈"],["mag|net","🧲"],["bas|ket",""],["muf=muff|fin",""],["hel=hell|met","⛑️"],["pen|cil=sil","✏️"],
      ["rock|et=it","🚀"],["lem|on=un","🍋"],["drag|on=un","🐉"],["nap|kin",""],["tick|et=it","🎟️"],["pump|kin","🎃"],["rob|in=inn",""]],
    "endings":[["jump|ing",""],["sleep|ing",""],["play|ing",""],["fast|er=ur",""],["fast|est",""],["tall|er=ur",""],["small|est",""],["help|ful=full",""],
      ["sing|er=ur","🎤"],["farm|er=ur",""],["paint|er=ur",""],["kind|ly=lee",""],["soft|ly=lee",""],["quick|est",""],["rain|ing",""]]
  };
  const G4_WORDS = {
    "prefixes":[["un|hap|py=pee",""],["un|lock","🔓"],["re=ree|play",""],["re=ree|fill",""],["re=ree|build",""],["dis|like",""],["dis|a=uh|gree",""],
      ["mis|spell",""],["pre=pree|heat",""],["non|stop",""],["un|fair",""],["im=imm|poss|i=ih|ble=bull",""],["un|tie",""],["re=ree|write",""],["dis|o=uh|bey=bay",""]],
    "suffixes":[["care|ful=full",""],["help|less",""],["kind|ness",""],["dark|ness",""],["hope|ful=full",""],["fear|less",""],["quick|ly=lee",""],["teach|er=ur",""],
      ["en=enn|joy|ment",""],["pay|ment",""],["use=yoose|ful=full",""],["beau=byoo|ti=tih|ful=full",""],["fool|ish",""],["wash|a=uh|ble=bull",""],["sad|ness",""]]
  };
  const G5_WORDS = {
    "Greek and Latin roots":[["tel=tell|e=uh|phone=fone",""],["mi=my|cro=crow|scope",""],["au=aw|to=tow|graph=graf",""],["pho=foe|to=tuh|graph=graf",""],["trans|port",""],
      ["in|spect",""],["bi=by|cy=sih|cle=cull",""],["tri=try|an|gle=gull",""],["tel=tell|e=uh|vi=vih|sion=zhun",""],["bi=by|og=ogg|ra=ruh|phy=fee",""],
      ["struc=struck|ture=cher",""],["port|a=uh|ble=bull",""],["ther=thur|mom=mahm|e=uh|ter=tur",""],["geo=jee|og=ogg|ra=ruh|phy=fee",""],["sub|ma=muh|rine=reen",""]],
    "big words":[["in|ven|tion=shun",""],["ex|plo=ploh|ra=ray|tion=shun",""],["ad|ven|ture=cher",""],["di=dye|no=nuh|saur=sore",""],["con|ti=tih|nent",""],
      ["hab|i=ih|tat",""],["en=enn|er=ur|gy=jee",""],["ex|per=pair|i=ih|ment",""],["hur|ri=ih|cane=cain",""],["vol=vahl|ca=cay|no=noh",""],
      ["mi=my|gra=gray|tion=shun",""],["con|stel|la=lay|tion=shun",""],["ar|chi=kih|tect",""],["e=ih|lec=leck|tric=trick|i=ih|ty=tee",""],["re=rih|mark|a=uh|ble=bull",""]]
  };

  // acts: which reading activities each grade shows (in this order)
  const READING = {
    prek:{ blurb:"Letter sounds, rhyming, syllables", sounds:PINK_SOUNDS, words:{}, acts:["sounds","rhyme","clap","ispy","trace","tricky"] },
    k:   { blurb:"3-letter words", sounds:PINK_SOUNDS, words:wordList(K_WORDS), acts:["sounds","rhyme","clap","boxes","blend","build","match","lastsound","ispy","trace","tricky","stories"] },
    g1:  { blurb:"Blends, sh ch th ck ee oo ng", sounds:[...GREEN_SOUNDS, "a","e","i","o","u"], words:wordList(G1_WORDS), acts:["sounds","boxes","blend","build","match","lastsound","ispy","tricky","stories"] },
    g2:  { blurb:"Long vowels and bossy r", sounds:LONG_SOUNDS, words:wordList(G2_WORDS), acts:["sounds","blend","build","match","tricky","stories"] },
    g3:  { blurb:"Syllables and endings", chunks:true, words:wordList(G3_WORDS, "chunks"), acts:["blend","build","vocab","tricky","stories"] },
    g4:  { blurb:"Prefixes and suffixes", chunks:true, words:wordList(G4_WORDS, "chunks"), acts:["blend","build","vocab","stories"] },
    g5:  { blurb:"Greek and Latin roots", chunks:true, words:wordList(G5_WORDS, "chunks"), acts:["blend","build","vocab","stories"] }
  };
  for (const id in READING) { READING[id].tricky = TRICKY_BY[id] || []; READING[id].vocab = VOCAB[id] || []; }

  // Stories. Each page: text and a picture. q: question with answers (first is right), [answer, picture].
  const STORIES = [
    { id:"jet", level:"k", title:"Sam and the Jet", cover:"🚀", pages:[
      ["Sam has a big red jet.","🚀"],["Sam and his cat get in.","🐱"],["The jet can zip up and up.","✨"],
      ["The sun is hot. The cat naps.","☀️"],["Bump! The jet lands in the mud.","💥"],["Sam and the cat had fun.","😄"]],
      q:["Who got in the jet with Sam?",[["cat","🐱"],["dog","🐶"],["pig","🐷"]]] },
    { id:"bug", level:"k", title:"The Bug on the Log", cover:"🐛", pages:[
      ["A bug sat on a log.","🐛"],["A big pig ran to the log.","🐷"],["The bug did not like the pig.","😟"],
      ["The bug hid in the log.","🪵"],["The pig sat on the log.","🐷"],["The log was wet. Yuck!","💧"]],
      q:["Where did the bug hide?",[["log","🪵"],["cup","☕"],["bed","🛏️"]]] },
    { id:"pup", level:"k", title:"Pip the Pup", cover:"🐕", pages:[
      ["Pip is a pup.","🐕"],["Pip digs in the mud.","⛏️"],["Pip gets a big red box.","📦"],
      ["In the box is a hat.","🎩"],["Pip has the hat on.","🎩"],["Pip is a pup in a hat!","🐶"]],
      q:["What was in the box?",[["hat","🎩"],["sock","🧦"],["egg","🥚"]]] },
    { id:"frog", level:"g1", title:"Fred the Frog", cover:"🐸", pages:[
      ["Fred is a frog in a pond.","🐸"],["Fred can jump and swim.","🏊"],["A crab spots Fred.","🦀"],
      ["Snap, snap! said the crab.","🦀"],["Fred jumps on a big plant.","🌱"],["Fred is fast. The crab is not!","🐸"]],
      q:["Who wanted to get Fred?",[["crab","🦀"],["dog","🐶"],["bee","🐝"]]] },
    { id:"drum", level:"g1", title:"The Lost Drum", cover:"🥁", pages:[
      ["Glen has a drum.","🥁"],["Bam, bam, bam!","🥁"],["Glen lost his drum.","😟"],
      ["It is not in the tent.","⛺"],["It is not on the desk.","🪑"],["It is in the sand! Glen is glad.","😄"]],
      q:["Where was the drum?",[["sand","🏖️"],["tent","⛺"],["bed","🛏️"]]] },
    { id:"moon", level:"g1", title:"Jack and the Moon Ship", cover:"🌙", pages:[
      ["Jack has a ship.","🚀"],["The ship can zoom to the moon.","🌙"],["On the moon, Jack sees a rock.","🪨"],
      ["The rock is not a rock. It is a green bug!","🐛"],["The bug has ten feet.","🦶"],["Jack and the bug had lunch. Then Jack zoomed back.","🚀"]],
      q:["What did Jack see on the moon?",[["bug","🐛"],["duck","🦆"],["sheep","🐑"]]] },
    { id:"sheep", level:"g1", title:"Six Sheep", cover:"🐑", pages:[
      ["Six sheep sleep in a shed.","🐑"],["A chick sings, cheep, cheep!","🐥"],["The sheep get up.","🐑"],
      ["The sheep munch on green grass.","🌱"],["Then the sheep need a bath.","🛁"],["Splash! Six wet sheep!","💦"]],
      q:["Who sang cheep, cheep?",[["chick","🐥"],["sheep","🐑"],["fish","🐟"]]] },
    { id:"kite", level:"g2", title:"Jane and the Kite", cover:"🪁", pages:[
      ["Jane has a red kite.","🪁"],["She runs to the lake with it.","🏞️"],["The wind takes the kite up high.","🌬️"],
      ["It sails by a goat on a hill.","🐐"],["Then the rain came, so Jane ran home.","🌧️"],["Jane and her kite are wet, but safe.","🏠"]],
      q:["Where did Jane take her kite?",[["lake","🏞️"],["farm","🚜"],["store","🏪"]]] },
    { id:"farm", level:"g2", title:"A Storm on the Farm", cover:"🚜", pages:[
      ["Bert has a farm with a big red barn.","🚜"],["A dark storm is on the way.","⛈️"],["Bert gets the horse and the goat.","🐴"],
      ["He takes them into the barn.","🛖"],["The storm is loud, but the barn keeps them dry.","☔"],["In the morning, the sun is out.","🌞"]],
      q:["Where did Bert take the horse and the goat?",[["barn","🛖"],["boat","⛵"],["car","🚗"]]] },
    { id:"garden", level:"g3", title:"The Secret Seed Box", cover:"🌻", pages:[
      ["Maya found an old wooden box behind the shed.","📦"],["Inside were packets of seeds and a folded note.","🌱"],["The note said, Plant me and wait.","📝"],
      ["Maya planted the seeds and watered them every morning.","💧"],["After three weeks, tiny green sprouts popped up.","🌿"],["By summer, her yard was full of bright sunflowers.","🌻"]],
      q:["What grew from the seeds?",[["sunflowers","🌻"],["apples","🍎"],["carrots","🥕"]]] },
    { id:"robot", level:"g3", title:"Robot Rex Helps Out", cover:"🤖", pages:[
      ["Rex was a small robot who lived in a busy kitchen.","🤖"],["Every morning, he helped Dad make pancakes.","🥞"],["One day, Rex dropped a bowl of batter on the floor.","🥣"],
      ["Rex felt terrible, but Dad just laughed.","😄"],["Together they cleaned up the mess and started again.","🧽"],["The second batch of pancakes was the best ever.","⭐"]],
      q:["What did Dad do when Rex dropped the bowl?",[["He laughed.","😄"],["He yelled.","😠"],["He cried.","😢"]]] },
    { id:"volcano", level:"g4", title:"Inside a Volcano", cover:"🌋", pages:[
      ["A volcano is an opening in the Earth's crust.","🌋"],["Deep underground, rock gets so hot that it melts into magma.","🔥"],["When pressure builds up, the magma pushes toward the surface.","⬆️"],
      ["Once it flows out of the volcano, magma is called lava.","🌋"],["The lava slowly cools and hardens into new rock.","🪨"],["Over many years, eruptions can build whole islands.","🏝️"]],
      q:["What is magma called after it flows out of a volcano?",[["lava","🌋"],["steam","💨"],["sand","🏖️"]]] },
    { id:"lighthouse", level:"g4", title:"The Lighthouse Keeper", cover:"🌊", pages:[
      ["Grandpa Leo kept the lighthouse on the rocky coast.","🌊"],["Each night, he climbed one hundred steps to light the lamp.","🪜"],["One stormy evening, the lamp flickered and went dark.","🌩️"],
      ["Leo heard a ship's horn somewhere in the fog.","🚢"],["He quickly replaced the bulb, and the beam swept across the water.","💡"],["The ship turned safely away from the rocks.","⚓"]],
      q:["Why was the ship in danger?",[["The light went out.","🌩️"],["It ran out of fuel.","⛽"],["A whale bumped it.","🐋"]]] },
    { id:"bees", level:"g5", title:"Why Bees Matter", cover:"🐝", pages:[
      ["Honeybees do much more than make honey.","🐝"],["As they collect nectar, pollen sticks to their fuzzy bodies.","🌼"],["When they visit the next flower, some of that pollen rubs off.","🌸"],
      ["This process, called pollination, helps plants make fruit and seeds.","🍎"],["Bees help pollinate about one third of the food people eat.","🥕"],["Protecting bees means protecting our food supply.","🌍"]],
      q:["What is the main idea?",[["Bees are important for growing food.","🐝"],["Bees make a lot of honey.","🍯"],["Bees can sting people.","⚠️"]]] },
    { id:"mars", level:"g5", title:"Mission to Mars", cover:"🔴", pages:[
      ["Captain Ortiz checked the screens one last time before landing.","👩‍🚀"],["Mars glowed a rusty red outside the small window.","🔴"],["The crew felt a jolt as the lander touched the dusty ground.","🛬"],
      ["Through her visor, Ortiz saw towering cliffs and a pale pink sky.","🏜️"],["She planted a flag and recorded a message for everyone back on Earth.","🚩"],["We made it, she said. This is only the beginning.","🚀"]],
      q:["How does Captain Ortiz most likely feel at the end?",[["Proud and hopeful","😊"],["Bored and sleepy","😴"],["Angry and upset","😠"]]] }
  ];

  // Spoken prompts (key -> text). Each becomes audio/p_<key>.mp3
  const PHRASES = {
    great:"Great job!", gotit:"You got it!", awesome:"Awesome!", super:"Super reading!", yes:"Yes!", wow:"Wow!", nice:"Nice work!",
    again:"Try again. Listen.", together:"Let's try it together.", blast:"Blast off! Great reading!", goodsounds:"Good sounds! Now blend them.",
    thisword:"This word is", like:"like", thisis:"This is", showme:"Show me", whatsound:"What sound is this?",
    ispy:"I spy something that starts with", build:"Build the word", which:"Which picture shows this word?",
    trace:"Trace it with your finger and say the sound.", findit:"Find the letter that says", thats:"That's",
    finished:"You read the whole story!", mission:"Mission complete! You did your reading today!", levelup:"New planet unlocked!",
    notquite:"Not quite. Try another one.", listen:"Listen.",
    // added with the grade levels and math
    mission2:"Mission complete! Great work today!", blast2:"Blast off! Great work!", chunks:"Good chunks! Now read the whole word.",
    meaning:"What does this word mean?", silent:"This e is silent. It makes the vowel say its name.", answeris:"The answer is",
    smart:"Smart thinking!", correct:"That's right!",
    startswith:"Which picture starts with this sound?", findword:"Find the word", round:"Round complete! Great job!", streak:"You're on a streak! Keep it up!", bonus:"Bonus blast off!", checked:"Checked off! Great work!", round3:"Three stars! Amazing!", roundbest:"Round complete! New best score!", roundtry:"Round complete! Play again to earn more stars."
  };


  // Reading activities: id -> [icon, name, what it is, note for grown-ups]
  const ACTS = {
    sounds: ["🔤", "Sound Cards", "Learn a sound, find it, say it", "Montessori 3-step lesson"],
    trace: ["✍️", "Trace It", "Trace the letter and say its sound", "Sandpaper letters"],
    ispy: ["🔭", "I Spy", "Find what starts with the sound", "Listening game"],
    blend: ["🧩", "Blend It", "Sound out a word, find its picture", "Blending: sound by sound, then the whole word"],
    build: ["🛠️", "Build a Word", "Hear a word, build it with letters", "Movable alphabet"],
    match: ["🖼️", "Read & Match", "Read the word, pick the picture", "Reads alone"],
    rhyme: ["🎵", "Rhyme Time", "Which words rhyme?", "Phonemic awareness: rhyming"],
    clap: ["👏", "Clap It", "Clap the parts of a word", "Phonemic awareness: syllables"],
    boxes: ["🟦", "Sound Boxes", "How many sounds in a word?", "Elkonin boxes: segmenting sounds"],
    lastsound: ["🔚", "Last Sound", "What sound does it end with?", "Phonemic awareness: ending sounds"],
    tricky: ["❤️", "Heart Words", "Learn tricky words by heart", "Heart words: sound out what you can, learn the rest by heart"],
    vocab: ["💬", "Word Meaning", "Read a word, pick what it means", "Vocabulary"],
    stories: ["📖", "Storybook", "Read a little story yourself", "Stories and questions"]
  };
  // 3rd grade and up read in syllable chunks instead of letter sounds
  const CHUNK_ACTS = {
    blend: ["🧩", "Chunk It", "Read big words chunk by chunk", "Syllables: read each chunk, then the whole word"],
    build: ["🛠️", "Build a Word", "Put the word's chunks in order", "Syllable tiles"]
  };
  return { HEART, ACTS, CHUNK_ACTS, GRADES, SOUNDS, SOUND_CLIP, PINK_SOUNDS, GREEN_SOUNDS, LONG_SOUNDS, VOWELS, PHONOGRAMS, READING, TRICKY, TRICKY_BY, VOCAB, STORIES, PHRASES, tiles, slug };
})();
