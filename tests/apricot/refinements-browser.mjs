import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {click} from './navigation.mjs';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});
const url=process.env.APRICOT_URL||'http://127.0.0.1:4180/apricot';
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function tap(x,y){await page.locator('.quest-map').scrollIntoViewIfNeeded();const b=await page.locator('.quest-map').boundingBox();await page.mouse.click(b.x+b.width*x/100,b.y+b.height*y/100);}
try{
 await mkdir('test-results',{recursive:true});await page.goto(url+'#basics');
 await page.locator('#ai-next').click();await click(page,'#label-errors');await page.locator('#label-errors').fill('2');assert.match(await page.locator('#label-result').innerText(),/prediction flipped/);
 await page.locator('#label-errors').fill('0');assert.match(await page.locator('#label-result').innerText(),/not flipped/);
 await page.locator('#ai-next').click();await click(page,'#inbox-threshold');assert.equal(await page.locator('#inbox-scores circle').count(),6);
 await page.locator('#inbox-threshold').fill('-3.5');await click(page,'#inbox-rates');assert.match(await page.locator('#inbox-rates').innerText(),/75%/);assert.match(await page.locator('#inbox-rates').innerText(),/100%/);
 await click(page,'#cost-test');assert.match(await page.locator('#cost-feedback').innerText(),/Solved/);
 await page.locator('#miss-cost').fill('1');await page.locator('#inbox-threshold').fill('5');await page.locator('#cost-test').click();assert.match(await page.locator('#cost-feedback').innerText(),/Solved/);assert.match(await page.locator('#inbox-rates').innerText(),/Not defined/);
 await page.locator('#inbox-threshold').fill('-3.5');await page.locator('#errors-only').check();assert.equal(await page.locator('#inbox-cases article').count(),1);
 await page.locator('#inbox-cases summary').click();assert.match(await page.locator('#inbox-cases').innerText(),/4 links, 4 urgency/);
 await page.locator('#inbox-bench').screenshot({path:'test-results/refinement-inbox.png'});
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'inbox overflow '+width);}
 await page.locator('#ai-next').click();await page.locator('#meeting-day').fill('3');assert.doesNotMatch(await page.locator('.source-email').innerText(),/Thursday no longer works/);
 await page.locator('#response-position').fill('7');assert.equal(await page.locator('#token-output').innerText(),'Your meeting has moved to Thursday.');
 await page.locator('#response-position').fill('2');assert.equal(await page.locator('.generated-piece').count(),2);await page.locator('#token-next').click();assert.equal(await page.locator('#response-position').inputValue(),'3');
 await page.locator('#meeting-day').fill('0');assert.equal(await page.locator('#response-position').inputValue(),'0');
 await page.setViewportSize({width:1440,height:960});await page.locator('#ai-rag').click();await page.locator('#open-map').click();
 await page.locator('.topk-control > summary').click();await page.locator('#quest-reach').fill('55');await page.locator('#quest-limit').fill('1');assert.match(await page.locator('#candidate-count').innerText(),/1 returned/);assert.equal(await page.locator('.retrieved-slip').count(),1);
 await page.locator('#quest-undo').click();assert.equal(await page.locator('#quest-limit').inputValue(),'7');
 await tap(20,30);await page.locator('#quest-reach').fill('12');await page.locator('[data-citation="1"]').click();assert.match(await page.locator('#quest-inspect').innerText(),/overhead locker/);
 await click(page,'[data-cut="5"]');await page.locator('#chunk-test').click();assert.match(await page.locator('#chunk-feedback').innerText(),/Solved/);assert.equal(await page.locator('#chunk-cut').inputValue(),'5');
 await click(page,'#chunk-overlap');await page.locator('#chunk-overlap').fill('3');assert.match(await page.locator('#overlap-result').innerText(),/Rule restored/);assert.match(await page.locator('#overlap-result').innerText(),/11 phrase units/);
 await page.locator('#chunk-bench').screenshot({path:'test-results/refinement-chunks.png'});
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'RAG overflow '+width);}
 const note='I changed the evidence <not HTML> and checked its source.';await click(page,'#experiment-note');await page.locator('#experiment-note').fill(note);
 await click(page,'[data-page="notebook"]');assert.equal(await page.locator('#note-4').inputValue(),note);
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;assert.ok((await readFile(await download.path(),'utf8')).includes(note));
 await page.evaluate(()=>localStorage.setItem('apricot-expedition-v1',JSON.stringify({chapter:3,solved:[0,1,2]})));
 await page.setViewportSize({width:1440,height:960});await page.goto(url+'#rag');await page.reload();await page.locator('#open-map').click();assert.equal(await page.locator('#quest-layer').inputValue(),'3');
 await page.locator('#quest-check').click();assert.equal(await page.locator('#quest-next').isVisible(),false);
 await tap(20,30);await page.locator('#quest-reach').fill('12');await page.locator('[data-citation="1"]').click();await page.locator('#quest-withhold').click();assert.match(await page.locator('#quest-status').innerText(),/Solved/);
 assert.ok((await page.evaluate(()=>JSON.parse(localStorage.getItem('apricot-expedition-v1')).solved)).includes(3));assert.match(await page.locator('#quest-answer').innerText(),/No supplied passage/);
 await page.setViewportSize({width:1440,height:960});await page.locator('.map-quest').screenshot({path:'test-results/refinement-evidence.png'});
 assert.deepEqual(errors,[]);console.log('PASS: label noise, scores, precision/recall, costs, error review, source consistency, response scrubbing, top-k, citations, tactile chunking, overlap, reflections/export, fourth layer and mobile.');
}finally{await browser.close();}
