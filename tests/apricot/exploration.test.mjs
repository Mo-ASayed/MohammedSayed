import test from 'node:test';
import assert from 'node:assert/strict';
import {bestFit,fittingData,lineLoss,nextTicket,seededTickets,wordProbabilities} from '../../public/apricot/experiment-models.js';
import {alertRates} from '../../public/apricot/experiment-details.js';
test('least-squares reference is a local loss minimum and responds to changed labels',()=>{
 const data=fittingData(),best=bestFit(data),loss=lineLoss(data,best.slope,best.offset);
 for(const delta of [-.1,.1]){assert.ok(lineLoss(data,best.slope+delta,best.offset)>loss);assert.ok(lineLoss(data,best.slope,best.offset+delta)>loss);}
 assert.ok(bestFit(fittingData(true)).slope<best.slope);
});
test('incremental sampling preserves the original reproducible sequence',()=>{
 let state=731;const sequence=Array.from({length:200},()=>{const next=nextTicket(state);state=next.state;return next.ticket;});
 assert.deepEqual(sequence,seededTickets(200));assert.notDeepEqual(sequence,seededTickets(200,732));
});
test('top-p retains a minimal leading set and renormalises it',()=>{
 const full=wordProbabilities(1,5),filtered=wordProbabilities(1,5,.7);
 assert.equal(filtered.filter(p=>p>0).length,2);assert.ok(full[0]<.7);assert.ok(full[0]+full[1]>=.7);
 assert.ok(Math.abs(filtered.reduce((a,b)=>a+b,0)-1)<1e-12);
 assert.deepEqual(wordProbabilities(1,5,.1),[1,0,0,0,0]);assert.deepEqual(wordProbabilities(1,1,.9),[1,0,0,0,0]);
});
test('alert metrics distinguish undefined precision from zero recall',()=>{
 assert.deepEqual(alertRates({tp:0,fp:0,fn:4}),{precision:null,recall:0});
 assert.deepEqual(alertRates({tp:0,fp:3,fn:0}),{precision:0,recall:null});
});
