import test from 'node:test';
import assert from 'node:assert/strict';
import {metrics,regression,contextResult,recoveryResult,cleanState} from '../../public/apricot/engine.js';
test('classification derives all four outcomes and handles no predicted positives',()=>{
 assert.deepEqual(metrics(.5),{tp:5,fp:1,tn:13,fn:1,precision:5/6,recall:5/6,accuracy:.9,cost:11});
 assert.equal(metrics(1).precision,null);assert.equal(metrics(1).recall,0);
 assert.equal(metrics(0).recall,1);assert.equal(metrics(0).precision,.3);
 for(let i=0;i<=100;i++){const m=metrics(i/100);assert.equal(m.tp+m.fp+m.tn+m.fn,20);}
});
test('line fits training data and generalises better than the memoriser',()=>{
 const b=regression('baseline'),l=regression('line'),m=regression('memoriser');
 assert.ok(l.validationError<b.validationError*.5);
 assert.ok(m.trainError<1e-8);assert.ok(m.validationError>l.validationError*5);
 assert.ok(Math.abs(l.slope-30)<5);
 assert.ok(regression('memoriser',2).validationError>m.validationError);
});
test('context enforces budget, freshness and both sources',()=>{
 assert.equal(contextResult([]).ok,false);
 assert.equal(contextResult(['current']).ok,false);
 assert.equal(contextResult(['current','old']).ok,false);
 assert.equal(contextResult(['current','policy','lunch']).ok,false);
 assert.equal(contextResult(['current','policy']).ok,true);
 assert.equal(contextResult(['current','policy']).units,100);
});
test('recovery needs evidence and the appropriate two actions',()=>{
 assert.equal(recoveryResult(['0','1','2'],['rollback','gate']),false);
 assert.equal(recoveryResult(['0','1','2','3'],['rollback','gate']),true);
 assert.equal(recoveryResult(['0','1','2','3'],['rollback','gate','scale']),false);
});
test('saved state cannot create duplicate or out-of-range awards',()=>{
 const s=cleanState({wins:[0,0,5,6,-1,'2'],read:{0:20,1:-3},notes:{0:4,1:'hello'},last:99});
 assert.deepEqual(s.wins,[0,5]);assert.equal(s.read[0],4);assert.equal(s.read[1],0);assert.equal(s.last,0);assert.equal(s.notes[0],undefined);assert.equal(s.notes[1],'hello');
});
