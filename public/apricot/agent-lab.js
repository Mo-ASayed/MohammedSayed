import {agentScenario,allowed,scoreRun} from './agent-model.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function agentTeaser(){return `<section class="agent-teaser"><span class="eyebrow">03 / FROM CHAT TO ACTION</span><h2>What makes an AI<br><em>an agent?</em></h2><p>A model can write. An agent can work toward a goal, choose tools, keep useful state and ask before a risky action.</p><button class="secondary" id="start-agent-lab">Open the agent workspace &nearr;</button></section>`;}

export function mountAgentLab(host){
 const run={goal:true,tools:[],backlog:false,approved:false,log:[]};
 const render=()=>{
  const verdict=scoreRun(run);
  host.innerHTML=`<section class="agent-lab"><span class="eyebrow">A TOY AGENT WORKSPACE</span><h1>Give the model a job,<br><em>then make its work inspectable.</em></h1><p class="agent-intro">This is a simulated incident helper. There is no live monitoring, messaging or model call. You decide what it may do, then follow its trace.</p><div class="agent-goal"><span>GOAL</span><strong>${agentScenario.goal}</strong><small>A goal narrows what “helpful” means. It does not grant permission to act.</small></div><div class="agent-grid"><section class="agent-work"><h2>Work through the incident</h2><p>Start by gathering evidence. Actions appear in the trace so you can see why the agent reached a conclusion.</p><div class="agent-tools">${agentScenario.tools.map(tool=>`<button data-tool="${tool.id}" class="agent-tool ${run.tools.includes(tool.id)?'used':''}"><span>${run.tools.includes(tool.id)?'✓':'+'}</span><b>${tool.name}</b><small>${tool.id==='page'?'External action':'Read-only tool'}</small></button>`).join('')}</div><div class="agent-approval"><label><input id="backlog" type="checkbox" ${run.backlog?'checked':''}> I checked the queue backlog</label><label><input id="approved" type="checkbox" ${run.approved?'checked':''}> I approve paging if the evidence calls for it</label></div><p class="agent-feedback" role="status">${run.log.at(-1)||'Choose a tool to begin.'}</p></section><aside class="agent-trace"><div><span>RUN TRACE</span><strong>${verdict.score} / ${verdict.total} checks</strong></div>${run.log.length?`<ol>${run.log.map(item=>`<li>${esc(item)}</li>`).join('')}</ol>`:'<p>The trace will show observations, choices and any blocked action.</p>'}</aside></div><details class="agent-detail"><summary>What is different from a chatbot?</summary><p>A chatbot normally returns text. An agent loops: it reads the goal, chooses a bounded action, observes the result, and decides what to do next. The loop needs limits, records and a way to stop.</p></details></section>`;
  host.querySelectorAll('[data-tool]').forEach(button=>button.onclick=()=>{
   const id=button.dataset.tool,result=allowed(id,run);
   if(!result.ok){run.log.push('Blocked: '+result.why);render();return;}
   if(!run.tools.includes(id))run.tools.push(id);
   const tool=agentScenario.tools.find(item=>item.id===id);run.log.push(tool.name+': '+tool.result);render();
  });
  host.querySelector('#backlog').onchange=e=>{run.backlog=e.target.checked;render();};
  host.querySelector('#approved').onchange=e=>{run.approved=e.target.checked;render();};
 };
 render();
}
