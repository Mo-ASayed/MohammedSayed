import {metrics,incidents,regression,routes,auditRows,passages,contextResult,recoveryResult} from './engine.js';
const pct=v=>v===null?'N/A':`${Math.round(v*100)}%`;
const feedback=(node,ok,html)=>{node.className=`feedback ${ok?'success':'try'}`;node.innerHTML=html;};
const button=(label,id)=>`<button class="primary" id="${id}">${label} <span aria-hidden="true">↗</span></button>`;
export function mountGame(index,host,win) {
 const builders=[routing,audit,training,threshold,rag,operations];
 builders[index](host,()=>{win();});
}
function routing(host,win) {
 host.innerHTML=`<div class="game-intro"><span class="eyebrow">DESIGN DESK</span><h3>Match the solution to the problem.</h3><p>Allocate all four requests, then send your architecture for review. You can change your choices.</p></div><div class="route-list">${routes.map((r,i)=>`<div class="route-row"><span class="number">0${i+1}</span><p>${r.text}</p><label class="sr-only" for="route${i}">Solution for request ${i+1}</label><select id="route${i}"><option value="">Choose an approach</option><option value="rules">Deterministic rules</option><option value="ml">Predictive ML</option><option value="gen">Generative AI</option></select></div>`).join('')}</div>${button('Review architecture','review')}<div id="feedback" aria-live="polite"></div>`;
 host.querySelector('#review').onclick=()=>{
  const choices=routes.map((r,i)=>host.querySelector(`#route${i}`).value);
  if(choices.some(v=>!v)){feedback(host.querySelector('#feedback'),false,'Allocate all four requests first.');return;}
  const correct=routes.filter((r,i)=>choices[i]===r.answer).length;
  feedback(host.querySelector('#feedback'),correct===4,`<strong>${correct}/4 decisions supported</strong><ul>${routes.map((r,i)=>`<li>${choices[i]===r.answer?'✓':'↻'} ${r.why}</li>`).join('')}</ul>`);
  if(correct===4)win();
 };
}
function audit(host,win) {
 host.innerHTML=`<div class="game-intro"><span class="eyebrow">DATA QUALITY GATE</span><h3>Something is too good to be true.</h3><p>The model reports 99.8% accuracy. Select the three items to quarantine. Keep valid inputs and targets.</p></div><div class="audit-grid">${auditRows.map((r,i)=>`<label class="audit-card"><input type="checkbox" value="${i}"><span><strong>${r.name}</strong><small>${r.detail}</small></span><span class="audit-mark" aria-hidden="true">⊕</span></label>`).join('')}</div>${button('Run data audit','audit')}<div id="feedback" aria-live="polite"></div>`;
 host.querySelector('#audit').onclick=()=>{
  const selections=[...host.querySelectorAll('input')].map(e=>e.checked);
  const ok=auditRows.every((r,i)=>r.bad===selections[i]);
  feedback(host.querySelector('#feedback'),ok,`<strong>${ok?'Dataset boundary protected.':'Revisit your quarantine list.'}</strong><ul>${auditRows.map((r,i)=>`<li>${r.bad===selections[i]?'✓':'↻'} <b>${r.name}:</b> ${r.why}</li>`).join('')}</ul>`);
  if(ok)win();
 };
}
function chart(model){
 const px=x=>48+(x-1)*76,py=y=>244-(y/300)*210;
 const points=Array.from({length:101},(_,i)=>{const x=1+i*.05;return `${px(x)},${Math.max(12,Math.min(250,py(model.predict(x))))}`;}).join(' ');
 return `<svg class="chart" viewBox="0 0 480 285" role="img" aria-label="Regression chart. Orange points are training, green points validation, brown line prediction. Numerical errors are shown beside the chart."><defs><clipPath id="plot-clip"><rect x="46" y="12" width="385" height="235"/></clipPath></defs>${[0,100,200,300].map(y=>`<line x1="48" x2="430" y1="${py(y)}" y2="${py(y)}" class="grid-line"/><text x="8" y="${py(y)+4}">${y}</text>`).join('')}<text x="8" y="17">ms</text><polyline points="${points}" fill="none" stroke="#6b5147" stroke-width="3" clip-path="url(#plot-clip)"/>${model.train.map(p=>`<circle cx="${px(p.x)}" cy="${py(p.y)}" r="5" fill="#ca7653"/>`).join('')}${model.validation.map(p=>`<rect x="${px(p.x)-4}" y="${py(p.y)-4}" width="8" height="8" fill="#648572"/>`).join('')}${[1,2,3,4,5,6].map(x=>`<text x="${px(x)-3}" y="263">${x}</text>`).join('')}<text x="160" y="282">Load (hundreds of requests/s)</text></svg>`;
}
function training(host,win) {
 let kind='baseline',noise=1;const tried=new Set();
 host.innerHTML=`<div class="game-intro"><span class="eyebrow">MODEL WORKBENCH · REAL TOY FIT</span><h3>Find the trend. Leave the noise.</h3><p>Compare at least two model families. Beat baseline validation error by 50% with a train/validation MAE gap below 15 ms.</p></div><div class="control-row"><label>Model family<select id="model"><option value="baseline">Constant baseline</option><option value="line">Fitted straight line</option><option value="memoriser">Memorising curve</option></select></label><label>Training noise <output id="noise-label">1×</output><input id="noise" type="range" min="0.5" max="2" step="0.5" value="1"></label></div><div class="experiment-grid"><div><div id="plot"></div><p class="legend"><span>● Training</span><span>■ Validation</span><span>━ Prediction</span></p></div><div id="stats" class="stats-stack"></div></div>${button('Submit this model','submit')}<div id="feedback" aria-live="polite"></div>`;
 const update=()=>{
  kind=host.querySelector('#model').value;noise=+host.querySelector('#noise').value;tried.add(kind);
  const m=regression(kind,noise),b=regression('baseline',noise);host.querySelector('#noise-label').textContent=`${noise}×`;
  host.querySelector('#plot').innerHTML=chart(m);
  host.querySelector('#stats').innerHTML=`<div class="metric"><small>Training MAE</small><strong>${m.trainError.toFixed(1)} <em>ms</em></strong></div><div class="metric"><small>Validation MAE</small><strong>${m.validationError.toFixed(1)} <em>ms</em></strong></div><div class="metric"><small>Baseline validation MAE</small><strong>${b.validationError.toFixed(1)} <em>ms</em></strong></div><p class="micro">${kind==='line'?`Fitted parameters: slope ${m.slope.toFixed(1)}, intercept ${m.intercept.toFixed(1)}.`:kind==='memoriser'?'This curve passes through every training point. Look between the points.':'The baseline predicts the training mean for every input.'}</p>`;
  host.querySelector('#feedback').innerHTML='';host.querySelector('#feedback').className='';
 };
 host.querySelector('#model').onchange=update;host.querySelector('#noise').oninput=update;update();
 host.querySelector('#submit').onclick=()=>{
  const m=regression(kind,noise),b=regression('baseline',noise);const ok=tried.size>=2&&m.validationError<b.validationError*.5&&Math.abs(m.trainError-m.validationError)<15;
  feedback(host.querySelector('#feedback'),ok,ok?'<strong>A useful pattern, not just a good memory.</strong><p>You improved on the baseline with a modest generalisation gap. Next, reserve fresh test data before making production claims.</p>':tried.size<2?'Compare at least two model families before submitting.':'This candidate has not met both goals. Compare the fitted line with the memoriser, and inspect validation error rather than training error alone.');if(ok)win();
 };
}
function threshold(host,win) {
 host.innerHTML=`<div class="game-intro"><span class="eyebrow">PAGER CONTROL ROOM</span><h3>Catch the signal. Protect the on-call.</h3><p>Reach ≥80% recall and ≥70% precision. Each missed incident costs 10 fictional units; a false alarm costs 1.</p></div><label class="range-label" for="threshold">Alert threshold <output id="threshold-label">0.90</output></label><input id="threshold" type="range" min="0" max="1" step="0.01" value="0.90"><div id="metrics" class="metrics-row"></div><div class="experiment-grid"><div><h4>20 scored incidents</h4><div id="dots" class="incident-dots"></div><p class="micro">U = actually urgent · R = actually routine<br>Filled = paged · outlined = not paged</p></div><div><h4>Confusion matrix</h4><div id="matrix" class="matrix"></div></div></div>${button('Deploy this threshold','deploy')}<div id="feedback" aria-live="polite"></div>`;
 const update=()=>{
  const t=+host.querySelector('#threshold').value,m=metrics(t);host.querySelector('#threshold-label').textContent=t.toFixed(2);
  host.querySelector('#metrics').innerHTML=[['Precision',pct(m.precision)],['Recall',pct(m.recall)],['Accuracy',pct(m.accuracy)],['Mistake cost',m.cost]].map(([n,v])=>`<div class="metric"><small>${n}</small><strong>${v}</strong></div>`).join('');
  host.querySelector('#dots').innerHTML=incidents.map(r=>`<span class="incident ${r.score>=t?'paged':''} ${r.label?'urgent':''}" title="Incident ${r.id}: score ${r.score}, ${r.label?'urgent':'routine'}, ${r.score>=t?'paged':'not paged'}">${r.label?'U':'R'}<small>${r.score.toFixed(2)}</small></span>`).join('');
  host.querySelector('#matrix').innerHTML=[['TP · caught',m.tp],['FP · false alarm',m.fp],['FN · missed',m.fn],['TN · left alone',m.tn]].map(([n,v])=>`<div><strong>${v}</strong><small>${n}</small></div>`).join('');
  host.querySelector('#feedback').innerHTML='';host.querySelector('#feedback').className='';
 };
 host.querySelector('#threshold').oninput=update;update();
 host.querySelector('#deploy').onclick=()=>{const m=metrics(+host.querySelector('#threshold').value),ok=m.recall>=.8&&m.precision>=.7;feedback(host.querySelector('#feedback'),ok,ok?`<strong>Release gate passed.</strong><p>${m.tp} urgent incidents caught, ${m.fn} missed, ${m.fp} false alarms. You met this scenario’s targets; those targets are not universal.</p>`:`<strong>Hold the release.</strong><p>${m.recall<.8?'Recall is too low: lower the threshold to catch more urgent incidents.':'Precision is too low: raise the threshold to reduce false alarms.'} Review individual outcomes as well as percentages.</p>`);if(ok)win();};
}
function rag(host,win) {
 host.innerHTML=`<div class="game-intro"><span class="eyebrow">CONTEXT STUDIO · SIMULATED GENERATION</span><h3>“How do I restart the payments worker safely?”</h3><p>Choose evidence, then generate a template answer. This sandbox uses no LLM or embedding model.</p></div><div class="budget"><span>Context budget</span><strong id="budget">0 / 120 units</strong><progress id="budget-bar" max="120" value="0"></progress></div><div class="audit-grid">${passages.map(p=>`<label class="audit-card passage"><input type="checkbox" value="${p.id}"><span><small class="eyebrow">${p.tag} · ${p.units} UNITS</small><strong>${p.name}</strong><small>${p.text}</small></span></label>`).join('')}</div>${button('Assemble & generate','generate')}<div id="feedback" aria-live="polite"></div>`;
 const ids=()=>[...host.querySelectorAll('input:checked')].map(e=>e.value);
 host.querySelectorAll('input').forEach(el=>el.onchange=()=>{const r=contextResult(ids());host.querySelector('#budget').textContent=`${r.units} / 120 units`;host.querySelector('#budget-bar').value=r.units;host.querySelector('#budget').className=r.units>120?'danger':'';host.querySelector('#feedback').innerHTML='';host.querySelector('#feedback').className='';});
 host.querySelector('#generate').onclick=()=>{const r=contextResult(ids());feedback(host.querySelector('#feedback'),r.ok,`<span class="eyebrow">TEMPLATE OUTPUT</span><blockquote>${r.text}</blockquote><p>${r.reason}</p>${r.ok?'<small>[1] Payments runbook v3 · [2] Production change policy</small>':''}`);if(r.ok)win();};
}
function operations(host,win) {
 const evidence=new Set();const cards=[['Quality trend','Recall fell from 84% to 34% immediately after release v12. Precision rose. Human-reviewed labels confirm the change.'],['Release diff','Only the alert threshold changed: 0.45 → 0.90. Model artefact and preprocessing versions are identical. The previous config is compatible and has passed rollback checks.'],['Input distribution','Service mix and score distribution are stable in this toy window. Schema and units match training. No observed drift explains this drop.'],['Service telemetry','Uptime is 99.9%, p95 latency 180 ms, CPU 42%. No saturation or error-rate change. More replicas would not address missed alerts.']];
 host.innerHTML=`<div class="game-intro"><span class="eyebrow">FINAL INCIDENT · 09:42</span><h3>The API is healthy. The on-call is missing incidents.</h3><p>Inspect all four evidence cards, then choose exactly two actions: containment and prevention.</p></div><div class="incident-banner"><span class="pulse"></span> SEV 2 <span>Quality regression after v12</span></div><div class="evidence-grid">${cards.map(([title,body],i)=>`<details data-evidence="${i}"><summary>${title}<span>Inspect ↗</span></summary><p>${body}</p></details>`).join('')}</div><p id="evidence-count" class="micro">0/4 evidence cards inspected</p><div class="action-list">${[['scale','Double the number of replicas'],['rollback','Restore the verified 0.45 threshold and monitor recall'],['retrain','Immediately retrain on unreviewed production predictions'],['gate','Add a minimum-recall evaluation gate to config releases']].map(([id,label])=>`<label><input type="checkbox" value="${id}">${label}</label>`).join('')}</div>${button('Execute recovery plan','recover')}<div id="feedback" aria-live="polite"></div>`;
 host.querySelectorAll('details').forEach(el=>el.ontoggle=()=>{if(el.open)evidence.add(el.dataset.evidence);host.querySelector('#evidence-count').textContent=`${evidence.size}/4 evidence cards inspected`;});
 host.querySelector('#recover').onclick=()=>{const actions=[...host.querySelectorAll('input:checked')].map(e=>e.value);const ok=recoveryResult([...evidence],actions);feedback(host.querySelector('#feedback'),ok,ok?'<strong>Incident contained. Regression guarded.</strong><p>Restore the tested threshold, verify recovery with reviewed labels, and add a recall gate. Stable infrastructure metrics were never evidence that predictions were useful.</p>':evidence.size<4?'Inspect all four evidence cards before acting.':'Choose exactly one containment action and one prevention action. The release diff points to a threshold change; compute capacity and model weights did not change.');if(ok)win();};
}
