import test from 'node:test';
import assert from 'node:assert/strict';
import {labelExperiment} from '../../public/apricot/label-bench.js';
import {inboxRates,evaluateInbox,inboxCost,bestInboxCost} from '../../public/apricot/inbox-bench.js';
import {overlapPolicy} from '../../public/apricot/chunk-bench.js';
import {scanMap,mapSources,cleanExpedition} from '../../public/apricot/map-quest.js';
test('wrong labels retrain the centres and flip the same input',()=>{
 const clean=labelExperiment(0),noisy=labelExperiment(2);
 assert.equal(clean.after,1);assert.equal(noisy.after,0);assert.notDeepEqual(noisy.centres,clean.centres);
 assert.deepEqual(labelExperiment(0).centres,clean.centres);
});
test('precision is undefined with no flags while recall remains zero',()=>{
 const none=inboxRates(evaluateInbox(5));assert.equal(none.precision,null);assert.equal(none.recall,0);
 const caught=inboxRates(evaluateInbox(-3.5));assert.equal(caught.precision,.75);assert.equal(caught.recall,1);
});
test('different error costs favour different operating points',()=>{
 assert.equal(inboxCost(5,1),bestInboxCost(1));
 assert.equal(inboxCost(-3.5,5),bestInboxCost(5));
 assert.ok(inboxCost(5,5)>bestInboxCost(5));
});
test('overlap restores the rule but counts duplicated storage',()=>{
 assert.equal(overlapPolicy(0).complete,false);assert.equal(overlapPolicy(3).complete,true);
 assert.equal(overlapPolicy(3).storedUnits,11);assert.equal(overlapPolicy(3).passage.length,5);
});
test('top-k limits candidates independently from distance and context budget',()=>{
 const r=scanMap({x:24,y:26},mapSources,55,true,6,1);
 assert.ok(r.nearby.length>1);assert.equal(r.found.length,1);assert.equal(r.context[0].id,1);
 const small=scanMap({x:24,y:26},mapSources,55,true,1,1);assert.equal(small.found.length,1);assert.equal(small.context.length,0);
});
test('fourth layer unlocks only after its prerequisites',()=>{
 assert.deepEqual(cleanExpedition({chapter:3,solved:[0,1,2]}),{chapter:3,solved:[0,1,2]});
 assert.equal(cleanExpedition({chapter:3,solved:[0,1]}).chapter,2);
});
