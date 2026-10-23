import test from 'node:test';
import assert from 'node:assert/strict';
import {scanMap,mapSources} from '../../public/apricot/map-quest.js';
import {cutPolicy} from '../../public/apricot/chunk-bench.js';
import {featureTwins} from '../../public/apricot/feature-twins.js';
import {classify} from '../../public/apricot/ai-playground.js';

test('retrieval explains filtering, distance, count and capacity separately',()=>{
 const run=(budget,limit)=>scanMap({x:24,y:26},mapSources,30,true,budget,limit).decisions;
 const reasons=run(1,1);
 assert.equal(reasons.find(d=>d.id===7).reason,'Outdated policy');
 assert.equal(reasons.find(d=>d.id===4).reason,'Outside search reach');
 assert.equal(reasons.find(d=>d.id===2).reason,'Beyond top-k limit');
 assert.equal(reasons.find(d=>d.id===1).reason,'Does not fit remaining capacity');
 assert.equal(run(2,1).find(d=>d.id===1).reason,'Included in context');
});
test('context capacity changes fit without repairing missing meaning',()=>{
 assert.equal(cutPolicy(5,4).fits,false);
 assert.equal(cutPolicy(5,5).fits,true);
 assert.equal(cutPolicy(5,4).complete,true);
 assert.equal(cutPolicy(3,8).complete,false);
});
test('identical features cannot separate messages with different true labels',()=>{
 const [a,b]=featureTwins.slice(1);
 assert.notEqual(a.label,b.label);
 assert.equal(classify({x:a.links,y:a.urgency}).label,classify({x:b.links,y:b.urgency}).label);
});
