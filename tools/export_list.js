// Writes tools/clips.json: every clip the game needs, for build_audio.py
global.window={}; require("../js/data.js"); const D=window.DATA; const fs=require("fs");
const key=w=>"w_"+(w==="I"?"cap_i":w.toLowerCase().replace(/[^a-z]/g,""));
const words={}, stretched={}, sentences={}, phrases={...D.PHRASES};
const addW=w=>{words[key(w)]=w};
D.LEVELS.forEach(l=>Object.values(l.words).flat().forEach(([w])=>{addW(w);stretched["st_"+w]=w;}));
Object.values(D.SOUNDS).forEach(([,kw])=>addW(kw));
D.TRICKY.forEach(addW);
D.STORIES.forEach(s=>{
  sentences["title_"+s.id]=s.title;
  s.pages.forEach(([t],i)=>{sentences[`sent_${s.id}_${i}`]=t; t.replace(/[^A-Za-z' ]/g," ").split(/\s+/).filter(Boolean).forEach(addW);});
  sentences["q_"+s.id]=s.q[0]; s.q[1].forEach(([w])=>addW(w));
});
fs.writeFileSync(__dirname+"/clips.json",JSON.stringify({sounds:Object.keys(D.SOUNDS),words,stretched,sentences,phrases},null,1));
console.log(Object.keys(words).length,"words",Object.keys(stretched).length,"stretched",Object.keys(sentences).length,"sentences",Object.keys(phrases).length,"phrases");
