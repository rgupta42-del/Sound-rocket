// Sound Rocket content. Levels follow the Montessori reading series:
// Pink = short-vowel CVC words, Blue = 4–5 letter words with blends, Green = phonograms (sh, ch, th, ck, ee, oo, ng).
// Every word, sentence and prompt here has a matching recorded clip in /audio (built by tools/build_audio.py).

window.DATA = (() => {
  // How each sound card is spoken: key -> [display, keyword, keyword picture]
  const SOUNDS = {
    a:["a","apple","🍎"], b:["b","ball","⚽"], c:["c","cat","🐱"], d:["d","dog","🐶"], e:["e","egg","🥚"],
    f:["f","fish","🐟"], g:["g","goat","🐐"], h:["h","hat","🎩"], i:["i","insect","🐜"], j:["j","jam","🍓"],
    k:["k","kite","🪁"], l:["l","lion","🦁"], m:["m","moon","🌙"], n:["n","nest","🪺"], o:["o","octopus","🐙"],
    p:["p","pig","🐷"], qu:["qu","queen","👑"], r:["r","rocket","🚀"], s:["s","sun","☀️"], t:["t","turtle","🐢"],
    u:["u","up","⬆️"], v:["v","van","🚐"], w:["w","web","🕸️"], x:["x","fox","🦊"], y:["y","yo-yo","🪀"], z:["z","zebra","🦓"],
    sh:["sh","ship","🚢"], ch:["ch","chick","🐥"], th:["th","thumb","👍"], ck:["ck","duck","🦆"],
    ee:["ee","tree","🌳"], oo:["oo","moon","🌙"], ng:["ng","ring","💍"]
  };
  // Montessori order for introducing letter sounds (most useful first)
  const PINK_SOUNDS = "s a t p i n m d g o c k e u r h b f l j v w y z x qu".split(" ");
  const GREEN_SOUNDS = ["sh","ch","th","ck","ee","oo","ng"];
  const VOWELS = ["a","e","i","o","u","ee","oo"];
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

  // [word, picture]. A picture is "" when no clear picture exists (word still used for blending).
  const LEVELS = [
    { id:"pink", name:"Moon Base", color:"pink", blurb:"3-letter words", sounds:PINK_SOUNDS, words:{
      "short a":[["cat","🐱"],["hat","🎩"],["map","🗺️"],["bag","👜"],["van","🚐"],["jam","🍓"],["fan","🪭"],["rat","🐀"],["pan","🍳"],["cap","🧢"],["bat","🦇"],["ham","🍖"],["man","👨"],["sad","😢"],["can","🥫"]],
      "short i":[["pig","🐷"],["lip","👄"],["fin","🦈"],["big",""],["dig","⛏️"],["six","6️⃣"],["wig",""],["pin","📌"],["bib",""],["zip",""],["kid","🧒"],["hit",""],["sit",""],["mix",""],["lid",""]],
      "short o":[["dog","🐶"],["pot","🍲"],["fox","🦊"],["log","🪵"],["mop","🧹"],["box","📦"],["top","🔝"],["hot","🔥"],["cot",""],["hop",""],["dot",""],["job",""],["rod",""],["sob",""],["fog","🌫️"]],
      "short u":[["sun","☀️"],["bug","🐛"],["cup","☕"],["bus","🚌"],["hug","🤗"],["run","🏃"],["nut","🥜"],["tub","🛁"],["pup","🐕"],["gum",""],["mud",""],["rug",""],["cub",""],["jug",""],["bun",""]],
      "short e":[["bed","🛏️"],["hen","🐔"],["net","🥅"],["leg","🦵"],["red","🔴"],["ten","🔟"],["web","🕸️"],["jet","✈️"],["pen","🖊️"],["wet","💧"],["pet",""],["vet",""],["men",""],["fed",""],["yes","✅"]]
    }},
    { id:"blue", name:"Mars", color:"blue", blurb:"4- and 5-letter words", sounds:PINK_SOUNDS, words:{
      "4 letters":[["frog","🐸"],["flag","🚩"],["crab","🦀"],["drum","🥁"],["clap","👏"],["stop","🛑"],["swim","🏊"],["sled","🛷"],["plum",""],["plug","🔌"],["hand","✋"],["milk","🥛"],["lamp","🪔"],["nest","🪺"],["tent","⛺"],["belt",""],["desk",""],["jump",""],["gift","🎁"],["mask","🎭"],["pond",""],["sand",""],["spin",""],["step",""],["snap",""],["trip",""],["grin","😁"],["skip",""],["slug",""],["vest","🦺"]],
      "5 letters":[["stamp",""],["plant","🌱"],["trunk",""],["blimp",""],["twist",""],["frost",""],["skunk","🦨"],["print",""],["stand",""],["crisp",""],["grand",""],["crust",""],["drink","🥤"],["spend",""],["blend",""],["strap",""],["split",""],["sprint",""],["shrimp","🦐"]].filter(w=>w[0].length===5)
    }},
    { id:"green", name:"Saturn", color:"green", blurb:"sh, ch, th, ck, ee, oo, ng", sounds:GREEN_SOUNDS, words:{
      "sh ch th":[["ship","🚢"],["fish","🐟"],["dish",""],["shop",""],["shed",""],["chin",""],["chip",""],["chop",""],["much",""],["bath","🛁"],["moth",""],["math",""],["lunch",""],["shell","🐚"],["brush","🪥"]],
      "ck ng":[["duck","🦆"],["sock","🧦"],["rock","🪨"],["kick",""],["neck",""],["back",""],["truck","🚚"],["chick","🐥"],["ring","💍"],["king","🤴"],["wing",""],["sing",""],["long",""],["swing",""],["sting",""]],
      "ee oo":[["tree","🌳"],["bee","🐝"],["feet","🦶"],["seed",""],["sheep","🐑"],["teeth","🦷"],["three","3️⃣"],["green","🟢"],["moon","🌙"],["food",""],["boot","👢"],["spoon","🥄"],["broom","🧹"],["zoom",""],["pool",""]]
    }}
  ];

  const TRICKY = ["the","a","I","is","to","and","see","my","you","we","he","she","said","was","of","go","no","like","are","here","has","his","they","what","do"];

  // Decodable stories. Each page: text and a picture. q: comprehension question with picture answers (first is right).
  const STORIES = [
    { id:"jet", level:"pink", title:"Sam and the Jet", cover:"🚀", pages:[
      ["Sam has a big red jet.","🚀"],["Sam and his cat get in.","🐱"],["The jet can zip up and up.","✨"],
      ["The sun is hot. The cat naps.","☀️"],["Bump! The jet lands in the mud.","💥"],["Sam and the cat had fun.","😄"]],
      q:["Who got in the jet with Sam?",[["cat","🐱"],["dog","🐶"],["pig","🐷"]]] },
    { id:"bug", level:"pink", title:"The Bug on the Log", cover:"🐛", pages:[
      ["A bug sat on a log.","🐛"],["A big pig ran to the log.","🐷"],["The bug did not like the pig.","😟"],
      ["The bug hid in the log.","🪵"],["The pig sat on the log.","🐷"],["The log was wet. Yuck!","💧"]],
      q:["Where did the bug hide?",[["log","🪵"],["cup","☕"],["bed","🛏️"]]] },
    { id:"pup", level:"pink", title:"Pip the Pup", cover:"🐕", pages:[
      ["Pip is a pup.","🐕"],["Pip digs in the mud.","⛏️"],["Pip gets a big red box.","📦"],
      ["In the box is a hat.","🎩"],["Pip has the hat on.","🎩"],["Pip is a pup in a hat!","🐶"]],
      q:["What was in the box?",[["hat","🎩"],["sock","🧦"],["egg","🥚"]]] },
    { id:"frog", level:"blue", title:"Fred the Frog", cover:"🐸", pages:[
      ["Fred is a frog in a pond.","🐸"],["Fred can jump and swim.","🏊"],["A crab spots Fred.","🦀"],
      ["Snap, snap! said the crab.","🦀"],["Fred jumps on a big plant.","🌱"],["Fred is fast. The crab is not!","🐸"]],
      q:["Who wanted to get Fred?",[["crab","🦀"],["dog","🐶"],["bee","🐝"]]] },
    { id:"drum", level:"blue", title:"The Lost Drum", cover:"🥁", pages:[
      ["Glen has a drum.","🥁"],["Bam, bam, bam!","🥁"],["Glen lost his drum.","😟"],
      ["It is not in the tent.","⛺"],["It is not on the desk.","🪑"],["It is in the sand! Glen is glad.","😄"]],
      q:["Where was the drum?",[["sand","🏖️"],["tent","⛺"],["bed","🛏️"]]] },
    { id:"moon", level:"green", title:"Jack and the Moon Ship", cover:"🌙", pages:[
      ["Jack has a ship.","🚀"],["The ship can zoom to the moon.","🌙"],["On the moon, Jack sees a rock.","🪨"],
      ["The rock is not a rock. It is a green bug!","🐛"],["The bug has ten feet.","🦶"],["Jack and the bug had lunch. Then Jack zoomed back.","🚀"]],
      q:["What did Jack see on the moon?",[["bug","🐛"],["duck","🦆"],["sheep","🐑"]]] },
    { id:"sheep", level:"green", title:"Six Sheep", cover:"🐑", pages:[
      ["Six sheep sleep in a shed.","🐑"],["A chick sings, cheep, cheep!","🐥"],["The sheep get up.","🐑"],
      ["The sheep munch on green grass.","🌱"],["Then the sheep need a bath.","🛁"],["Splash! Six wet sheep!","💦"]],
      q:["Who sang cheep, cheep?",[["chick","🐥"],["sheep","🐑"],["fish","🐟"]]] }
  ];

  // Spoken prompts (key -> text). Each becomes audio/p_<key>.mp3
  const PHRASES = {
    great:"Great job!", gotit:"You got it!", awesome:"Awesome!", super:"Super reading!", yes:"Yes!", wow:"Wow!", nice:"Nice work!",
    again:"Try again. Listen.", together:"Let's try it together.", blast:"Blast off! Great reading!", goodsounds:"Good sounds! Now blend them.",
    thisword:"This word is", like:"like", thisis:"This is", showme:"Show me", whatsound:"What sound is this?",
    ispy:"I spy something that starts with", build:"Build the word", which:"Which picture shows this word?",
    trace:"Trace it with your finger and say the sound.", findit:"Find the letter that says", thats:"That's",
    finished:"You read the whole story!", mission:"Mission complete! You did your reading today!", levelup:"New planet unlocked!",
    notquite:"Not quite. Try another one.", listen:"Listen."
  };

  // Words that appear as pictures in games (so the game can name them)
  return { SOUNDS, PINK_SOUNDS, GREEN_SOUNDS, VOWELS, PHONOGRAMS, LEVELS, TRICKY, STORIES, PHRASES, tiles };
})();
