import test from 'node:test';
import assert from 'node:assert/strict';
import {errorCost,requestOutcomes,modelComparison} from '../../public/apricot/experiment-details.js';
import {driftBatch,scoreBatch} from '../../public/apricot/experiment-models.js';
test('request tiles agree with aggregate outcomes and hide labels until revealed',()=>{
 const data=driftBatch('rule',2),scores=scoreBatch(data,5),tiles=requestOutcomes(data,5,true);
 for(const key of ['tp','tn','fp','fn'])assert.equal(tiles.filter(t=>t.kind===key).length,scores[key]);
 assert.ok(requestOutcomes(data,5,false).every(t=>t.kind==='unknown'&&t.symbol==='?'));
});
test('weighted costs charge misses and false alarms consistently',()=>{
 assert.equal(errorCost({fp:3,fn:2},5),13);
 assert.equal(errorCost({fp:3,fn:2},1),5);
 assert.equal(errorCost({fp:0,fn:0},10),0);
});
test('comparison table does not disclose held-out errors before reveal',()=>{
 assert.equal((modelComparison(1,false,'line').match(/Hidden/g)||[]).length,3);
 assert.ok(!modelComparison(1,true,'line').includes('Hidden'));
});
