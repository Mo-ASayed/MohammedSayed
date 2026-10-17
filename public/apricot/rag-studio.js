// Deliberately small, inspectable vectors. No embedding model or LLM is called.
export const dimensions = ['Air travel', 'Hotels', 'Food', 'Cancellation', 'Baggage', 'Booking'];
const groups = [
 ['flight','flights','flgihts','plane','airline','airlines','airport','aircraft','fly','flying'],
 ['hotel','hotels','room','rooms','stay','accommodation'],
 ['food','meal','meals','restaurant','restaurants','dinner','eat'],
 ['cancel','cancelled','cancellation','refund','refundable'],
 ['bag','bags','baggage','luggage','suitcase','suitcases','carry'],
 ['book','booking','reserve','reservation','ticket','tickets']
];
const words = text => text.toLowerCase().match(/[a-z]+/g) || [];
export function embed(text) {
 const tokens = words(text);
 return groups.map(group => tokens.filter(token => group.includes(token)).length);
}
export function cosine(a,b) {
 const norm=Math.hypot(...a)*Math.hypot(...b);
 return norm ? a.reduce((sum,value,i)=>sum+value*b[i],0)/norm : 0;
}
export const documents = [
 {id:1,title:'Cabin bag allowance',text:'Flights include one cabin bag up to 8 kg. A suitcase must fit in the overhead locker.',vector:[3,0,0,0,4,0],x:24,y:25,current:true},
 {id:2,title:'Flight cancellation',text:'Cancel a flexible airline ticket at least 24 hours before departure for a refund.',vector:[3,0,0,4,0,1],x:36,y:35,current:true},
 {id:3,title:'Reserve a seat',text:'Book flights through the airline website. Choose your seat before paying.',vector:[3,0,0,0,0,4],x:20,y:47,current:true},
 {id:4,title:'Hotel check-in',text:'Your hotel room is available from 15:00. Bring a booking reference and photo ID.',vector:[0,4,0,0,0,1],x:73,y:28,current:true},
 {id:5,title:'Room cancellation',text:'Cancel a refundable hotel booking at least 48 hours before check-in for a refund.',vector:[0,3,0,4,0,1],x:82,y:45,current:true},
 {id:6,title:'Dinner reservations',text:'Reserve a table at the restaurant for dinner. Vegetarian meals are available.',vector:[0,0,4,0,0,2],x:60,y:77,current:true},
 {id:7,title:'Old cabin bag policy',text:'Flights include a cabin bag up to 12 kg. This policy was replaced by the 8 kg allowance.',vector:[3,0,0,0,4,0],x:39,y:19,current:false},
 {id:8,title:'Airport cafe',text:'The airport cafe serves food before your flight. Hot meals are available from 06:00.',vector:[2,0,3,0,0,0],x:30,y:69,current:true}
];
export function retrieve(query,mode='vector',k=3,currentOnly=true) {
 const tokens=words(query),vector=embed(query);
 return documents.filter(d=>!currentOnly||d.current).map(d=>({ ...d,score:mode==='vector'?cosine(vector,d.vector):tokens.filter(t=>words(d.title+' '+d.text).includes(t)).length/Math.max(tokens.length,1) }))
 .filter(d=>d.score>0).sort((a,b)=>b.score-a.score||a.id-b.id).slice(0,k);
}
export const missions = [
 {title:'Pack the right bag',question:'What is the cabin baggage weight limit for my flight?',query:'flight baggage',required:[1],answer:'One cabin bag up to 8 kg. [1]',why:'The current allowance supports the answer. The old policy is equally similar, but its 12 kg limit is no longer valid.'},
 {title:'Same word, different trip',question:'How early must I cancel a refundable hotel room?',query:'cancel hotel booking',required:[5],answer:'At least 48 hours before check-in. [5]',why:'Both policies discuss cancellation. Only the hotel policy answers this question. A high similarity score is not enough.'},
 {title:'Know when to stop',question:'Can I bring a pet on my flight?',query:'flight pet',required:[],answer:'These documents do not include a pet policy. Ask the airline or retrieve another source.',why:'A flight document is relevant to the topic, but none supports an answer about pets. Good RAG systems need a path for missing evidence.'}
];
export function checkEvidence(index,ids,abstain=false) {
 const mission=missions[index];
 return !!mission && (mission.required.length===0 ? abstain && ids.length===0 : !abstain && ids.length===mission.required.length && mission.required.every(id=>ids.includes(id)));
}
const esc = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const steps = [
 ['Collect','Start with trustworthy documents. Our fictional airline and hotel policies are the knowledge source.','A policy document'],
 ['Chunk','Split long documents into useful passages. Keep the rule and its conditions together.','“One cabin bag up to 8 kg.”'],
 ['Embed','Represent each passage as a list of numbers. Similar meanings can produce similar vectors. Store the passage beside its vector.','[3, 0, 0, 0, 4, 0]'],
 ['Retrieve','Embed the question in the same space, then compare it with stored vectors. Return a few candidates and check their relevance.','“flight baggage” → passage [1]'],
 ['Give context','Put the question and selected passages into the model request. Retrieved text is evidence, not an instruction to obey.','Question + passage [1] + answer instructions'],
 ['Answer','The language model writes an answer using that context. Check that its claims are supported and cite the source.','“Up to 8 kg. [1]”']
];

export function mountRagStudio(host) {
 let stage=0,query='flights',mode='vector',k=3,currentOnly=true,selectedDoc=1,round=0,selected=new Set(),checked=false;
 let badges=[];
 try { const saved=JSON.parse(localStorage.getItem('apricot-rag-studio-v1'));if(Array.isArray(saved))badges=[...new Set(saved.filter(n=>Number.isInteger(n)&&n>=0&&n<3))]; } catch {}
 function move(next){stage=next;render();host.querySelector('h1').focus();host.scrollIntoView({block:'start',behavior:'instant'});}
 function render(){
  host.innerHTML=`<div class="rag-studio" data-view="${stage}"><header class="studio-heading"><span class="eyebrow">AN EXPERIMENT IN RETRIEVAL</span><h1 tabindex="-1">Give AI something to go on.</h1><p>My way of making sense of RAG: find a useful passage, then use it to answer a question.</p></header><div class="studio-stages" aria-label="Studio stages">${['Understand','Explore','Play'].map((name,i)=>`<button data-stage="${i}" ${i>stage?'disabled':''} aria-current="${i===stage}"><span>0${i+1}</span>${name}</button>`).join('')}</div><div id="studio-content"></div><p class="studio-disclaimer">My toy travel desk: invented policies, hand-built vectors and scripted answers. The point is to see the process.</p></div>`;
  host.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>move(+b.dataset.stage));
  if(stage===0)overview();else if(stage===1)explore();else play();
 }
 const root=()=>host.querySelector('#studio-content');
 function overview(){
  root().innerHTML=`<section class="rag-big-picture"><div><span class="eyebrow">THE IDEA IN 30 SECONDS</span><h2>An open-book answer.</h2><p>An LLM generates language. It does not automatically know your private documents or the latest company policy.</p><p><strong>Retrieval-augmented generation</strong> adds a lookup first: find useful passages, put them in the request, then ask the model to answer using them.</p></div><div class="rag-before-after"><div><span>Without retrieved context</span><div class="speech question">“How much cabin baggage?”</div><div class="speech uncertain">A fluent reply might use an outdated limit.</div></div><div><span>With retrieved context</span><div class="source-slip">POLICY [1]<strong>Cabin bag: up to 8 kg</strong></div><div class="speech grounded">“Up to 8 kg. [1]”</div></div></div></section><details class="pipeline-disclosure"><summary>Look inside the full pipeline</summary><section class="pipeline-lab"><div class="section-heading"><h2>Follow the information.</h2><span class="micro">Tap a stop to look inside</span></div><div class="pipeline-track">${steps.map(([label],i)=>`<button data-pipe="${i}" aria-pressed="${i===0}"><span>${i+1}</span>${label}</button>`).join('')}</div><div class="pipeline-detail" aria-live="polite"></div><button class="secondary" id="pipe-next">Follow the next step →</button></section></details><div class="studio-key-ideas"><div><strong>LLM</strong><p>Writes the response.</p></div><div><strong>Vector search</strong><p>Finds passages by similarity.</p></div><div><strong>RAG</strong><p>Connects retrieval to generation.</p></div></div><p class="studio-callout">RAG supplies information at answer time. It does not retrain the model, and it does not guarantee a correct answer.</p><button class="primary" id="open-map">I have the idea. Show me the map →</button>`;
  let active=0;
  const show=()=>{host.querySelectorAll('[data-pipe]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.pipe===active)));const [label,description,example]=steps[active];host.querySelector('.pipeline-detail').innerHTML=`<div class="pipeline-orb" aria-hidden="true">${active+1}</div><div><h3>${label}</h3><p>${description}</p><code>${example}</code></div>`;host.querySelector('#pipe-next').textContent=active===5?'Replay the journey ↻':'Follow the next step →';};
  host.querySelectorAll('[data-pipe]').forEach(b=>b.onclick=()=>{active=+b.dataset.pipe;show();});host.querySelector('#pipe-next').onclick=()=>{active=(active+1)%6;show();};show();host.querySelector('#open-map').onclick=()=>move(1);
 }
 function explore(){
  root().innerHTML=`<div class="studio-explore-intro"><h2>Where does “flights” land?</h2><p>Type a topic. The question moves on the map and related passages light up. <strong>Click a result to read its source.</strong></p></div><form id="vector-search" class="vector-controls"><label for="vector-query">Ask the travel desk</label><div class="search-row"><input id="vector-query" maxlength="120" value="${esc(query)}" autocomplete="off"><button class="primary">Search the map →</button></div><div class="query-presets">${['flights','luggage','cancel hotel'].map(q=>`<button type="button" data-query="${q}">${q}</button>`).join('')}</div><details class="search-settings"><summary>Experiment with the search settings</summary><div class="retrieval-controls"><label>Search method<select id="search-method"><option value="vector">Vector similarity</option><option value="keyword">Exact keyword</option></select></label><label>Passages to retrieve (top-k)<select id="top-k">${[1,2,3,5].map(n=>`<option value="${n}" ${n===k?'selected':''}>${n}</option>`).join('')}</select></label><label class="current-filter"><input type="checkbox" id="current-only" ${currentOnly?'checked':''}> Current policies only</label></div></details></form><div class="vector-layout"><section><div class="vector-map" aria-label="Illustrative document map"><span class="map-region air-region">AIR TRAVEL</span><span class="map-region hotel-region">HOTELS</span><span class="map-region food-region">FOOD</span><svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>${documents.map(d=>`<button class="map-point ${!d.current?'archived':''}" data-doc="${d.id}" style="left:${d.x}%;top:${d.y}%" aria-label="Document ${d.id}: ${d.title}${d.current?'':', outdated'}">${d.id}</button>`).join('')}<div class="query-point" aria-hidden="true">?</div></div><p class="map-caption">Numbered dots are passages. The ring is your question. This hand-arranged 2D map illustrates topic groups; rankings use six-dimensional vectors, not screen distance.</p><div id="document-inspector"></div></section><section class="retrieval-results" aria-label="Retrieved passages"><h3>What comes back?</h3><div id="ranked-results" aria-live="polite"></div></section></div><details class="vector-under-hood"><summary>What are the numbers doing?</summary><p>Real embedding models learn representations with many dimensions. This demo uses six named dimensions and a small synonym dictionary, so you can inspect every value. Document vectors are assigned by hand. Queries count recognised words; unsupported wording may return no result.</p><div id="vector-numbers"></div><p>Cosine similarity compares the direction of two vectors. It is a similarity score, not the probability that a passage is true. A real system may combine vector search, keyword search, metadata filters and reranking.</p><a href="https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview" target="_blank" rel="noreferrer">Read the Microsoft Learn RAG overview ?</a></details><div class="studio-callout"><strong>Try breaking it:</strong> search “luggage” with each method. Then search “flight baggage” and turn off the current-policy filter. Similarity alone cannot tell you which limit is still valid.</div><button class="primary" id="open-missions">Now let me run the travel desk →</button>`;
  host.querySelector('#search-method').value=mode;
  host.querySelector('#vector-search').onsubmit=e=>{e.preventDefault();query=host.querySelector('#vector-query').value.trim();updateSearch();};
  host.querySelectorAll('[data-query]').forEach(b=>b.onclick=()=>{query=b.dataset.query;host.querySelector('#vector-query').value=query;updateSearch();});
  host.querySelector('#search-method').onchange=e=>{mode=e.target.value;updateSearch();};host.querySelector('#top-k').onchange=e=>{k=+e.target.value;updateSearch();};host.querySelector('#current-only').onchange=e=>{currentOnly=e.target.checked;updateSearch();};
  host.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>{selectedDoc=+b.dataset.doc;inspect();});host.querySelector('#open-missions').onclick=()=>move(2);updateSearch();
 }
 function inspect(){const d=documents.find(d=>d.id===selectedDoc);host.querySelector('#document-inspector').innerHTML=`<article class="document-inspector"><span class="eyebrow">PASSAGE ${d.id} / ${d.current?'CURRENT':'OUTDATED'}</span><h3>${d.title}</h3><p>${d.text}</p><code>[${d.vector.join(', ')}]</code></article>`;host.querySelectorAll('[data-doc]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.doc===selectedDoc)));}
 function updateSearch(){
  const results=retrieve(query,mode,k,currentOnly),v=embed(query),sum=v[0]+v[1]+v[2];
  const x=sum?(28*v[0]+77*v[1]+58*v[2])/sum:v[4]?28:50;
  const y=sum?(36*v[0]+35*v[1]+76*v[2])/sum:v[4]?29:50;
  const point=host.querySelector('.query-point');point.style.left=x+'%';point.style.top=y+'%';point.hidden=!results.length;
  host.querySelector('.map-lines').innerHTML=results.map(d=>`<line x1="${x}" y1="${y}" x2="${d.x}" y2="${d.y}"/>`).join('');
  host.querySelectorAll('[data-doc]').forEach(b=>{b.classList.toggle('retrieved',results.some(d=>d.id===+b.dataset.doc));b.classList.toggle('filtered',currentOnly&&!documents.find(d=>d.id===+b.dataset.doc).current);});
  host.querySelector('#ranked-results').innerHTML=results.length?`<p class="micro">${results.length} candidate${results.length===1?'':'s'} for “${esc(query)}”</p>`+results.map((d,i)=>`<button class="result-card" data-result="${d.id}"><span class="result-rank">${i+1}</span><span><strong>[${d.id}] ${d.title}</strong><small>${d.current?'Current policy':'Outdated policy'}</small><span class="similarity-bar"><i style="width:${d.score*100}%"></i></span><small>${Math.round(d.score*100)}% ${mode==='vector'?'toy similarity':'query words matched'}</small></span></button>`).join(''):'<div class="no-evidence"><strong>No matching passage.</strong><p>This tiny demo does not recognise that topic. A real system also needs to handle missing evidence instead of inventing an answer.</p></div>';
  host.querySelector('#vector-numbers').innerHTML=dimensions.map((name,i)=>`<span>${name}<b>${v[i]}</b></span>`).join('');
  host.querySelectorAll('[data-result]').forEach(b=>b.onclick=()=>{selectedDoc=+b.dataset.result;inspect();});
  if(results.length)selectedDoc=results[0].id;inspect();
 }
 function play(){
  const mission=missions[round];selected=new Set();checked=false;
  root().innerHTML=`<section class="travel-desk"><div class="desk-score"><span>TRAVEL DESK / REQUEST ${round+1} OF 3</span><span>${badges.length} / 3 stamps earned</span></div><div class="passport-stamps">${missions.map((m,i)=>`<span class="${badges.includes(i)?'stamped':''}" title="${m.title}">${badges.includes(i)?'✓':'○'} ${['Evidence','Relevance','Honesty'][i]}</span>`).join('')}</div><h2>${mission.title}</h2><div class="traveller-question"><span aria-hidden="true">?</span><p>${mission.question}</p></div><p>Build the context tray. Choose only the passage that supports the answer, or tell the traveller the evidence is missing. Read the policy status carefully.</p><div class="desk-layout"><div class="evidence-shelf">${documents.filter(d=>round===1?[2,4,5,6].includes(d.id):[1,2,3,7].includes(d.id)).map(d=>`<button class="evidence-card" data-evidence="${d.id}" aria-pressed="false"><span class="evidence-status ${d.current?'':'stale'}">[${d.id}] ${d.current?'Current':'Outdated'}</span><h3>${d.title}</h3><p>${d.text}</p><span class="pick-label">+ Add to context</span></button>`).join('')}</div><aside class="context-tray"><span class="eyebrow">MODEL CONTEXT</span><h3>Your evidence tray</h3><div id="context-selection" aria-live="polite">No passages selected.</div><p class="micro">Keep the context relevant. More text is not automatically better.</p><button class="primary" id="check-context">Build the answer →</button><button class="secondary" id="no-answer">The evidence is missing</button></aside></div><div id="desk-feedback" aria-live="polite"></div></section>`;
  host.querySelectorAll('[data-evidence]').forEach(b=>b.onclick=()=>{if(checked)return;const id=+b.dataset.evidence;selected.has(id)?selected.delete(id):selected.add(id);b.setAttribute('aria-pressed',String(selected.has(id)));b.querySelector('.pick-label').textContent=selected.has(id)?'✓ In your context':' + Add to context';host.querySelector('#context-selection').innerHTML=selected.size?[...selected].map(id=>`<span class="context-chip">[${id}] ${documents.find(d=>d.id===id).title}</span>`).join(''):'No passages selected.';});
  host.querySelector('#check-context').onclick=()=>grade(false);host.querySelector('#no-answer').onclick=()=>grade(true);
 }
 function grade(abstain){
  const mission=missions[round],correct=checkEvidence(round,[...selected],abstain),feedback=host.querySelector('#desk-feedback');
  if(!correct){feedback.innerHTML=`<div class="desk-feedback retry"><strong>One more look.</strong><p>${abstain&&selected.size?'Empty your evidence tray before choosing to withhold an answer.':round===0?'Use the current cabin bag rule. Leave outdated or unrelated passages out of the context.':round===1?'The question is about a hotel cancellation, not a flight or check-in time.': 'None of these passages mentions pets. An answer needs evidence for the specific claim, not just the same topic.'}</p></div>`;feedback.scrollIntoView({block:'nearest'});return;}
  checked=true;if(!badges.includes(round))badges.push(round);
  let saved=true;try{localStorage.setItem('apricot-rag-studio-v1',JSON.stringify(badges));}catch{saved=false;}
  host.querySelectorAll('[data-evidence],#check-context,#no-answer').forEach(b=>b.disabled=true);
  host.querySelector('.desk-score span:last-child').textContent=badges.length+' / 3 stamps earned';host.querySelectorAll('.passport-stamps span').forEach((el,i)=>{el.classList.toggle('stamped',badges.includes(i));el.textContent=(badges.includes(i)?'✓':'○')+' '+['Evidence','Relevance','Honesty'][i];});
  feedback.innerHTML=`<div class="desk-feedback success"><span class="eyebrow">STAMP EARNED / ${['EVIDENCE','RELEVANCE','HONESTY'][round]}</span><h3>${abstain?'A useful answer can admit a gap.':'An answer with something behind it.'}</h3><blockquote>${mission.answer}</blockquote><p>${mission.why}</p><small>This is a scripted demonstration of the answer stage.${saved?' Your stamp is saved in this browser.':' Browser storage is unavailable; this stamp lasts for this session.'}</small><div><button class="primary" id="next-request">${round<2?'Next traveller →':'Replay the desk ↻'}</button><button class="secondary" id="back-map">Back to the map</button></div></div>`;
  host.querySelector('#next-request').onclick=()=>{round=(round+1)%3;play();host.querySelector('.travel-desk h2').setAttribute('tabindex','-1');host.querySelector('.travel-desk h2').focus();};host.querySelector('#back-map').onclick=()=>move(1);feedback.scrollIntoView({block:'nearest'});
 }
 render();
}
