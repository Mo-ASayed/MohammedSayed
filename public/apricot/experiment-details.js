import {regression} from './engine.js';
import {predictLine} from './experiment-models.js';
export function experimentGlossary(index){const terms=[
 [['Parameter','A learned model value. Here the line has two: its rise and starting height.'],['Loss','The number training tries to reduce. Here it is mean squared prediction error.'],['Inference','Using the current model to predict for an input, without updating its parameters.']],
 [['Training set','The examples used to fit the model.'],['Validation set','Separate examples used to compare models and settings. Repeated tuning can overfit this set too.'],['Generalisation','How well a model works on new data from the situation where it will be used.']],
 [['Token','A unit of text a language model processes. It may be a word, part of a word or punctuation. This toy uses whole words.'],['Temperature','A setting that changes how concentrated the candidate probabilities are.'],['Greedy decoding','Choosing the highest-scoring next token instead of drawing a random sample.']],
 [['Input drift','The distribution of incoming inputs changes. This alone does not prove model quality fell.'],['Concept drift','The relationship between inputs and outcomes changes.'],['Ground truth','The measured or reviewed outcome used to judge a prediction. Labels can themselves be late or wrong.']]
 ];return '<details class="experiment-glossary"><summary>Three terms used here</summary><dl>'+terms[index].map(([term,meaning])=>'<div><dt>'+term+'</dt><dd>'+meaning+'</dd></div>').join('')+'</dl></details>';}
export function fitDataTable(data,slope,offset){return '<table class="experiment-table"><caption>Squared error is (prediction minus label) squared. MSE averages this last column.</caption><thead><tr><th>Load</th><th>Label</th><th>Prediction</th><th>Squared error</th></tr></thead><tbody>'+data.map(p=>{const guess=predictLine(p.x,slope,offset);return '<tr><th scope="row">'+p.x+'</th><td>'+p.y.toFixed(2)+'</td><td>'+guess.toFixed(2)+'</td><td>'+((guess-p.y)**2).toFixed(3)+'</td></tr>';}).join('')+'</tbody></table>';}
export const errorCost=(scores,missCost)=>scores.fp+scores.fn*missCost;
export function alertRates(scores){return {precision:scores.tp+scores.fp?scores.tp/(scores.tp+scores.fp):null,recall:scores.tp+scores.fn?scores.tp/(scores.tp+scores.fn):null};}
export function ratesTable(deployed,candidate){const fmt=n=>n===null?'Not defined':(n*100).toFixed(1)+'%';const a=alertRates(deployed),b=alertRates(candidate);return '<table class="experiment-table"><caption>Precision: how many alerts were correct? Recall: how many real positives did we catch?</caption><thead><tr><th>Metric</th><th>Deployed</th><th>Candidate</th></tr></thead><tbody><tr><th>Precision</th><td>'+fmt(a.precision)+'</td><td>'+fmt(b.precision)+'</td></tr><tr><th>Recall</th><td>'+fmt(a.recall)+'</td><td>'+fmt(b.recall)+'</td></tr></tbody></table><p>Precision is undefined with no predicted alerts. Recall is undefined with no real positives. A missing denominator is not 0% or 100%.</p>';}
export function requestOutcomes(data,threshold,reveal){return data.map((p,i)=>{
 const prediction=p.x>=threshold;
 const kind=!reveal?'unknown':prediction?(p.label?'tp':'fp'):(p.label?'fn':'tn');
 const names={unknown:'Outcome hidden',tp:'Correct alert',fp:'False alarm',fn:'Missed alert',tn:'Correct non-alert'};
 return {id:i+1,kind,symbol:kind==='unknown'?'?':kind.toUpperCase(),description:'Request '+(i+1)+'. Input '+p.x.toFixed(2)+'. Predicted '+(prediction?'alert':'no alert')+'. '+names[kind]+'.'};
});}
export function modelComparison(noise,reveal,selected){
 return '<table class="experiment-table"><caption>Same data. Three different fits. Errors in toy milliseconds.</caption><thead><tr><th>Model</th><th>Training MAE</th><th>Validation MAE</th></tr></thead><tbody>'+[['baseline','Flat baseline'],['line','Fitted line'],['memorise','Flexible curve']].map(([id,name])=>{const r=regression(id,noise);return '<tr class="'+(id===selected?'selected-model':'')+'"><th scope="row">'+name+(id===selected?' (shown)':'')+'</th><td>'+r.trainError.toFixed(1)+'</td><td>'+(reveal?r.validationError.toFixed(1):'Hidden')+'</td></tr>';}).join('')+'</tbody></table>';
}
export function lossTrace(values){
 const max=Math.max(...values,.01),points=values.map((v,i)=>(20+i*360/Math.max(1,values.length-1))+','+(100-v/max*80)).join(' ');
 return `<figure class="loss-trace"><figcaption>Recent training loss <span>${values.at(-1).toFixed(3)} MSE</span></figcaption><svg viewBox="0 0 400 125" role="img" aria-label="${values.length} recorded losses, from ${values[0].toFixed(3)} to ${values.at(-1).toFixed(3)}"><path d="M20 15V100H380" class="chart-axis"/><polyline points="${points}" class="fitted-line"/><text x="20" y="119">Earlier steps</text><text x="380" y="119" text-anchor="end">Now</text></svg><small>Same data, successive training steps. Changing a label or manually adjusting the line starts a fresh trace.</small></figure>`;
}
