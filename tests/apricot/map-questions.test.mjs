import test from 'node:test';
import assert from 'node:assert/strict';
import {mapQuestions,explainMapAnswer} from '../../public/apricot/map-questions.js';
import {mapSources,scanMap} from '../../public/apricot/map-quest.js';
test('every answerable authored question retrieves its own supporting current policy',()=>{
 for(const q of mapQuestions.filter(q=>q.source)){
  const result=scanMap(q,mapSources,22,true,6);
  assert.equal(explainMapAnswer(q,result).answer,q.answer,q.id);
 }
});
test('diagnosis distinguishes missing policies, failed retrieval and overflow',()=>{
 const bag=mapQuestions[0];
 assert.match(explainMapAnswer(bag,scanMap({x:50,y:50},mapSources,55,true,6)).why,/did not fit/);
 assert.match(explainMapAnswer(bag,scanMap({x:50,y:50},mapSources,8,true,6)).why,/outside/);
 assert.match(explainMapAnswer(bag,scanMap({x:50,y:50},mapSources,55,true,6,1)).why,/top-k/);
 assert.match(explainMapAnswer(mapQuestions.at(-1),scanMap(bag,mapSources,55,true,99)).why,/no pet policy/);
});
test('outdated evidence never becomes an unqualified current answer',()=>{
 const q=mapQuestions[0];
 assert.match(explainMapAnswer(q,scanMap(q,mapSources,22,false,6)).state,/Conflicting/);
 assert.match(explainMapAnswer(q,scanMap({x:31,y:22},mapSources,1,false,6)).answer,/No current limit/);
});
