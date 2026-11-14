import test from 'node:test';
import assert from 'node:assert/strict';
import {allowed,scoreRun} from '../../public/apricot/agent-model.js';

test('read-only tools can gather evidence but paging needs evidence and approval',()=>{
 assert.equal(allowed('status').ok,true);
 assert.equal(allowed('page').ok,false);
 assert.equal(allowed('page',{backlog:true}).ok,false);
 assert.equal(allowed('page',{backlog:true,approved:true}).ok,true);
});

test('agent run score shows whether the safe loop is complete',()=>{
 assert.equal(scoreRun({goal:true,tools:['status','runbook','page'],backlog:true,approved:true}).score,6);
 assert.equal(scoreRun({goal:true,tools:['status'],backlog:false,approved:false}).score,2);
});
