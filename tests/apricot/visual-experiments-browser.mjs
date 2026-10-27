import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const base=process.env.APRICOT_URL||'http://127.0.0.1:4180/apricot';
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function open(i){await page.locator('[data-experiment="'+i+'"]').click();assert.equal(await page.locator('#experiment-controls').count(),0);await page.locator('#open-experiment').click();}
async function mobile(){for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);}await page.setViewportSize({width:1440,height:1000});}
try{
 await mkdir('test-results',{recursive:true});await page.goto(base);
 await page.locator('[data-experiment-start="0"]').click();assert.match(page.url(),/#experiments$/);
 assert.equal(await page.locator('#experiment-controls').count(),0);await page.locator('#open-experiment').click();
 const loss=()=>page.locator('#experiment-metrics strong').first().innerText().then(Number);
 const initial=await loss();await page.locator('#fit-run').click();assert.ok(await loss()<initial);
 await page.locator('#fit-slope').fill('7');await page.locator('#fit-offset').fill('1');await page.locator('#check-experiment').click();assert.match(await page.locator('#experiment-feedback').innerText(),/Solved/);
 const clean=await loss();await page.locator('#fit-outlier').check();assert.ok(await loss()>clean);assert.equal(await page.locator('#fit-slope').inputValue(),'7');
 await page.locator('#fit-step').click();assert.notEqual(await page.locator('#fit-slope').inputValue(),'7');await mobile();
 await page.locator('#reset-experiment').click();assert.equal(await page.locator('#fit-outlier').isChecked(),false);assert.equal(await page.locator('#fit-slope').inputValue(),'1');
 await page.locator('.experiment-desk').screenshot({path:'test-results/visual-fitting.png'});
 await open(1);await page.locator('[data-model="memorise"]').click();assert.match(await page.locator('#experiment-metrics').innerText(),/Reveal to see/);
 await page.locator('#reveal-validation').click();const curve=Number(await page.locator('#experiment-metrics strong').nth(1).innerText());await page.locator('[data-model="line"]').click();assert.ok(Number(await page.locator('#experiment-metrics strong').nth(1).innerText())<curve);
 await page.locator('#check-experiment').click();assert.match(await page.locator('#experiment-feedback').innerText(),/Solved/);assert.equal(await page.locator('.validation-point').count(),5);await mobile();
 await page.locator('.experiment-desk').screenshot({path:'test-results/visual-overfit.png'});
 await open(2);await page.locator('#word-temperature').fill('2');await page.locator('#word-k').fill('2');await page.locator('#draw-batch').click();
 assert.equal(await page.locator('#experiment-metrics strong').first().innerText(),'200');assert.equal(await page.locator('.probability-strip>span').count(),2);
 for(const i of [2,3,4])assert.equal(await page.locator('.word-row').nth(i).locator('small').innerText(),'0 drawn');
 await page.locator('#check-experiment').click();assert.match(await page.locator('#experiment-feedback').innerText(),/Solved/);await mobile();
 await page.locator('.experiment-desk').screenshot({path:'test-results/visual-sampling.png'});
 await page.locator('#word-k').fill('1');assert.equal(await page.locator('#experiment-metrics strong').first().innerText(),'0');await page.locator('#draw-word').click();assert.equal(await page.locator('.word-prompt mark').innerText(),'quiet');
 await open(3);await page.locator('#drift-shift').fill('2');assert.match(await page.locator('#experiment-metrics').innerText(),/Shift detected/);assert.match(await page.locator('#experiment-metrics').innerText(),/Labels needed/);
 await page.locator('#reveal-outcomes').click();assert.equal(await page.locator('#experiment-metrics strong').nth(1).innerText(),'100%');
 await page.locator('[data-drift="rule"]').click();assert.equal(await page.locator('#experiment-metrics strong').first().innerText(),'Unchanged');assert.notEqual(await page.locator('#experiment-metrics strong').nth(1).innerText(),'100%');
 await page.locator('#drift-threshold').fill('7');assert.equal(await page.locator('#experiment-metrics strong').nth(2).innerText(),'100%');await page.locator('#check-experiment').click();assert.match(await page.locator('#experiment-feedback').innerText(),/Solved/);await mobile();
 await page.locator('.experiment-desk').screenshot({path:'test-results/visual-drift.png'});
 await page.reload();assert.equal(await page.locator('#open-experiment').count(),1);
 await page.goto(base);await page.locator('[data-experiment-start="3"]').click();assert.match(await page.locator('h1').innerText(),/Healthy servers/);
 const blocked=await browser.newPage();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}}));await blocked.goto(base+'#experiments');await blocked.locator('#open-experiment').click();await blocked.locator('#fit-step').click();await blocked.close();
 const animated=await browser.newPage({reducedMotion:'no-preference'});animated.on('pageerror',e=>errors.push(e.message));await animated.goto(base+'#experiments');await animated.locator('#open-experiment').click();await animated.locator('#fit-run').click();await animated.waitForFunction(()=>document.querySelector('#fit-step-count')?.textContent.startsWith('12 training steps'));
 assert.equal(await animated.locator('#fit-run').isDisabled(),false);await animated.locator('#fit-run').click();await animated.locator('[data-experiment="2"]').click();await animated.locator('#open-experiment').click();await animated.locator('#word-k').focus();await animated.keyboard.press('ArrowLeft');assert.equal(await animated.locator('#word-k').inputValue(),'4');await animated.close();
 assert.deepEqual(errors,[]);console.log('PASS: learning before controls, all four experiments, actual training, outlier response, validation, probabilities/samples, drift/quality, resets, mobile, routes and blocked storage.');
}finally{await browser.close();}
