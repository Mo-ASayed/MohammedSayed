import test from 'node:test';
import assert from 'node:assert/strict';
import {scanMap,mapSources} from '../../public/apricot/map-quest.js';
test('map distance, metadata and context budget have distinct effects',()=>{
 const result=scanMap({x:24,y:26},mapSources,12,false,6);
 assert.deepEqual(result.context.map(d=>d.id),[1,7]);
 assert.deepEqual(scanMap({x:24,y:26},mapSources,12,true,6).context.map(d=>d.id),[1]);
 assert.equal(scanMap({x:24,y:26},mapSources,12,true,1).context.length,0);
 assert.deepEqual(scanMap({x:78,y:51},mapSources,8,true,2).context.map(d=>d.id),[5]);
 assert.equal(scanMap({x:95,y:95},mapSources,8,false,6).found.length,0);
});
test('moving a passage changes retrieval without modifying the source fixtures',()=>{
 const moved=mapSources.map(d=>d.id===1?{...d,x:90,y:90}:d);
 assert.equal(scanMap({x:24,y:26},moved,8,true,6).found.length,0);
 assert.equal(mapSources[0].x,24);
});
