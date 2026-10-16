import {test} from 'node:test';
import assert from 'node:assert/strict';
import {embed,cosine,retrieve,checkEvidence,documents} from '../../public/apricot/rag-studio.js';

test('toy vectors connect synonyms while keywords require matching words',()=>{
 assert.deepEqual(embed('flights'),embed('plane'));
 assert.equal(retrieve('luggage','vector')[0].id,1);
 assert.equal(retrieve('luggage','keyword').length,0);
 assert.equal(cosine([1,0],[0,1]),0);
 assert.equal(cosine([0,0],[1,0]),0);
 assert.ok(Math.abs(cosine([1,2],[1,2])-1)<1e-12);
});
test('unknown input returns no evidence and filtering excludes stale passages',()=>{
 assert.deepEqual(retrieve('quantum physics'),[]);
 assert.deepEqual(retrieve(''),[]);
 assert.ok(!retrieve('flight baggage','vector',5,true).some(d=>d.id===7));
 assert.ok(retrieve('flight baggage','vector',5,false).some(d=>d.id===7));
 assert.equal(retrieve('hotel','vector',1).length,1);
 assert.equal(documents.length,8);
});
test('missions require specific supporting evidence and honest abstention',()=>{
 assert.ok(checkEvidence(0,[1]));assert.ok(!checkEvidence(0,[7]));
 assert.ok(!checkEvidence(0,[1,7]));assert.ok(!checkEvidence(0,[],true));
 assert.ok(checkEvidence(1,[5]));assert.ok(!checkEvidence(1,[2]));
 assert.ok(checkEvidence(2,[],true));assert.ok(!checkEvidence(2,[1]));
 assert.ok(!checkEvidence(2,[1],true));assert.ok(!checkEvidence(99,[]));
});
