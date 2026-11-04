import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const base=process.env.APRICOT_URL||'http://127.0.0.1:4180/apricot';
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const open=()=>page.locator('#open-experiment').click();
try{
 await page.goto(base+'#experiments/sampling');assert.match(await page.locator('h1').innerText(),/distribution/);await page.reload();assert.match(await page.locator('h1').innerText(),/distribution/);
 await page.locator('#next-experiment').click();assert.match(page.url(),/experiments\/drift$/);await page.goBack();assert.match(await page.locator('h1').innerText(),/distribution/);await page.goForward();assert.match(await page.locator('h1').innerText(),/Healthy servers/);
 await page.locator('#next-experiment').click();await open();await page.locator('.experiment-glossary summary').click();assert.equal(await page.locator('.experiment-glossary dt').count(),3);
 await page.locator('#pin-fit').click();const pinned=await page.locator('.pinned-fit').getAttribute('d');await page.locator('#fit-run').click();assert.equal(await page.locator('.pinned-fit').getAttribute('d'),pinned);
 const loss=await page.locator('#experiment-metrics strong').first().innerText();await page.locator('#fit-reference').check();assert.equal(await page.locator('.optimal-fit').count(),1);assert.equal(await page.locator('#experiment-metrics strong').first().innerText(),loss);
 await page.getByText('Read the numbers behind the dots',{exact:true}).click();assert.equal(await page.locator('#fit-data-table tbody tr').count(),6);
 await page.locator('#fit-outlier').check();assert.equal(await page.locator('#fit-data-table tbody tr').last().locator('td').first().innerText(),'2.00');await page.locator('#reset-experiment').click();assert.equal(await page.locator('.pinned-fit,.optimal-fit').count(),0);
 await page.locator('[data-experiment="2"]').click();await open();await page.locator('#draw-batch').click();const counts=await page.locator('.word-row small').allTextContents();
 await page.getByText('Try another sample sequence',{exact:true}).click();await page.locator('#sample-replay').click();await page.locator('#draw-batch').click();assert.deepEqual(await page.locator('.word-row small').allTextContents(),counts);
 await page.locator('#sample-new-seed').click();await page.locator('#draw-batch').click();assert.notDeepEqual(await page.locator('.word-row small').allTextContents(),counts);
 await page.getByText('Filter by probability mass instead',{exact:true}).click();await page.locator('#word-mass').fill('0.7');assert.equal(await page.locator('#experiment-metrics strong').first().innerText(),'0');assert.equal(await page.locator('.probability-strip>span').count(),2);await page.locator('#draw-batch').click();assert.equal(await page.locator('.word-row').nth(2).locator('small').innerText(),'0 drawn');
 await page.locator('[data-experiment="3"]').click();await open();assert.equal(await page.locator('#show-true-rule').isDisabled(),true);await page.locator('#reveal-outcomes').click();await page.locator('#show-true-rule').check();assert.equal(await page.locator('.optimal-fit').count(),1);
 await page.locator('#drift-shift').fill('-2');await page.locator('#drift-threshold').fill('8');await page.getByText('Look beyond accuracy',{exact:true}).click();assert.match(await page.locator('#drift-rates').innerText(),/Not defined/);
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 const animated=await browser.newPage({reducedMotion:'no-preference'});animated.on('pageerror',e=>errors.push(e.message));await animated.goto(base+'#experiments/fit');await animated.locator('#open-experiment').click();await animated.locator('#fit-run').click();await animated.locator('#fit-pause').click();const text=await animated.locator('#fit-step-count').innerText();await animated.waitForTimeout(400);assert.equal(await animated.locator('#fit-step-count').innerText(),text);assert.equal(await animated.locator('#fit-run').isDisabled(),false);await animated.close();
 assert.deepEqual(errors,[]);console.log('PASS: named routes/history, sequential navigation, glossary, pinned/reference models, raw errors, sample replay/variation, top-p, true boundary, precision/recall, mobile and training pause.');
}finally{await browser.close();}
