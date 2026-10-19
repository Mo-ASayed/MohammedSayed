import test from 'node:test';
import assert from 'node:assert/strict';
import {cutPolicy} from '../../public/apricot/chunk-bench.js';
import {evaluateInbox} from '../../public/apricot/inbox-bench.js';
import {cleanExpedition} from '../../public/apricot/map-quest.js';
test('chunk puzzle distinguishes missing conditions from excess size',()=>{
 assert.equal(cutPolicy(3).complete,false);
 assert.equal(cutPolicy(4).complete,false);
 assert.equal(cutPolicy(5).complete,true);
 assert.equal(cutPolicy(5).fits,true);
 assert.equal(cutPolicy(6).complete,true);
 assert.equal(cutPolicy(6).fits,false);
});
test('threshold tuning exposes misses, false alarms and a feasible challenge',()=>{
 assert.equal(evaluateInbox(0).missed,1);
 const solved=evaluateInbox(-3.5);assert.equal(solved.caught,3);assert.equal(solved.falseAlarms,1);
 assert.ok(evaluateInbox(-5).falseAlarms>solved.falseAlarms);
 assert.ok(evaluateInbox(5).missed>solved.missed);
});
test('stored map progression cannot skip prerequisites or inject invalid layers',()=>{
 assert.deepEqual(cleanExpedition({chapter:99,solved:[2,99,'0']}),{chapter:0,solved:[]});
 assert.deepEqual(cleanExpedition({chapter:2,solved:[0,0,1]}),{chapter:2,solved:[0,1]});
 assert.deepEqual(cleanExpedition({chapter:2,solved:[0]}),{chapter:1,solved:[0]});
 assert.deepEqual(cleanExpedition(null),{chapter:0,solved:[]});
});
