import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitCentres,classify} from '../../public/apricot/ai-playground.js';
test('centres are learned from examples, and new inputs use those centres',()=>{
 const centres=fitCentres();
 assert.equal(centres[0].x,2/3);assert.equal(centres[1].x,11/3);
 assert.equal(classify({x:0,y:0}).label,0);
 assert.equal(classify({x:5,y:5}).label,1);
 assert.deepEqual(fitCentres(),centres);
 const changed=fitCentres([{x:5,y:5,label:0},{x:0,y:0,label:1}]);
 assert.equal(classify({x:5,y:5},changed).label,0);
});
