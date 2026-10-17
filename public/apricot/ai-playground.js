const samples = [
 {x:0,y:1,label:0},{x:1,y:0,label:0},{x:1,y:1,label:0},
 {x:3,y:4,label:1},{x:4,y:3,label:1},{x:4,y:4,label:1}
];
export function fitCentres(data=samples){
 return [0,1].map(label=>{const rows=data.filter(d=>d.label===label);return {x:rows.reduce((s,d)=>s+d.x,0)/rows.length,y:rows.reduce((s,d)=>s+d.y,0)/rows.length};});
}
export function classify(point,centres=fitCentres()) {
 const distance=centres.map(c=>Math.hypot(point.x-c.x,point.y-c.y));
 return {label:distance[1]<distance[0]?1:0,distance};
}
export function mountAiPlayground(host,onRag){
 let step=0,x=1,y=1;
 const titles=['Start with examples.','Find a pattern.','Try something new.','Where does an LLM fit?'];
 const intros=[
 'Imagine sorting email. A person labels a few messages as ordinary or spam. We turn each message into two inputs we can plot.',
 'Training uses the labelled examples to fit a model. This tiny model learns the average position of each group. Those two centres are its learned parameters.',
 'Inference means using the trained model on a new input. Move the sliders. This model picks whichever learned centre is closer.',
 'That was a classifier: it chose a category. A language model generates text instead. It learns language patterns from training data, then uses the context of your request to produce a response.'
 ];
 function render(){
  host.innerHTML=`<section class="ai-playground"><div class="experiment-caption"><span>ONE SMALL EXPERIMENT</span><span>${step+1} / 4</span></div><h1 tabindex="-1">${titles[step]}</h1><p class="experiment-intro">${intros[step]}</p><div id="ai-scene"></div><div class="experiment-bottom"><button class="text-button" id="ai-prev" ${step===0?'disabled':''}>Back</button>${step<3?`<button class="primary" id="ai-next">${['Show me training','Try a new email','And language models?'][step]} &rarr;</button>`:'<button class="primary" id="ai-rag">See how RAG gives it context &rarr;</button>'}</div></section>`;
  host.querySelector('#ai-prev').onclick=()=>{step--;render();host.querySelector('h1').focus();};
  const next=host.querySelector('#ai-next');if(next)next.onclick=()=>{step++;render();host.querySelector('h1').focus();};
  const rag=host.querySelector('#ai-rag');if(rag)rag.onclick=onRag;
  if(step<3)map();else language();
 }
 function map(){
  const centres=fitCentres();
  const dots=samples.map(d=>`<circle cx="${55+d.x*54}" cy="${325-d.y*54}" r="9" class="sample-${d.label}"/>`).join('');
  host.querySelector('#ai-scene').innerHTML=`<div class="ai-scene-layout"><div class="email-chart"><svg viewBox="0 0 430 390" role="img" aria-label="Email examples plotted by links and urgency words. Blue circles are ordinary, orange circles are spam. ${step>0?'Crosses mark learned group centres.':''}"><path d="M55 40V325H385" fill="none" stroke="#b7ab96"/>${[1,2,3,4,5].map(n=>`<path d="M55 ${325-n*54}H385 M${55+n*54} 40V325" stroke="#e4dbcc"/><text x="${55+n*54}" y="347">${n}</text><text x="32" y="${330-n*54}">${n}</text>`).join('')}${dots}${step>0?centres.map((c,i)=>`<path class="centre-${i}" d="M${55+c.x*54-12} ${325-c.y*54}h24 M${55+c.x*54} ${325-c.y*54-12}v24" stroke-width="4"/>`).join(''):''}${step===2?'<circle id="new-email" r="15" fill="none" stroke="#302c25" stroke-width="3"/>':''}<text x="200" y="380">Links in the email</text><text transform="translate(15 235) rotate(-90)">Urgency words</text></svg><div class="chart-key"><span><i class="ordinary-dot"></i> Ordinary email</span><span><i class="spam-dot"></i> Spam</span>${step>0?'<span>+ Learned centre</span>':''}</div></div><div class="scene-explanation">${step===0?'<span class="eyebrow">WHAT TO NOTICE</span><h2>Examples, not instructions.</h2><p>We provide the inputs and the correct labels. We do not write a separate rule for every email.</p><div class="email-example"><strong>Subject: Lunch tomorrow?</strong><span>Please reply ASAP. Menu: example.com</span><span>Extracted inputs: 1 link &middot; 1 urgency word</span><b>Label: ordinary</b></div>':step===1?'<span class="eyebrow">WHAT CHANGED?</span><h2>Six examples. Two centres.</h2><p>The crosses summarise the two groups. The model can now compare a new email with those learned positions.</p><div class="idea-strip">Examples &rarr; training &rarr; fitted model</div><p class="small-note">This is a simple nearest-centroid classifier, not a neural network. Other models learn different kinds of patterns.</p>':'<span class="eyebrow">YOUR TURN</span><h2>Move the new email.</h2><label for="email-links">Links <output id="links-value">1</output></label><input id="email-links" type="range" min="0" max="5" step="1" value="'+x+'"><label for="email-urgency">Urgency words <output id="urgency-value">1</output></label><input id="email-urgency" type="range" min="0" max="5" step="1" value="'+y+'"><div id="prediction-result" aria-live="polite"></div><p class="small-note">Try 4 links and 4 urgency words. Then imagine an important work email with those same counts. Would this model always be right?</p>'}</div></div><p class="experiment-caveat">${step===0?'These six invented examples are deliberately tidy. Real data is messier, and labels can be wrong.':step===1?'Learning a pattern is not proof that it works. Evaluate on new examples that were not used for training.':'The prediction is a guess from limited inputs, not an understanding of the email. Wrong or unrepresentative data can produce wrong decisions.'}</p>`;
  if(step===2){const update=()=>{const result=classify({x,y});host.querySelector('#new-email').setAttribute('cx',55+x*54);host.querySelector('#new-email').setAttribute('cy',325-y*54);host.querySelector('#links-value').textContent=x;host.querySelector('#urgency-value').textContent=y;host.querySelector('#prediction-result').innerHTML=`<span>MODEL PREDICTION</span><strong>${result.label?'Spam':'Ordinary email'}</strong><small>Closer to the ${result.label?'orange':'blue'} centre. No new training happened.</small>`;};host.querySelector('#email-links').oninput=e=>{x=+e.target.value;update();};host.querySelector('#email-urgency').oninput=e=>{y=+e.target.value;update();};update();}
 }
 function language(){
  host.querySelector('#ai-scene').innerHTML=`<div class="language-picture"><div><span class="eyebrow">YOUR CONTEXT</span><p>“Summarise this email in one sentence.”</p><small>Instructions + email text</small></div><span class="language-arrow" aria-hidden="true">&rarr;</span><div class="language-model"><span class="eyebrow">LANGUAGE MODEL</span><p>Uses learned patterns</p><small>Generates text a piece at a time</small></div><span class="language-arrow" aria-hidden="true">&rarr;</span><div><span class="eyebrow">GENERATED RESPONSE</span><p>“Your meeting has moved to Friday.”</p><small>Check it against the original</small></div></div><div class="ai-comparison"><div><h2>The shared idea</h2><p>Training fits parameters from examples. Inference uses the fitted model with new input. Calling an LLM normally does not retrain it.</p></div><div><h2>The important difference</h2><p>A classifier selects a label. An LLM generates language. A plausible sentence can still be false, and private files are not automatically in its context.</p></div></div><p class="experiment-caveat">AI is the broader field. Machine learning is one approach within it, and LLMs are one family of learned models. This toy explains the lifecycle, not how every AI system works.</p>`;
 }
 render();
}
