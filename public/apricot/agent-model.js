export const agentScenario={
 goal:'Prepare a concise incident update for the on-call channel.',
 tools:[
  {id:'status',name:'Read service status',result:'API: stable. Queue latency: elevated for 12 minutes.'},
  {id:'runbook',name:'Search the runbook',result:'When queue latency exceeds 10 minutes, check backlog before paging.'},
  {id:'page',name:'Page the on-call engineer',result:'Page sent to the on-call engineer.'}
 ],
 memory:[
  {kind:'preference',text:'Updates should say what is known, what is being checked, and when the next update is due.'},
  {kind:'fact',text:'The queue alert started 12 minutes ago.'}
 ]
};

export function allowed(action,{approved=false,backlog=false}={}){
 if(action==='status'||action==='runbook')return {ok:true,why:'Read-only evidence gathering is allowed.'};
 if(action==='page'&&approved&&backlog)return {ok:true,why:'The evidence and approval support this external action.'};
 return {ok:false,why:action==='page'?'Paging changes the outside world. Check the backlog and approve it first.':'This action is unavailable.'};
}

export function scoreRun(run){
 const checks=[run.goal,run.tools.includes('status'),run.tools.includes('runbook'),run.backlog,run.approved,run.tools.includes('page')];
 return {score:checks.filter(Boolean).length,total:checks.length,checks};
}
