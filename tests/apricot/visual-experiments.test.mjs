import test from 'node:test';
import assert from 'node:assert/strict';
import {fittingData,lineLoss,trainStep,wordProbabilities,sampleWord,seededTickets,driftBatch,scoreBatch,histogram} from '../../public/apricot/experiment-models.js';
import {regression} from '../../public/apricot/engine.js';
test('gradient training reduces actual error and responds to a changed label',()=>{
 const train=data=>{let model={slope:1,offset:1};for(let i=0;i<500;i++){const next=trainStep(data,model.slope,model.offset);assert.ok(lineLoss(data,next.slope,next.offset)<=lineLoss(data,model.slope,model.offset)+1e-9);model=next;}return model;};
 const clean=train(fittingData()),noisy=train(fittingData(true));
 assert.ok(lineLoss(fittingData(),clean.slope,clean.offset)<.2);
 assert.ok(noisy.slope<clean.slope);
});
test('memorisation wins on training but loses to the line on noisy held-out data',()=>{
 const line=regression('line',1),curve=regression('memorise',1);
 assert.ok(curve.trainError<1e-8);
 assert.ok(curve.validationError>line.validationError);
 assert.ok(line.validationError<6);
});
test('temperature changes concentration and top-k removes excluded candidates',()=>{
 const cool=wordProbabilities(.2,5),warm=wordProbabilities(2,5),two=wordProbabilities(1,2);
 assert.ok(cool[0]>warm[0]);assert.ok(Math.abs(two.reduce((a,b)=>a+b,0)-1)<1e-12);
 assert.deepEqual(two.slice(2),[0,0,0]);
 const counts=Array(5).fill(0);for(const ticket of seededTickets(200))counts[sampleWord(two,ticket)]++;
 assert.equal(counts.reduce((a,b)=>a+b,0),200);assert.deepEqual(counts.slice(2),[0,0,0]);
 assert.ok(counts[0]>counts[1]);assert.equal(sampleWord(two,0),0);assert.equal(sampleWord(two,.999999),1);
});
test('input drift need not reduce quality and concept drift can hide from input monitoring',()=>{
 const reference=driftBatch('inputs',0),shifted=driftBatch('inputs',2),changedRule=driftBatch('rule',2);
 assert.notDeepEqual(histogram(reference),histogram(shifted));assert.equal(scoreBatch(shifted,5).accuracy,1);
 assert.deepEqual(histogram(reference),histogram(changedRule));assert.ok(scoreBatch(changedRule,5).accuracy<.95);
 assert.equal(scoreBatch(changedRule,7).accuracy,1);
});
