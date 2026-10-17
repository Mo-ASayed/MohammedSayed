// A true 2D distance sandbox, deliberately separate from the six-dimensional search.
export const mapSources = [
 {id:1,x:24,y:26,label:'Cabin bags',fact:'8 kg',current:true,cost:2},
 {id:2,x:39,y:40,label:'Flight refunds',fact:'24 hours',current:true,cost:3},
 {id:3,x:27,y:61,label:'Seat booking',fact:'Choose before paying',current:true,cost:2},
 {id:4,x:76,y:25,label:'Hotel rooms',fact:'Check in at 15:00',current:true,cost:3},
 {id:5,x:78,y:51,label:'Hotel refunds',fact:'48 hours',current:true,cost:2},
 {id:6,x:60,y:79,label:'Dinner',fact:'Vegetarian meals available',current:true,cost:2},
 {id:7,x:31,y:22,label:'Old bag rule',fact:'12 kg',current:false,cost:2}
];
export function scanMap(point, sources, radius, currentOnly, budget) {
 const found=sources.map(d=>({...d,distance:Math.hypot(point.x-d.x,point.y-d.y)}))
 .filter(d=>d.distance<=radius&&(!currentOnly||d.current)).sort((a,b)=>a.distance-b.distance||a.id-b.id);
 let used=0;const context=[];
 for(const d of found)if(used+d.cost<=budget){context.push(d);used+=d.cost;}
 return {found,context,used};
}
const chapters=[
 {title:'Find the neighbourhood',intro:'Similar passages live near each other. Move the question close to the bag policy and watch the evidence travel into the answer.',task:'Bring back the cabin bag rule, without unrelated passages.',lesson:'Retrieval finds candidates. Moving the query changes which passages are nearby.'},
 {title:'A close match can be wrong',intro:'An old policy has entered the same neighbourhood. It is very similar, but its limit is wrong today.',task:'Retrieve the current bag rule. Keep the old rule out of the answer.',lesson:'Similarity cannot establish truth or freshness. Metadata filters help remove known outdated sources.'},
 {title:'Make room for the evidence',intro:'The model has limited room for context. Nearby clutter can consume it before the useful passage gets through.',task:'Answer the hotel refund question. Fit the hotel refund rule into a two-unit context window.',lesson:'Retrieval and context selection are different steps. A relevant passage is useless if it never reaches the model.'}
];
export function mountMapQuest(host){
 let chapter=0,point={x:50,y:50},radius=22,budget=6,currentOnly=false,sources=[],completed=false;
 const reset=()=>{point={x:50,y:50};radius=22;budget=chapter===2?2:6;currentOnly=false;completed=false;sources=mapSources.filter(d=>chapter>0||d.current).map(d=>({...d}));};
 function render(){reset();const c=chapters[chapter];host.innerHTML=`<section class="map-quest"><div class="quest-top"><span class="eyebrow">THE RETRIEVAL EXPEDITION</span><span>Layer ${chapter+1} / 3</span></div><div class="quest-route" aria-label="Expedition progress">${chapters.map((c,i)=>`<span class="${i===chapter?'active':i<chapter?'done':''}">${i<chapter?'&#10003;':i+1}<small>${['Explore','Filter','Make room'][i]}</small></span>`).join('')}</div><h2>${c.title}</h2><p class="quest-intro">${c.intro}</p><p class="quest-brief"><b>Your goal</b> ${c.task}</p><div class="quest-workbench"><div><div class="quest-map" aria-label="Interactive two-dimensional retrieval map"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="quest-grid" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".18" fill="#cbb99f"/></pattern></defs><rect width="100" height="100" fill="url(#quest-grid)"/><g id="quest-links"></g><circle id="quest-radius" fill="#c5755314" stroke="#c57553" stroke-width=".4" stroke-dasharray="1 1"/></svg><span class="quest-region region-air">AIR TRAVEL</span><span class="quest-region region-hotel">HOTELS</span><span class="quest-region region-food">FOOD</span>${sources.map(d=>`<button class="quest-source ${d.current?'':'stale'}" data-source="${d.id}" aria-label="Move ${d.label}. Drag or use arrow keys." style="left:${d.x}%;top:${d.y}%"><b>${d.id}</b><span>${d.label}</span></button>`).join('')}<button id="quest-query" aria-label="Move question. Drag or use arrow keys."><b>?</b><span>Your question</span></button></div><p class="quest-hint">Drag the question or a passage. Keyboard: focus a marker and use arrow keys. Shift moves faster.</p><div class="quest-dials"><label>Search reach <output id="reach-value"></output><input id="quest-reach" type="range" min="8" max="55" value="22"></label>${chapter>0?'<label class="quest-filter"><input id="quest-filter" type="checkbox"> Exclude outdated policies</label>':''}</div><p class="quest-model-note">A simplified 2D space: distance really drives this map. Dragging a passage simulates a changed representation. Real embeddings have many dimensions and are computed from content.</p></div><aside class="quest-flow"><div class="quest-question"><span>QUESTION</span><strong>${chapter===2?'When must I cancel my hotel room?':'How heavy can my cabin bag be?'}</strong></div><div class="quest-flow-arrow" aria-hidden="true">&#8595;</div><div><span class="eyebrow">1 / RETRIEVED</span><div id="quest-retrieved"></div></div><div class="quest-flow-arrow" aria-hidden="true">&#8595;</div><div><span class="eyebrow">2 / CONTEXT WINDOW</span><div class="context-slots" id="quest-slots"></div><div id="quest-context"></div><small>${budget} toy size units. Nearest passages go first.</small></div><div class="quest-flow-arrow" aria-hidden="true">&#8595;</div><div class="quest-answer"><span class="eyebrow">3 / SCRIPTED ANSWER</span><p id="quest-answer"></p></div></aside></div><div class="quest-objective"><span class="eyebrow">YOUR EXPERIMENT</span><strong>${c.task}</strong><p id="quest-status" role="status"></p><div><button id="quest-check" class="primary">Test this setup</button><button id="quest-reset" class="secondary">Reset layer</button><button id="quest-next" class="primary" hidden>${chapter===2?'Explore again':'Next layer &#8594;'}</button></div></div></section>`;
 const map=host.querySelector('.quest-map');
 function bind(el,target){
 const position=(x,y)=>{target.x=Math.max(6,Math.min(94,x));target.y=Math.max(9,Math.min(90,y));completed=false;host.querySelector('#quest-next').hidden=true;host.querySelector('#quest-status').textContent='';update();};
 el.onpointerdown=e=>{if(e.button!==0)return;e.preventDefault();el.focus();el.setPointerCapture(e.pointerId);el.classList.add('dragging');};
 el.onpointermove=e=>{if(!el.hasPointerCapture(e.pointerId))return;const r=map.getBoundingClientRect();position((e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100);};
 el.onpointerup=e=>{if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);el.classList.remove('dragging');};
 el.onpointercancel=()=>el.classList.remove('dragging');
 el.onkeydown=e=>{const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!directions[e.key])return;e.preventDefault();const [x,y]=directions[e.key],step=e.shiftKey?5:1;position(target.x+x*step,target.y+y*step);};
 }
 bind(host.querySelector('#quest-query'),point);sources.forEach(d=>bind(host.querySelector('[data-source="'+d.id+'"]'),d));
 host.querySelector('#quest-reach').oninput=e=>{radius=+e.target.value;invalidate();};
 if(chapter>0)host.querySelector('#quest-filter').onchange=e=>{currentOnly=e.target.checked;invalidate();};
 host.querySelector('#quest-reset').onclick=render;
 host.querySelector('#quest-next').onclick=()=>{chapter=(chapter+1)%3;render();host.querySelector('h2').setAttribute('tabindex','-1');host.querySelector('h2').focus();};
 host.querySelector('#quest-check').onclick=()=>{const {context}=scanMap(point,sources,radius,currentOnly,budget);const target=chapter===2?5:1;completed=context.length===1&&context[0].id===target;host.querySelector('#quest-status').textContent=completed?'Solved. '+c.lesson:context.some(d=>d.id===7)?'The old 12 kg policy is still in context. Similar does not mean current.':!context.some(d=>d.id===target)?'The supporting rule has not reached the context window. Move closer, narrow the reach, or move clutter away.':'The useful rule arrived, but so did unrelated evidence. Try narrowing the search reach.';host.querySelector('#quest-next').hidden=!completed;host.querySelector('.quest-objective').classList.toggle('solved',completed);};
 update();
 }
 function invalidate(){completed=false;host.querySelector('#quest-next').hidden=true;host.querySelector('#quest-status').textContent='';update();}
 function update(){const {found,context,used}=scanMap(point,sources,radius,currentOnly,budget);const q=host.querySelector('#quest-query');q.style.left=point.x+'%';q.style.top=point.y+'%';const ring=host.querySelector('#quest-radius');ring.setAttribute('cx',point.x);ring.setAttribute('cy',point.y);ring.setAttribute('r',radius);host.querySelector('#reach-value').textContent=radius+' units';
 host.querySelector('#quest-links').innerHTML=found.map(d=>`<line x1="${point.x}" y1="${point.y}" x2="${d.x}" y2="${d.y}" stroke="#ad7954" stroke-width=".5" stroke-dasharray="2 1"/>`).join('');
 sources.forEach(d=>{const el=host.querySelector('[data-source="'+d.id+'"]');el.style.left=d.x+'%';el.style.top=d.y+'%';el.classList.toggle('in-range',found.some(x=>x.id===d.id));el.classList.toggle('excluded',currentOnly&&!d.current);});
 host.querySelector('#quest-retrieved').innerHTML=found.length?found.map(d=>`<div class="retrieved-slip ${context.some(x=>x.id===d.id)?'':'overflow-slip'}"><b>[${d.id}] ${d.label}</b><small>${d.distance.toFixed(1)} away / ${d.cost} units${d.current?'':' / outdated'}${context.some(x=>x.id===d.id)?'':' / does not fit'}</small></div>`).join(''):'<p class="quest-empty">Nothing in reach. Move towards a cluster.</p>';
 host.querySelector('#quest-slots').innerHTML=Array.from({length:budget},(_,i)=>`<i class="${i<used?'filled':''}"></i>`).join('');host.querySelector('#quest-slots').setAttribute('aria-label',used+' of '+budget+' context units used');
 host.querySelector('#quest-context').textContent=context.length?context.map(d=>'['+d.id+'] '+d.fact).join(' / '):'No evidence supplied.';
 const target=chapter===2?5:1,good=context.some(d=>d.id===target),old=context.some(d=>d.id===7)&&chapter!==2;
 host.querySelector('#quest-answer').textContent=old?(good?'Conflicting limits: 8 kg [1] and 12 kg [7]. Check which policy is current.':'12 kg [7]. This comes from an outdated rule.'):good?(chapter===2?'Cancel at least 48 hours before check-in. [5]':'One cabin bag up to 8 kg. [1]'):'The supplied passages do not answer this question.';
 host.querySelector('.quest-objective').classList.toggle('solved',completed);
 }
 render();
}
