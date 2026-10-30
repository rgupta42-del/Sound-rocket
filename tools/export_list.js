// Writes tools/clips.json: every clip the game needs, for build_audio.py
global.window={}; require("../js/data.js"); require("../js/math.js"); require("../js/geo-maps.js"); require("../js/geo.js"); require("../js/reading-games.js"); const D=window.DATA, M=window.MATH; const fs=require("fs");
const key=w=>"w_"+(w==="I"?"cap_i":w.toLowerCase().replace(/[^a-z]/g,""));
const words={}, stretched={}, chunks={}, sentences={}, phrases={...D.PHRASES,...window.READGAMES.PHRASES}, defs={}, math=M.clips(), geo=window.GEO.clips();
const addW=w=>{words[key(w)]=w};
Object.values(D.READING).forEach(l=>Object.values(l.words).flat().forEach(([w,,parts])=>{
  addW(w);
  if(l.chunks) parts.forEach(p=>{chunks[p.clip]=p.clip.slice(2);});
  else stretched["st_"+w]=w;
}));
Object.values(D.SOUNDS).forEach(([,kw])=>addW(kw));
D.TRICKY.forEach(addW);
window.READGAMES.words().forEach(addW);
Object.values(D.VOCAB).flat().forEach(([w,d])=>{addW(w);defs["d_"+D.slug(w)]=d;});
Object.assign(sentences,window.READGAMES.sentences());
D.STORIES.forEach(s=>{
  sentences["title_"+s.id]=s.title;
  s.pages.forEach(([t],i)=>{sentences[`sent_${s.id}_${i}`]=t; t.replace(/[^A-Za-z' ]/g," ").split(/\s+/).filter(Boolean).forEach(addW);});
  sentences["q_"+s.id]=s.q[0];
  s.q[1].forEach(([w],i)=>{ if(/^[a-z]+$/i.test(w)) addW(w); else sentences[`ans_${s.id}_${i}`]=w; });
});
// spoken names of subjects and activities (Pre-K and K hear a card's name on the first tap)
const labels={}, addL=n=>{labels["lbl_"+D.slug(n)]=n};
["Reading","Math","Geography"].forEach(addL);
[...Object.values(D.ACTS),...Object.values(D.CHUNK_ACTS)].forEach(a=>addL(a[1]));
for(const P of [M,window.GEO,{GRADE_SKILLS:{all:Object.keys(window.READGAMES.SK).map(id=>[id])},SK:window.READGAMES.SK}]) for(const list of Object.values(P.GRADE_SKILLS)) list.forEach(([id,,name])=>addL(name||P.SK[id].name));
fs.writeFileSync(__dirname+"/clips.json",JSON.stringify({sounds:Object.keys(D.SOUNDS),words,stretched,chunks,sentences,phrases,defs,math,geo,labels},null,1));
console.log(Object.keys(words).length,"words",Object.keys(stretched).length,"stretched",Object.keys(chunks).length,"chunks",Object.keys(sentences).length,"sentences",
  Object.keys(phrases).length,"phrases",Object.keys(defs).length,"meanings",Object.keys(math).length,"math",Object.keys(geo).length,"geography",Object.keys(labels).length,"labels");
