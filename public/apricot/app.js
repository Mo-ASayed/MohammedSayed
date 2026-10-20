import {homeHero,ragTeaser,mountHomePreview} from './visual-kit.js';
import {mountAiPlayground} from './ai-playground.js';
import {mountRagStudio} from './rag-studio.js';
import {lessons,jobs,sources} from './content.js';
import {cleanState} from './engine.js';
import {mountGame} from './games.js';
import {enrichLessons,referenceHTML} from './teaching.js';
import {mountMastery} from './mastery.js';
import {reviewCards,cleanReview,mountReview} from './review.js';
enrichLessons(lessons);
const KEY='apricot-workshop-v1';
let state=cleanState(null),storageOK=true;
try{state=cleanState(JSON.parse(localStorage.getItem(KEY)));}catch{storageOK=false;}
const STUDY_KEY='apricot-study-v1';
const cards=reviewCards(lessons);
let study={records:{},cursor:null};
try { const raw=JSON.parse(localStorage.getItem(STUDY_KEY));study.records=cleanReview(raw?.records,cards);const c=raw?.cursor;if(c&&Number.isInteger(c.lesson)&&c.lesson>=0&&c.lesson<lessons.length&&Number.isInteger(c.step)&&c.step>=0&&c.step<=lessons[c.lesson].sections.length+1)study.cursor=c; }catch{}
function saveStudy(){try{localStorage.setItem(STUDY_KEY,JSON.stringify(study));}catch{toast('Review progress could not be saved in this browser.');}}
let page=location.hash==='#rag'?'rag':location.hash==='#basics'?'basics':'home',current=state.last,step=0;
const app=document.querySelector('#app');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageOK=false;toast('Browser storage is unavailable. Export your notebook before leaving.');}}
function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),4500);}
const completed=()=>state.wins.length;
const totalXP=()=>completed()*100+Object.values(state.mastery).reduce((a,b)=>a+b,0)*50;
function shell(content){
 const restoreFocus=app.contains(document.activeElement);
 app.innerHTML=`<header class="personal-header"><a class="brand" href="#home" data-page="home"><span class="brand-symbol" aria-hidden="true">&#9679;</span> apricot<span class="brand-dot">.</span></a><nav aria-label="Apricot navigation"><button data-page="home" aria-current="${page==='home'}">Playground</button><button data-page="notebook" aria-current="${page==='notebook'}">My notes</button><details class="reference-menu"><summary>More</summary><div class="reference-panel"><button data-page="review">Review my notes</button><button data-page="careers">Background &amp; sources</button><span class="eyebrow">DEEPER EXERCISES</span><div class="mini-lessons">${lessons.map((l,i)=>`<button data-lesson="${i}">${l.title}</button>`).join('')}</div></div></details></nav><a class="portfolio-return" href="/">Mohammed Sayed &nearr;</a></header><div class="workspace personal-workspace"><main id="main" tabindex="-1">${page!=='home'?'<button class="text-button playground-back" data-page="home">&larr; Back to my playground</button>':''}${!storageOK?'<p class="storage-warning">This browser cannot save notes. Export them before leaving.</p>':''}${content}</main><footer><a href="/">Part of Mohammed Sayed's website</a><span>Small experiments. Working notes. Still learning.</span></footer></div>`;

 const menu=app.querySelector('.reference-menu');menu.onkeydown=e=>{if(e.key==='Escape'){menu.open=false;menu.querySelector('summary').focus();}};
 if(restoreFocus)requestAnimationFrame(()=>app.querySelector('#main')?.focus({preventScroll:true}));
 app.querySelectorAll('[data-page]').forEach(el=>el.onclick=e=>{e.preventDefault();page=el.dataset.page;render();window.scrollTo(0,0);});
 app.querySelectorAll('[data-lesson]').forEach(el=>el.onclick=()=>openLesson(+el.dataset.lesson));
}
function openLesson(i){current=i;state.last=i;step=study.cursor?.lesson===i?Math.min(study.cursor.step,(state.read[i]||0)<4?state.read[i]||0:state.wins.includes(i)?5:4):Math.min(state.read[i]||0,lessons[i].sections.length-1);page='lesson';save();render();window.scrollTo(0,0);}
function home(){
 shell(`${homeHero()}${ragTeaser()}<details class="exploration-shelf"><summary>My deeper notes &amp; exercises <span>6 things I'm exploring</span></summary><p>Optional longer reads and experiments. Dip into whatever interests you.</p>${study.cursor?'<button class="text-button" id="resume-session">Continue my last reading</button>':''}<div class="mission-grid">${lessons.map((l,i)=>`<button class="mission-card" data-lesson="${i}"><h3>${l.title}</h3><p>${l.subtitle}</p><span>Read and experiment &rarr;</span></button>`).join('')}</div></details>`);
 mountHomePreview(app);
 app.querySelector('#start-basics').onclick=()=>{page='basics';render();window.scrollTo(0,0);};
 app.querySelector('#start-rag-studio').onclick=()=>{page='rag';render();window.scrollTo(0,0);};
 const resume=app.querySelector('#resume-session');if(resume)resume.onclick=()=>openLesson(study.cursor.lesson);
}
function experimentReflection(){
 const index=lessons.findIndex(l=>l.id===(page==='rag'?'rag':'training'));
 const prompt=page==='rag'?'What changed the answer: the retrieved evidence, its quality, or the space available?':'What changed the prediction: training data, a decision threshold, or the new input?';
 app.querySelector('#main').insertAdjacentHTML('beforeend',`<details class="experiment-reflection"><summary>Keep one observation in my notes</summary><label for="experiment-note">${prompt}</label><textarea id="experiment-note" rows="3" maxlength="20000" placeholder="I changed... I noticed...">${esc(state.notes[index]||'')}</textarea><p id="reflection-status" role="status">Shared with the ${esc(lessons[index].title)} page in My notes. Included in notebook exports.</p></details>`);
 app.querySelector('#experiment-note').oninput=e=>{state.notes[index]=e.target.value;save();app.querySelector('#reflection-status').textContent=storageOK?'Saved in this browser and in My notes.':'Kept for this visit. Browser storage is unavailable; export your notebook before leaving.';};
}
function readingBody(html){
 const doc=document.createElement('div');doc.innerHTML=html;
 const intro=[],more=[];let paragraphs=0;
 for(const node of doc.children){if(paragraphs<2){intro.push(node.outerHTML);if(node.tagName==='P')paragraphs++;}else more.push(node.outerHTML);}
 return intro.join('')+(more.length?'<details class="reading-depth"><summary>Go deeper: examples, pitfalls and reasoning</summary>'+more.join('')+'</details>':'');
}
function diagram(type){
 const maps={system:['Telemetry','Features','Model score','API & policy','User action'],split:['Training → learn','Validation → choose','Test → estimate'],train:['Examples + labels','Fit parameters','Model artefact','New input → prediction'],rag:['Documents','Retrieve','Context + question','Generate','Check evidence'],ops:['Data + code','Train & evaluate','Version & release','Monitor quality','Investigate']};
 return `<figure class="flow-diagram"><div>${maps[type].map((x,i)=>`<span style="--i:${i}">${x}</span>${i<maps[type].length-1?'<b aria-hidden="true">→</b>':''}`).join('')}</div><figcaption>A simplified system view. Each boundary needs checks.</figcaption></figure>`;
}
function lesson(){
 const l=lessons[current],read=state.read[current]||0,n=l.sections.length;
 study.cursor={lesson:current,step};saveStudy();
 shell(`<div class="lesson-top"><button class="text-button" id="back">← Learning path</button><span class="eyebrow">MISSION ${String(current+1).padStart(2,'0')} / 06 <span class="dot-separator">·</span> ${l.time}</span></div><div class="lesson-heading"><span class="mission-icon ${l.color}">${l.icon}</span><h1>${l.title}<span>${l.subtitle}</span></h1></div><div class="lesson-tabs" role="group" aria-label="Mission stages"><button aria-current="${step<n}" class="${step<n?'active':''}" id="learn-tab">01 <span>Learn the ideas</span> ${read===n?'✓':''}</button><button aria-current="${step===n}" class="${step===n?'active':''}" id="lab-tab" ${read<n?'disabled':''}>02 <span>Try the challenge</span> ${read<n?'⌑':state.wins.includes(current)?'✓':''}</button><button aria-current="${step===n+1}" class="${step===n+1?'active':''}" id="reflect-tab" ${!state.wins.includes(current)?'disabled':''}>03 <span>Make it stick</span></button></div><div id="lesson-body"></div>`);
 app.querySelector('#back').onclick=()=>{page='home';render();};
 app.querySelector('#learn-tab').onclick=()=>{step=0;lesson();};
 app.querySelector('#lab-tab').onclick=()=>{step=n;lesson();};
 app.querySelector('#reflect-tab').onclick=()=>{step=n+1;lesson();};
 const body=app.querySelector('#lesson-body');
 if(step<n){
  const s=l.sections[step];
  body.innerHTML=`<div class="learning-layout"><article class="lesson-article"><span class="eyebrow">${s.eyebrow}</span><h2>${s.title}</h2>${readingBody(s.body)}${current===4&&step===0?'<a class="rag-lesson-link" href="#rag" id="lesson-visual">See RAG in action: open the visual travel desk ?</a>':''}${s.diagram?diagram(s.diagram):''}${s.example?`<aside class="worked-example"><span class="eyebrow">A WORKED EXAMPLE</span><p>${s.example}</p></aside>`:''}<div class="takeaway"><span>✧</span><div><strong>Keep this in mind</strong><p>${s.takeaway}</p></div></div><div class="lesson-actions"><button class="secondary" id="prev" ${step===0?'disabled':''}>← Previous</button><span>${step+1} of ${n} learning steps</span><button class="primary" id="next">${step===n-1?'I’m ready to experiment':'Got it, continue'} →</button></div></article><aside class="lesson-rail"><div class="rail-card"><span class="eyebrow">BY THE END, YOU CAN…</span><ul>${l.objectives.map(o=>`<li>${o}</li>`).join('')}</ul></div><div class="rail-card warm"><span class="eyebrow">THEN, PUT IT TO WORK</span><h3>${l.badge}</h3><p>${l.challenge}</p><span class="small-badge">✧ 100 XP + a skill badge</span></div><div class="step-list">${l.sections.map((s,i)=>`<button data-step="${i}" ${i>read?'disabled':''} class="${i===step?'active':''}"><span>${i<read?'✓':i+1}</span>${s.title}</button>`).join('')}</div></aside></div>`;
  body.querySelector('.lesson-rail').insertAdjacentHTML('beforeend',referenceHTML(current));
  wireDiagram(body);
  const visual=body.querySelector('#lesson-visual');if(visual)visual.onclick=e=>{e.preventDefault();page='rag';render();window.scrollTo(0,0);};
  body.querySelector('#prev').onclick=()=>{step--;lesson();window.scrollTo(0,0);};
  body.querySelector('#next').onclick=()=>{state.read[current]=Math.max(read,step+1);step++;save();lesson();window.scrollTo(0,0);};
  body.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{step=+b.dataset.step;lesson();});
 } else if(step===n){
  body.innerHTML=`<div class="lab-header"><div><span class="eyebrow">IDEAS INTO ACTION</span><span class="xp">${totalXP()} XP</span><p>Experiment freely. Mistakes are part of the lesson.</p></div><button class="secondary" id="reset-lab">↻ Reset experiment</button></div><div id="game" class="game-panel"></div><div id="award"></div><div id="mastery-area"></div><p class="simulation-note">Educational experiments using sample data. No live systems or paid AI calls.</p>`;
  const award=()=>{if(!state.wins.includes(current)){state.wins.push(current);save();toast(`${l.badge} unlocked · +100 XP`);body.querySelector('.xp').innerHTML=`✧ <b>${totalXP()}</b> XP`;}
   body.querySelector('#award').innerHTML=`<div class="award"><span class="award-symbol">✧</span><div><span class="eyebrow">SKILL BADGE EARNED</span><h3>${l.badge}</h3><p>Now explain the reasoning in your own words.</p></div><button class="primary" id="reflect">Continue to debrief →</button></div>`;
   app.querySelector('#reflect-tab').disabled=false;
   body.querySelector('#mastery-area').innerHTML=`<section class="mastery-invite"><div><span class="eyebrow">LEVEL 2 UNLOCKED</span><h3>Can you handle a new situation?</h3><p>Two new rounds. Changing conditions. Up to three stars and 150 extra XP.</p><span class="saved-stars">Best result: ${'★'.repeat(state.mastery[current]||0)}${'☆'.repeat(3-(state.mastery[current]||0))}</span></div><button class="primary" id="start-mastery">Play the field challenge →</button></section>`;
   body.querySelector('#start-mastery').onclick=()=>{const area=body.querySelector('#mastery-area');area.className='mastery-panel';mountMastery(area,current,stars=>{state.mastery[current]=Math.max(state.mastery[current]||0,stars);save();app.querySelector('.xp').innerHTML=`✧ <b>${totalXP()}</b> XP`;toast('Field challenge complete. Your best medal is saved.');});area.scrollIntoView({block:'start'});};body.querySelector('#reflect').onclick=()=>{step=n+1;lesson();window.scrollTo(0,0);};
  };
  const mount=()=>{body.querySelector('#award').innerHTML='';body.querySelector('#mastery-area').innerHTML='';body.querySelector('#mastery-area').className='';mountGame(current,body.querySelector('#game'),award);if(state.wins.includes(current))award();};
  body.querySelector('#reset-lab').onclick=mount;mount();
 }else{
  body.innerHTML=`<div class="reflection"><div class="debrief"><span class="eyebrow">WHAT JUST HAPPENED?</span><h2>Turn the experiment into understanding.</h2><p>${l.debrief}</p></div><h3>Could you explain it to a teammate?</h3><p class="muted">Answer out loud or in your notebook before revealing the model answer.</p>${l.checks.map(([q,a])=>`<details class="recall"><summary>${q}<span>Reveal answer +</span></summary><p>${a}</p></details>`).join('')}<label for="note" class="note-label">Your field notes <span>Saved on this browser</span></label><textarea id="note" rows="6" maxlength="20000" placeholder="In my own words… What surprised me? What would I check in a real system?">${esc(state.notes[current]||'')}</textarea><p class="micro" id="note-status">Notes stay in this browser. Export them from My notebook. Clearing site data removes saved progress.</p><div class="lesson-actions"><button class="secondary" id="replay">Replay experiment</button><button class="primary" id="next-mission">${current<5?'Next mission →':'Back to your learning path →'}</button></div></div>`;
  body.querySelector('#note').oninput=e=>{state.notes[current]=e.target.value;save();body.querySelector('#note-status').textContent=storageOK?'Saved locally.':'Not saved : export your notebook before leaving.';};
  body.querySelector('#replay').onclick=()=>{step=n;lesson();};
  body.querySelector('#next-mission').onclick=()=>{if(current<5)openLesson(current+1);else{page='home';render();window.scrollTo(0,0);}};
 }
}
function notebook(){
 shell(`<div class="page-heading"><span class="eyebrow">YOUR ENGINEER’S NOTEBOOK</span><h1>Things I want to remember.</h1><p>Working notes from the things I have tried. A place for explanations, surprises and questions to come back to.</p><button class="primary" id="export">Export notebook ↓</button></div><details class="saved-badges"><summary>Badges from the longer exercises</summary><div class="badge-shelf">${lessons.map((l,i)=>`<div class="${state.wins.includes(i)?'earned':''}"><span>${l.icon}</span><strong>${l.badge}</strong><span class="notebook-stars" aria-label="${state.mastery[i]||0} of 3 mastery stars">${'★'.repeat(state.mastery[i]||0)}${'☆'.repeat(3-(state.mastery[i]||0))}</span><small>${state.wins.includes(i)?'EARNED':'NOT YET EARNED'}</small></div>`).join('')}</div></details><div class="notebook-list">${lessons.map((l,i)=>`<section class="notebook-card"><div><span class="eyebrow">MISSION 0${i+1}</span><h2>${l.title}</h2><button class="text-button" data-lesson="${i}">Revisit lesson ↗</button></div><label class="sr-only" for="note-${i}">Notes for ${l.title}</label><textarea id="note-${i}" data-note="${i}" rows="4" maxlength="20000" placeholder="Your explanation, example or unanswered question…">${esc(state.notes[i]||'')}</textarea></section>`).join('')}</div><div class="reset-section"><p>Progress is stored in this browser only. Export before clearing browser data.</p><button class="text-button" id="reset-progress">Reset all learning progress</button><div id="reset-confirm"></div></div>`);
 app.querySelectorAll('[data-note]').forEach(el=>el.oninput=()=>{state.notes[+el.dataset.note]=el.value;save();});
 app.querySelector('#export').onclick=()=>{
  const text='# Apricot AI Workshop : Field notes\n\n'+lessons.map((l,i)=>`## ${i+1}. ${l.title}\nBadge: ${state.wins.includes(i)?l.badge:'In progress'}\n\n${state.notes[i]||'No notes yet.'}\n\n### Recall prompts\n${l.checks.map(([q])=>'- '+q).join('\n')}`).join('\n\n');
  const url=URL.createObjectURL(new Blob([text],{type:'text/markdown'}));const a=document.createElement('a');a.href=url;a.download='apricot-field-notes.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Notebook exported.');
 };
 app.querySelector('#reset-progress').onclick=()=>{
  app.querySelector('#reset-confirm').innerHTML='<p>This removes all badges, lesson progress and notes from this browser.</p><button class="secondary" id="cancel-reset">Keep my progress</button> <button class="primary" id="confirm-reset">Yes, reset everything</button>';
  app.querySelector('#cancel-reset').onclick=()=>{app.querySelector('#reset-confirm').innerHTML='';};
  app.querySelector('#confirm-reset').onclick=()=>{state=cleanState(null);study={records:{},cursor:null};save();saveStudy();try{localStorage.removeItem('apricot-rag-studio-v1');localStorage.removeItem('apricot-expedition-v1');}catch{toast('Browser storage could not be cleared.');}page='home';render();toast('Workshop reset. A fresh start.');};
 };
}
function careers(){shell(`<div class="page-heading"><span class="eyebrow">BUILT AROUND REAL ENGINEERING WORK</span><h1>Why these topics?</h1><p>These postings informed the workshop. They describe a direction to grow towards, not a promise of job readiness after six lessons.</p></div><div class="career-bridge"><div><span class="eyebrow">USEFUL BACKGROUND</span><h3>Software and systems</h3><p>Familiarity with applications and data is helpful. You can use the workshop without a cloud or DevOps background.</p></div><span class="bridge-arrow">→</span><div><span class="eyebrow">WHAT YOU WILL LEARN</span><h3>Data & model judgement</h3><p>Evaluation · model lifecycle · retrieval · quality monitoring · AI failure modes</p></div></div><div class="section-heading"><h2>The job signals</h2><span class="micro">Research: 14 October 2026</span></div><div class="jobs-grid">${jobs.map(j=>`<article class="job-card"><span class="eyebrow">${j.place}</span><h3>${j.company}</h3><strong>${j.role}</strong><p>${j.skill}</p>${j.url?`<a href="${j.url}" target="_blank" rel="noreferrer">View source posting ↗</a>`:`<small>${j.note}</small>`}</article>`).join('')}</div><p class="micro">Listings may close or change. Several are senior roles; their requirements are used to identify durable skills, not junior entry criteria.</p><section class="next-chapter"><span class="eyebrow">AFTER THIS CHAPTER</span><h2>What to practise afterwards</h2><p>For a junior role, add practical Python and SQL, a reproducible training pipeline, a deployed model API, a small RAG application and tests that measure output quality. These are useful follow-on projects after the foundations.</p><div class="future-chips"><span>Python & data lab</span><span>First model API</span><span>RAG from scratch</span><span>Evaluate & deploy</span></div></section><section class="sources"><h3>Keep reading, when you need to</h3>${sources.map(([title,url])=>`<a href="${url}" target="_blank" rel="noreferrer">${title} ↗</a>`).join('')}</section>`);}
function render(){history.replaceState(null,'',location.pathname+location.search+(page==='rag'?'#rag':page==='basics'?'#basics':''));if(page==='basics'){shell('<div id="basics-root"></div>');mountAiPlayground(app.querySelector('#basics-root'),()=>{page='rag';render();window.scrollTo(0,0);});}else if(page==='rag'){shell('<div id="rag-studio-root"></div>');mountRagStudio(app.querySelector('#rag-studio-root'));}else if(page==='home'){home();}else if(page==='lesson')lesson();else if(page==='notebook')notebook();else if(page==='review')reviewPage();else careers();if(page==='basics'||page==='rag')experimentReflection();}

function reviewPage(){
 shell('<div id="review-root"></div>');
 mountReview(app.querySelector('#review-root'),{lessons,state,records:study.records,save:records=>{study.records=records;saveStudy();},onLesson:openLesson,onExit:()=>{page='home';render();window.scrollTo(0,0);}});
}
function wireDiagram(body){
 const meanings={
 'Telemetry':'Collect measurements that exist when the prediction is made. Check their units and timestamps.',
 'Features':'Prepare the inputs using the same transformations that were used during training.',
 'Model score':'The model estimates an output. A successful computation can still produce a poor prediction.',
 'API & policy':'Your application validates the result and applies a threshold, permission or review rule.',
 'User action':'The system changes what a user sees or does. Measure whether that outcome actually helps.',
 'Training → learn':'Fit model parameters using these examples. Fit preprocessing on this partition too.',
 'Validation → choose':'Compare candidates and choose settings here. This data influences selection.',
 'Test → estimate':'Evaluate the selected system on held-out data. Repeated tuning against it weakens the estimate.',
 'Examples + labels':'Each example pairs available inputs with a reviewed target outcome.',
 'Fit parameters':'A training algorithm adjusts the model to reduce the chosen error on training examples.',
 'Model artefact':'Save the fitted parameters together with compatible code, preparation and configuration.',
 'New input → prediction':'Inference applies the saved model to a new input, normally without updating the parameters.',
 'Documents':'Prepare trustworthy, current documents with version and access metadata.',
 'Retrieve':'Find relevant passages the user is allowed to access. Similarity alone does not establish truth.',
 'Context + question':'Assemble instructions, the question and selected evidence within the context budget.',
 'Generate':'The model writes an answer conditioned on the supplied information. It may still make mistakes.',
 'Check evidence':'Verify that the answer is supported. Missing or conflicting evidence may require abstaining.',
 'Data + code':'Track data lineage, labels, preparation and code versions so the result can be reproduced.',
 'Train & evaluate':'Fit a candidate and compare quality with a baseline and agreed release criteria.',
 'Version & release':'Publish a compatible bundle of model, code and configuration with a recovery plan.',
 'Monitor quality':'Watch task outcomes as well as service latency and errors. Labels may arrive late.',
 'Investigate':'Use input, output and release evidence to decide whether to fix a pipeline, change a policy or retrain.'
 };
 body.querySelectorAll('.flow-diagram').forEach(fig=>{const detail=document.createElement('p');detail.className='diagram-explanation';detail.setAttribute('aria-live','polite');detail.textContent='Select a stage to see what happens there.';fig.append(detail);fig.querySelectorAll('div > span').forEach(span=>{const label=span.textContent;const button=document.createElement('button');button.type='button';button.className='diagram-stage';button.textContent=label;button.setAttribute('aria-pressed','false');span.replaceWith(button);button.onclick=()=>{fig.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));detail.textContent=meanings[label]||'Inspect the inputs and outputs at this stage.';};});});
}

render();

