import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fitScore,orderCheck,splitCheck,medalFor,chunkDocument} from '../../public/apricot/mastery.js';
import {cleanState} from '../../public/apricot/engine.js';
import {lessons} from '../../public/apricot/content.js';
import {enrichLessons} from '../../public/apricot/teaching.js';
test('both pipeline challenges enforce dependency order',()=>{
 assert.ok(orderCheck([1,3,4,0,2],0));assert.ok(orderCheck([2,1,4,3,0],1));assert.ok(!orderCheck([0,1,2,3,4],0));
});
test('time splits reject cross-partition duplicates and unknown targets',()=>{
 for(let r=0;r<2;r++)assert.ok(splitCheck({0:'train',1:'train',2:'validation',3:'test',4:'quarantine',5:'quarantine'},r));
 assert.ok(!splitCheck({0:'train',1:'train',2:'validation',3:'test',4:'validation',5:'test'},0));
});
test('fit scores represent actual prediction errors',()=>{
 assert.equal(fitScore(20,30,0),0);assert.equal(fitScore(35,50,1),0);assert.equal(fitScore(20,40,0),10);assert.ok(fitScore(10,10,0)>30);
});
test('chunk boundaries can preserve or remove prerequisites',()=>{
 assert.ok(!chunkDocument(5,0).some(c=>c.includes('drain the queue')&&c.includes('restarting')));
 assert.ok(chunkDocument(7,0).some(c=>c.includes('drain the queue')&&c.includes('restarting')));
 assert.ok(chunkDocument(6,0).some(c=>c.includes('verify recovery')&&c.includes('record the change')));
});
test('medals and stored mastery are bounded',()=>{
 assert.equal(medalFor(2),3);assert.equal(medalFor(4),2);assert.equal(medalFor(9),1);
 const s=cleanState({mastery:{0:90,1:-1,2:2},notes:{0:'Keep my notes'},wins:[0],read:{0:3}});
 assert.equal(s.mastery[0],3);assert.equal(s.mastery[1],0);assert.equal(s.notes[0],'Keep my notes');assert.equal(s.read[0],3);
});
test('24 complete learning steps and requested punctuation',()=>{
 enrichLessons(lessons);assert.equal(lessons.reduce((sum,l)=>sum+l.sections.length,0),24);
 for(const l of lessons){assert.equal(l.sections.length,4);assert.ok(l.sections[0].body.includes('A common mistake'));}
 for(const file of ['content.js','teaching.js','app.js','games.js','mastery.js'])assert.ok(!/[\u2013\u2014]/.test(readFileSync(new URL('../../public/apricot/'+file,import.meta.url),'utf8')),file+' contains a long dash');
});
