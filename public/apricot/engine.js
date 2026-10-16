export const incidents = [
 [.96,1],[.88,1],[.79,1],[.67,1],[.55,1],[.35,1],
 [.72,0],[.48,0],[.41,0],[.38,0],[.32,0],[.29,0],[.26,0],[.23,0],[.20,0],[.18,0],[.15,0],[.12,0],[.08,0],[.03,0]
].map(([score,label],i)=>({id:i+1,score,label}));
export function metrics(threshold) {
  let tp=0,fp=0,tn=0,fn=0;
  for(const r of incidents) { if(r.score>=threshold) r.label ? tp++ : fp++; else r.label ? fn++ : tn++; }
  return {tp,fp,tn,fn,precision:tp+fp?tp/(tp+fp):null,recall:tp/(tp+fn),accuracy:(tp+tn)/incidents.length,cost:fn*10+fp};
}
export function regression(kind, noise=1) {
  const xs=[1,2,3,4,5,6], offsets=[12,-17,19,-18,16,-10];
  const train=xs.map((x,i)=>({x,y:40+30*x+offsets[i]*noise}));
  const validation=[1.4,2.5,3.6,4.5,5.6].map((x,i)=>({x,y:40+30*x+[3,-4,2,-3,4][i]}));
  const avg=train.reduce((s,p)=>s+p.y,0)/train.length;
  const mx=3.5, slope=train.reduce((s,p)=>s+(p.x-mx)*(p.y-avg),0)/train.reduce((s,p)=>s+(p.x-mx)**2,0);
  const predict=kind==='baseline'?()=>avg:kind==='line'?x=>avg+slope*(x-mx):x=>train.reduce((sum,p,i)=>sum+p.y*train.reduce((prod,q,j)=>i===j?prod:prod*(x-q.x)/(p.x-q.x),1),0);
  const mae=points=>points.reduce((s,p)=>s+Math.abs(p.y-predict(p.x)),0)/points.length;
  return {train,validation,predict,trainError:mae(train),validationError:mae(validation),slope,intercept:avg-slope*mx};
}
export const routes=[
 {text:'Reject a request with an expired authentication token.',answer:'rules',why:'Token validation has a precise policy. Deterministic checks are easier to audit and test.'},
 {text:'Estimate tomorrow’s ticket volume from 18 months of labelled daily history.',answer:'ml',why:'This is numerical forecasting. Compare a predictive model with a simple seasonal baseline.'},
 {text:'Draft a readable handover from reviewed incident notes, for a human to approve.',answer:'gen',why:'Language generation fits drafting. The review step matters because generated text can add unsupported claims.'},
 {text:'Predict urgent vs routine from thousands of reviewed tickets and their arrival-time telemetry.',answer:'ml',why:'This is supervised classification with historical labels. Evaluate missed incidents and false alarms.'}
];
export const auditRows=[
 {name:'Ticket description',detail:'Captured when the ticket arrived.',bad:false,why:'Available at prediction time; still check privacy and text quality.'},
 {name:'Resolution category',detail:'Assigned after the incident has been resolved.',bad:true,why:'Target leakage: this future-derived field is not available at initial triage.'},
 {name:'Error rate at arrival',detail:'Measured in the five minutes before the ticket.',bad:false,why:'A valid candidate feature, provided training and serving use the same definition.'},
 {name:'Ticket 184 (test copy)',detail:'Same incident and text as ticket 071 in training.',bad:true,why:'Cross-split duplicate: it can inflate evaluation results through memorisation.'},
 {name:'Unreviewed severity labels',detail:'Blank targets were automatically filled as “routine”.',bad:true,why:'Missing labels were converted into invented ground truth. Quarantine them for review.'},
 {name:'Reviewed severity target',detail:'Independent post-incident review; used only as the label.',bad:false,why:'Future outcomes are appropriate as labels, not as prediction-time inputs.'}
];
export const passages=[
 {id:'current',name:'Payments runbook · v3',units:65,tag:'CURRENT',text:'Pause new jobs. Drain the queue. Restart the worker. Verify queue recovery and error rate before resuming traffic.'},
 {id:'policy',name:'Production change policy',units:35,tag:'REQUIRED',text:'Get on-call approval before a production restart and record the change in the incident log.'},
 {id:'old',name:'Payments runbook · v1',units:45,tag:'ARCHIVED',text:'Restart immediately. Queue draining is not required. This procedure has been superseded by v3.'},
 {id:'lunch',name:'Team handbook',units:30,tag:'UNRELATED',text:'Team lunch happens on Thursdays. Office access uses your staff badge.'}
];
export function contextResult(ids) {
 const selected=passages.filter(p=>ids.includes(p.id)); const units=selected.reduce((s,p)=>s+p.units,0);
 if(units>120) return {units,ok:false,text:'Context budget exceeded. Remove passages before generating an answer.',reason:'Prioritise current, relevant evidence over unrelated text.'};
 if(ids.includes('old')) return {units,ok:false,text:'Conflicting or obsolete instructions detected. Resolve document versions before answering.',reason:'More context is not always better. The archived runbook is unsafe evidence.'};
 if(!ids.includes('current')) return {units,ok:false,text:'I do not have the current restart procedure. Retrieve the payments runbook before proceeding.',reason:'Abstaining is better than inventing operational steps.'};
 if(!ids.includes('policy')) return {units,ok:false,text:'Pause jobs, drain the queue, restart and verify recovery [1]. Approval requirements are unknown from this evidence.',reason:'The operational steps alone do not establish permission to act.'};
 return {units,ok:true,text:'Obtain on-call approval and log the change [2]. Pause new jobs, drain the queue, restart the worker, then verify queue recovery and error rate before resuming traffic [1].',reason:'Current procedure + change policy provide a coherent evidence pack. A real generator still needs evaluation.'};
}
export function recoveryResult(evidence, actions) {return evidence.length===4 && actions.length===2 && actions.includes('rollback') && actions.includes('gate');}
export function cleanState(raw) {
 const s={read:{},wins:[],notes:{},mastery:{},last:0};
 if(!raw || typeof raw!=='object') return s;
 for(let i=0;i<6;i++) {s.read[i]=Math.max(0,Math.min(4,Math.floor(Number(raw.read?.[i])||0))); if(typeof raw.notes?.[i]==='string') s.notes[i]=raw.notes[i].slice(0,20000);}
 s.wins=[...new Set(Array.isArray(raw.wins)?raw.wins.filter(i=>Number.isInteger(i)&&i>=0&&i<6):[])];
 for(let i=0;i<6;i++)s.mastery[i]=Math.max(0,Math.min(3,Math.floor(Number(raw.mastery?.[i])||0)));
 s.last=Number.isInteger(raw.last)&&raw.last>=0&&raw.last<6?raw.last:0;
 return s;
}
