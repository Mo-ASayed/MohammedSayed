const DAY=86400000;
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function reviewCards(lessons){
 const cards=lessons.flatMap((l,i)=>l.checks.map(([question,answer],j)=>({id:`${i}-${j}`,lesson:i,question,answer,kind:'explain'})));
 const calculations=[
  [0,'A queue contains 95 routine tickets and 5 urgent ones. A baseline predicts routine for every ticket. How many urgent tickets does it catch?',0,'incidents','Zero. Its accuracy is 95%, but it misses every urgent ticket. A useful evaluation must reflect what you want the system to catch.'],
  [1,'You have 100 labelled records. Keep 20 for validation and 15 for a final test. How many remain for training?',65,'records','100 - 20 - 15 = 65. The percentages are just an example. Independence and realistic coverage matter more than a fixed ratio.'],
  [2,'Three predictions have absolute errors of 4 ms, 8 ms and 12 ms. What is their mean absolute error?',8,'ms','(4 + 8 + 12) / 3 = 8 ms. This is an average, not the worst error.'],
  [3,'The system catches 8 urgent incidents and misses 2. What is its recall as a percentage?',80,'%','Recall is 8 / (8 + 2) = 80%. False alarms affect precision, not this denominator.'],
  [4,'Your toy context budget is 120 units. Instructions use 20 and the selected evidence uses 75. How many units remain?',25,'units','120 - 20 - 75 = 25. These are toy units. A real system must use its model’s token accounting and reserve space for the response.'],
  [5,'A batch contains 10 urgent incidents. After a threshold change the system catches 6. How many urgent incidents did it miss?',4,'incidents','10 - 6 = 4 false negatives. Service uptime does not tell you whether these incidents were caught.']
 ];
 return [...cards,...calculations.map(([lesson,question,value,unit,answer])=>({id:`${lesson}-calc`,lesson,question,value,unit,answer,kind:'calculate'}))];
}
export function cleanReview(raw,cards){
 const result={};if(!raw||typeof raw!=='object')return result;
 for(const card of cards){const r=raw[card.id];if(!r||typeof r!=='object')continue;
  result[card.id]={due:Number.isFinite(r.due)?Math.max(0,Math.min(r.due,Date.now()+365*DAY)):0,interval:Math.max(0,Math.min(30,Number(r.interval)||0)),attempts:Math.max(0,Math.min(10000,Math.floor(Number(r.attempts)||0))),rating:['again','hard','good'].includes(r.rating)?r.rating:'again',draft:typeof r.draft==='string'?r.draft.slice(0,4000):''};
 }return result;
}
export function scheduleReview(previous,rating,now=Date.now()){
 const interval=rating==='again'?0:rating==='hard'?1:Math.min(30,Math.max(3,(previous?.interval||0)*2));
 return {...previous,rating,interval,attempts:(previous?.attempts||0)+1,due:now+(rating==='again'?10*60000:interval*DAY)};
}
export function eligibleCards(cards,state){return cards.filter(c=>(state.read[c.lesson]||0)>=4||state.wins.includes(c.lesson));}
export function dueCards(cards,records,now=Date.now()){return cards.filter(c=>!records[c.id]||records[c.id].due<=now).sort((a,b)=>(records[a.id]?.due||0)-(records[b.id]?.due||0));}
export function reviewStats(cards,state,records){const eligible=eligibleCards(cards,state);return {eligible:eligible.length,due:dueCards(eligible,records).length,revisit:eligible.filter(c=>records[c.id]&&records[c.id].rating!=='good').length,reviewed:eligible.filter(c=>records[c.id]?.attempts>0).length};}

export function mountReview(host,{lessons,state,records,save,onLesson,onExit}){
 const cards=reviewCards(lessons),eligible=eligibleCards(cards,state),due=dueCards(eligible,records);
 const revisit=eligible.filter(c=>records[c.id]&&records[c.id].rating!=='good');
 let queue=[],at=0,ratings=[],revealed=false,draft='';
 function overview(){
  const due=dueCards(eligible,records);
  const revisit=eligible.filter(c=>records[c.id]&&records[c.id].rating!=='good');
  host.innerHTML=`<div class="review-intro"><span class="eyebrow">A FEW MINUTES OF PRACTICE</span><h1>What do you remember?</h1><p>Try answering before checking the explanation. Revisit the ideas that need another pass, then come back another day.</p></div><div class="review-stats"><div><strong>${due.length}</strong><span>ready to review</span></div><div><strong>${revisit.length}</strong><span>marked for another look</span></div><div><strong>${eligible.length}</strong><span>prompts unlocked</span></div></div><div class="review-start"><div><h2>A short review session</h2><p>Up to five prompts from topics you have read. Some ask for a calculation, others for an explanation in your own words.</p><small>Written explanations are self-assessed. This is practice, not an exam or a readiness score.</small></div><button class="primary" id="begin-review" ${eligible.length?'':'disabled'}>${due.length?'Review up to 5 prompts':'Practise again'} →</button></div>${!eligible.length?'<p class="review-empty">Finish the four reading steps in any topic to unlock its review prompts.</p><button class="secondary" id="first-lesson">Start the first topic</button>':''}<div class="review-topics"><h2>Your topics</h2>${lessons.map((l,i)=>{const topic=eligible.filter(c=>c.lesson===i),done=topic.filter(c=>records[c.id]?.attempts).length;return `<div><span class="topic-number">0${i+1}</span><div><strong>${l.title}</strong><small>${topic.length?`${done} of ${topic.length} prompts reviewed`:'Read this topic to unlock review'}</small></div><button class="text-button" data-revisit-lesson="${i}">${topic.length?'Revisit lesson':'Read lesson'} ↗</button></div>`;}).join('')}</div><section class="mistake-journal"><span class="eyebrow">YOUR REVIEW NOTES</span><h2>Worth another look</h2><p>Prompts you rated “Again” or “Almost”. Nothing here is shared with other visitors.</p>${revisit.length?revisit.map(c=>`<details><summary>${escapeHTML(c.question)}</summary>${records[c.id].draft?`<p><strong>Your last answer</strong></p><p class="saved-response">${escapeHTML(records[c.id].draft)}</p>`:''}<p>${escapeHTML(c.answer)}</p><button class="text-button" data-revisit-lesson="${c.lesson}">Return to the explanation ↗</button></details>`).join(''):'<p class="review-empty">This list fills as you review. You can change your assessment in a later session.</p>'}</section><p class="review-method">A simple review schedule: Again in 10 minutes, Almost tomorrow, Got it in 3 days or later. It runs in your browser; there are no emails or notifications.</p>`;
  host.querySelector('#begin-review').onclick=()=>{queue=(due.length?due:eligible).slice(0,5);at=0;ratings=[];showCard();};
  host.querySelector('#first-lesson')?.addEventListener('click',()=>onLesson(0));
  host.querySelectorAll('[data-revisit-lesson]').forEach(b=>b.onclick=()=>onLesson(+b.dataset.revisitLesson));
 }
 function showCard(){
  revealed=false;draft='';const c=queue[at];
  host.innerHTML=`<div class="review-session-head"><button class="text-button" id="leave-review">← Review overview</button><span>${at+1} of ${queue.length}</span></div><progress class="session-progress" value="${at}" max="${queue.length}" aria-label="Review session progress"></progress><article class="review-card"><span class="eyebrow">${escapeHTML(lessons[c.lesson].title)} · ${c.kind==='calculate'?'WORK IT OUT':'EXPLAIN IT'}</span><h2>${escapeHTML(c.question)}</h2><label for="review-answer">${c.kind==='calculate'?`Your answer (${c.unit})`:'Your explanation'}</label>${c.kind==='calculate'?'<input id="review-answer" type="number" step="any" placeholder="Enter a number">':'<textarea id="review-answer" rows="5" maxlength="4000" placeholder="Explain it as if a teammate asked you…"></textarea>'}<div class="review-answer-actions"><button class="primary" id="reveal-answer" disabled>${c.kind==='calculate'?'Check calculation':'Compare with the explanation'} →</button><button class="text-button" id="forgot-answer">I cannot recall it yet</button></div><div id="review-feedback" aria-live="polite"></div><div id="review-rating"></div></article><p class="review-method">No timer. Work it out without looking back first. Finding a gap is useful.</p>`;
  host.querySelector('#leave-review').onclick=overview;
  const input=host.querySelector('#review-answer');input.oninput=()=>{draft=input.value;host.querySelector('#reveal-answer').disabled=!draft.trim();};
  const reveal=(forgot=false)=>{
   if(revealed)return;revealed=true;input.readOnly=true;
   const correct=c.kind==='calculate'&&!forgot&&Math.abs(Number(draft)-c.value)<.001;
   host.querySelector('#reveal-answer').disabled=true;host.querySelector('#forgot-answer').disabled=true;
   host.querySelector('#review-feedback').innerHTML=`<div class="answer-explanation"><strong>${forgot?'Start with this explanation':c.kind==='calculate'?(correct?'That calculation is correct':'Check the calculation'):'Compare the reasoning'}</strong><p>${escapeHTML(c.answer)}</p>${c.kind==='explain'?'<small>Check the key idea and the reason behind it. Different wording is fine.</small>':''}</div>`;
   host.querySelector('#review-rating').innerHTML=`<p>How did that go?</p><div class="rating-buttons"><button data-rating="again"><strong>Again</strong><small>Revisit in 10 minutes</small></button><button data-rating="hard" ${forgot?'disabled':''}><strong>Almost</strong><small>Review tomorrow</small></button><button data-rating="good" ${forgot||(c.kind==='calculate'&&!correct)?'disabled':''}><strong>Got it</strong><small>Review in ${Math.min(30,Math.max(3,(records[c.id]?.interval||0)*2))} days</small></button></div>`;
   host.querySelectorAll('[data-rating]').forEach(b=>b.onclick=()=>{
    records[c.id]={...scheduleReview(records[c.id],b.dataset.rating),draft};save(records);ratings.push(b.dataset.rating);at++;if(at<queue.length)showCard();else finish();
   });
  };
  host.querySelector('#reveal-answer').onclick=()=>reveal();host.querySelector('#forgot-answer').onclick=()=>reveal(true);
 }
 function finish(){const needs=ratings.filter(r=>r!=='good').length;
  host.innerHTML=`<section class="review-finish"><span class="eyebrow">SESSION COMPLETE</span><h1>A little more familiar.</h1><p>You reviewed ${ratings.length} prompts. ${needs?`${needs} will return sooner because you marked them for more practice.`:'You marked every prompt as understood. Try recalling them again in a few days.'}</p><div class="review-finish-counts"><span><b>${ratings.filter(r=>r==='good').length}</b> Got it</span><span><b>${ratings.filter(r=>r==='hard').length}</b> Almost</span><span><b>${ratings.filter(r=>r==='again').length}</b> Again</span></div><p>Your ratings guide the next review. They do not measure job readiness.</p><button class="primary" id="finish-review">Return to learning →</button><button class="secondary" id="review-overview">See review notes</button></section>`;
  host.querySelector('#finish-review').onclick=onExit;host.querySelector('#review-overview').onclick=()=>mountReview(host,{lessons,state,records,save,onLesson,onExit});
 }
 overview();
}
