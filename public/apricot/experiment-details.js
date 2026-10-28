import {regression} from './engine.js';
export const errorCost=(scores,missCost)=>scores.fp+scores.fn*missCost;
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
