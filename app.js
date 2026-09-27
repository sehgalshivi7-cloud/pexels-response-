const $=id=>document.getElementById(id);
const rules=[
[/\b(bus|बस|coach)\b/i,["old bus desert road","vintage bus driving","passengers inside old bus","remote bus mountain road"],"bus/travel"],
[/\b(desert|रेगिस्तान)\b/i,["desert road aerial","remote desert road","people traveling desert"],"desert"],
[/\b(investigat|जांच|तफ्तीश|officer|अधिकारी|intelligence|खुफिया|detective)\w*/i,["investigators examining documents","intelligence officers meeting","detectives office","investigation files desk"],"investigation"],
[/\b(map|नक्शा|maps)\b/i,["people studying map","investigators examining map","vintage map close up"],"map"],
[/\b(photo|photograph|फोटो|तस्वीर)\b/i,["detective examining photographs","old photographs on desk","investigation photographs close up"],"photographs"],
[/\b(office|कमरा|दफ्तर)\b/i,["vintage intelligence office","detectives working in office","1950s office interior"],"office"],
[/\b(mountain|पहाड़|pass|दर्रा)\b/i,["remote mountain pass road","mountain road travel","desert mountains road"],"mountain"],
[/\b(sea|समुद्र|coast|तट)\b/i,["coastline aerial","sea shore documentary","Mediterranean coast"],"coast"],
[/\b(Tel Aviv|तेल अवीव)\b/i,["Tel Aviv old streets","1950s Tel Aviv street","Israel vintage city street"],"city"]
];
function clean(s){return s.replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m]))}
function split(t){return t.split(/\n+/).flatMap(p=>p.split(/(?<=[.!?।])\s+/)).map(x=>x.trim()).filter(x=>x.length>12).slice(0,100)}
function getQueries(line){
 let out=[], tags=[];
 for(const [re,qs,tag] of rules) if(re.test(line)){out.push(...qs);tags.push(tag)}
 if(!out.length){
  const words=line.replace(/[^\p{L}\p{N}\s]/gu," ").split(/\s+/).filter(w=>w.length>3).slice(0,6);
  const base=words.join(" ");
  out=[base+" documentary footage",base+" people",base+" location"];
  tags=["general"];
 }
 return {queries:[...new Set(out)].slice(0,5),tags:[...new Set(tags)]}
}
function visual(line,q){if(q.tags.includes("bus"))return "Realistic passenger bus travelling through the kind of landscape described in the narration.";if(q.tags.includes("investigation"))return "Documentary-style investigators, documents, photographs or an intelligence office matching the narration.";if(q.tags.includes("map"))return "Close documentary shots of people studying maps or planning around a desk.";if(q.tags.includes("mountain"))return "Realistic remote mountain/pass landscape and travel footage.";return "Realistic documentary footage that visually represents the narration without adding invented events."}
function pexels(q){window.open("https://www.pexels.com/search/videos/"+encodeURIComponent(q)+"/","_blank","noopener")}
function render(lines){
 const r=$("results");r.innerHTML="";
 if(!lines.length){r.innerHTML='<div class="empty">No usable shots found. Paste more narration.</div>';return}
 let all=[];
 lines.forEach((line,i)=>{
  const info=getQueries(line); all.push(...info.queries);
  const card=document.createElement("article");card.className="shot";
  card.innerHTML=`<div class="shot-number">SHOT ${i+1}</div><div class="narration">${clean(line)}</div><div class="visual"><b>VISUAL:</b> ${clean(visual(line,info))} <span class="tag">${info.tags.join(" · ")}</span></div><div class="chips"></div><button class="copy">COPY SHOT SEARCHES</button>`;
  const chips=card.querySelector(".chips");
  info.queries.forEach(q=>{const b=document.createElement("button");b.className="chip";b.textContent="🔎 "+q;b.onclick=()=>pexels(q);chips.appendChild(b)});
  card.querySelector(".copy").onclick=async()=>{await navigator.clipboard.writeText(info.queries.join("\n"));card.querySelector(".copy").textContent="COPIED ✓";setTimeout(()=>card.querySelector(".copy").textContent="COPY SHOT SEARCHES",1200)};
  r.appendChild(card);
 });
 const top=document.createElement("div");top.className="card";top.innerHTML=`<b>${lines.length} shots generated</b><br><button class="copy" id="copyall">COPY ALL PEXELS SEARCHES</button>`;
 top.querySelector("#copyall").onclick=async()=>{await navigator.clipboard.writeText([...new Set(all)].join("\n"));top.querySelector("#copyall").textContent="COPIED ✓"};
 r.prepend(top);
}
$("analyze").onclick=()=>{const t=$("script").value.trim();if(!t){$("status").textContent="Paste your script first.";return}localStorage.setItem("psf_script",t);const lines=split(t);render(lines);$("status").textContent="Analysis complete. Tap any search to open Pexels."};
$("clear").onclick=()=>{$("script").value="";$("results").innerHTML="";$("status").textContent="";localStorage.removeItem("psf_script")};
$("script").value=localStorage.getItem("psf_script")||"";