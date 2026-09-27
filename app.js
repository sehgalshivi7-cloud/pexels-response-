const $=s=>document.querySelector(s),key=$('#key'),script=$('#script'),results=$('#results'),status=$('#status'),progress=$('#progress');

function validKey(k){
  // Pexels API keys are sent directly as the Authorization header value.
  // Reject non-ASCII/whitespace characters before fetch() so Android browsers
  // don't throw the confusing ByteString error.
  return /^[!#-~]+$/.test(k);
}
function getKey(){
  const k=key.value.trim()||localStorage.getItem('pexels_api_key')||'';
  if(!k) throw Error('NO_KEY');
  if(!validKey(k)) throw Error('BAD_KEY_CHARS');
  return k;
}
function setStatus(t,ok=false){status.textContent=t;status.className=ok?'ok':'bad'}

key.value=localStorage.getItem('pexels_api_key')||'';
if(key.value){
  if(validKey(key.value.trim())) setStatus('API key saved on this device.',true);
  else setStatus('Saved key is malformed: it contains a non-ASCII or whitespace character. Clear it and paste the key directly from Pexels.');
}

$('#save').onclick=()=>{
  const k=key.value.trim();
  if(!k)return setStatus('Paste your Pexels API key first.');
  if(!validKey(k))return setStatus('This key contains a non-ASCII character or whitespace. Copy the key directly from Pexels; do not type or translate it.');
  localStorage.setItem('pexels_api_key',k);setStatus('Saved locally on this device.',true);
};
$('#clear').onclick=()=>{localStorage.removeItem('pexels_api_key');key.value='';setStatus('Key cleared.')};

script.oninput=()=>$('#words').textContent=(script.value.match(/\S+/g)||[]).length+' words';

function split(t){return t.trim().split(/\n+/).flatMap(x=>x.split(/(?<=[.!?।])\s+/)).map(x=>x.trim()).filter(Boolean)}
function queries(s){let x=s.toLowerCase(),q=[];let add=a=>a.forEach(v=>{if(!q.includes(v))q.push(v)});if(/बस|bus|coach/.test(x))add(['old bus driving on mountain road','vintage bus road journey','bus through barren landscape']);if(/पहाड़|mountain|पर्वत|pass|दर्रा|घाट/.test(x))add(['mountain pass road landscape','barren mountain road','rocky mountain valley road']);if(/रेगिस्तान|desert|बंजर|सूखा|sand/.test(x))add(['barren desert landscape','desert road wide shot','dry rocky desert landscape']);if(/जांच|investig|तफ्तीश|detective|अधिकारी|officer|intelligence|खुफिया/.test(x))add(['intelligence officers investigation office','detective examining documents','investigation room paperwork']);if(/नक्शा|map|मानचित्र/.test(x))add(['hands studying paper map','vintage map investigation desk','map and documents close up']);if(/फोटो|photograph|तस्वीर|picture/.test(x))add(['black and white photographs on desk','investigation photographs close up','old photographs documents desk']);if(/शहर|city|tel aviv|तेल अवीव/.test(x))add(['Tel Aviv city street','old city street documentary','Israeli city street']);if(/रात|night|अंधेरा|dark/.test(x))add(['night street documentary','dark city street','night road headlights']);if(!q.length){let w=s.replace(/[^\p{L}\p{N}\s-]/gu,' ').split(/\s+/).filter(a=>a.length>3);add([w.slice(0,5).join(' ')+' documentary footage',w.slice(0,4).join(' ')+' landscape footage','realistic '+w.slice(0,4).join(' ')+' scene'])}return q.slice(0,3)}

async function search(q,n){
  const k=getKey();
  const u='https://api.pexels.com/v1/videos/search?'+new URLSearchParams({query:q,orientation:'landscape',size:'medium',per_page:Math.min(20,n)});
  let r;
  try{r=await fetch(u,{headers:{Authorization:k}})}catch(e){throw Error('NETWORK_ERROR: '+(e?.message||'The browser could not reach Pexels.'))}
  if(r.status===401)throw Error('INVALID_KEY');
  if(r.status===429)throw Error('RATE_LIMIT');
  if(!r.ok)throw Error('Pexels error '+r.status);
  return r.json();
}

async function testKey(){
  try{
    const k=getKey();
    setStatus('Testing key with Pexels…');
    const u='https://api.pexels.com/v1/videos/search?'+new URLSearchParams({query:'mountain road',orientation:'landscape',size:'medium',per_page:1});
    const r=await fetch(u,{headers:{Authorization:k}});
    if(r.status===401)throw Error('INVALID_KEY');
    if(r.status===429)throw Error('RATE_LIMIT');
    if(!r.ok)throw Error('Pexels error '+r.status);
    const d=await r.json();
    setStatus('Pexels connection works. '+(d.videos?.length||0)+' test result returned.',true);
  }catch(e){
    if(e.message==='NO_KEY')setStatus('Paste your Pexels API key first.');
    else if(e.message==='BAD_KEY_CHARS')setStatus('Key rejected before sending: it contains a non-ASCII character or whitespace.');
    else if(e.message==='INVALID_KEY')setStatus('Pexels rejected this key (401). Copy a fresh API key from your Pexels dashboard.');
    else if(e.message==='RATE_LIMIT')setStatus('Pexels rate limit reached (429).');
    else setStatus(e.message||'Could not test the key.');
  }
}
$('#test').onclick=testKey;

function file(v){return (v.video_files||[]).find(f=>+f.width===1920&&+f.height===1080)||null}
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function render(i,s,qs,items){let el=document.createElement('section');el.className='shot';el.innerHTML='<div class="shothead"><div class="num">SHOT '+String(i+1).padStart(2,'0')+'</div><div class="narration">'+esc(s)+'</div><div class="queries">'+qs.map(q=>'<span class="q">'+esc(q)+'</span>').join('')+'</div></div><div class="cards">'+(items.length?items.map(({v,f})=>'<article class="card"><div class="thumb"><img loading="lazy" src="'+esc(v.image)+'"></div><div class="meta"><div>'+esc(v.user?.name||'Pexels creator')+'</div><div class="chips"><span class="chip">1920×1080</span><span class="chip">'+(v.duration||'?')+'s</span><span class="chip">'+(f.fps||'')+' fps</span></div><div class="actions"><a class="watch" href="'+esc(f.link)+'" target="_blank">Watch</a><button class="use" data-link="'+esc(f.link)+'">Use</button></div></div></article>').join(''):'<div class="empty">No exact 1920×1080 landscape result found for this shot.</div>')+'</div>';results.appendChild(el);el.querySelectorAll('.use').forEach(b=>b.onclick=()=>{navigator.clipboard?.writeText(b.dataset.link);b.textContent='Copied';setTimeout(()=>b.textContent='Use',900)})}

$('#go').onclick=async()=>{
  results.innerHTML='';
  try{getKey()}catch(e){
    if(e.message==='NO_KEY')setStatus('Add your Pexels API key first.');
    else setStatus('Your saved/pasted API key contains a non-ASCII character or whitespace. Clear it and paste the key directly from Pexels.');
    return;
  }
  let shots=split(script.value);
  if(!shots.length)return results.innerHTML='<section class="panel empty">Paste your narration first.</section>';
  let limit=+$('#count').value;progress.classList.remove('hidden');$('#go').disabled=true;
  try{
    for(let i=0;i<shots.length;i++){
      let qs=queries(shots[i]),map=new Map();progress.textContent='Finding footage for shot '+(i+1)+' of '+shots.length+'…';
      for(let q of qs){let d=await search(q,20);for(let v of d.videos||[]){let f=file(v);if(f&&!map.has(v.id))map.set(v.id,{v,f})}}
      render(i,shots[i],qs,[...map.values()].slice(0,limit));
    }
    progress.textContent='Finished — '+shots.length+' shots.';
  }catch(e){
    let msg=e.message==='INVALID_KEY'?'Pexels rejected the API key (401).':e.message==='RATE_LIMIT'?'Pexels rate limit reached (429).':e.message==='BAD_KEY_CHARS'?'The API key contains a non-ASCII character or whitespace.':e.message==='NO_KEY'?'Add your Pexels API key first.':e.message;
    results.insertAdjacentHTML('afterbegin','<section class="panel error">'+esc(msg)+'</section>');progress.textContent='Stopped.';
  }finally{$('#go').disabled=false}
};
