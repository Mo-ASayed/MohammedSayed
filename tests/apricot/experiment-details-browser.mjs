import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const base=process.env.APRICOT_URL||'http://127.0.0.1:4180/apricot';
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function lab(i){await page.locator('[data-experiment="'+i+'"]').click();await page.locator('#open-experiment').click();}
async function widths(){for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);}await page.setViewportSize({width:1440,height:1000});}
try{
 await mkdir('test-results',{recursive:true});await page.goto(base+'#experiments');await page.locator('#open-experiment').click();
 await page.locator('#fit-run').click();assert.equal((await page.locator('.loss-trace polyline').getAttribute('points')).split(' ').length,13);
 const slope=await page.locator('#fit-slope').inputValue(),offset=await page.locator('#fit-offset').inputValue(),loss=await page.locator('#experiment-metrics strong').first().innerText();
 await page.locator('#fit-probe').fill('4');assert.equal(await page.locator('#fit-slope').inputValue(),slope);assert.equal(await page.locator('#fit-offset').inputValue(),offset);assert.equal(await page.locator('#experiment-metrics strong').first().innerText(),loss);
 assert.equal(await page.locator('.inference-probe').getAttribute('cx'),'450');
 await page.locator('#fit-outlier').check();assert.equal((await page.locator('.loss-trace polyline').getAttribute('points')).split(' ').length,1);await widths();
 await lab(1);await page.getByText('Compare all three models',{exact:true}).click();assert.equal(await page.locator('#over-comparison tbody tr').count(),3);assert.equal(await page.locator('#over-gaps').isDisabled(),true);
 await page.locator('#reveal-validation').click();await page.locator('#over-gaps').check();assert.equal(await page.locator('.validation-gap').count(),5);
 await page.locator('[data-model="memorise"]').click();assert.match(await page.locator('#over-comparison .selected-model').innerText(),/Flexible curve/);assert.match(await page.locator('#worst-validation').innerText(),/Largest validation miss/);await widths();
 await page.locator('.experiment-desk').screenshot({path:'test-results/details-validation.png'});
 await lab(2);await page.locator('#draw-batch').click();assert.equal(await page.locator('.observed-word em').count(),5);assert.match(await page.locator('.observed-word em').first().innerText(),/% observed/);
 const count=await page.locator('#experiment-metrics strong').first().innerText();await page.locator('#compare-greedy').click();assert.match(await page.locator('#greedy-result').innerText(),/Greedy choice: quiet/);assert.equal(await page.locator('#experiment-metrics strong').first().innerText(),count);
 await page.locator('#word-k').fill('1');assert.match(await page.locator('.observed-word em').first().innerText(),/No samples/);await page.locator('#draw-word').click();assert.equal(await page.locator('.observed-word em').first().innerText(),'100.0% observed');await widths();
 await lab(3);await page.getByText('Inspect the 40 requests',{exact:true}).click();assert.equal(await page.locator('.request-unknown').count(),40);
 await page.locator('[data-drift="rule"]').click();await page.locator('#drift-shift').fill('2');await page.locator('#reveal-outcomes').click();assert.ok(await page.locator('.request-fp').count()>0);
 await page.locator('.request-fp').first().focus();assert.match(await page.locator('#request-inspector').innerText(),/False alarm/);
 await page.locator('#drift-threshold').fill('8');assert.ok(await page.locator('.request-fn').count()>0);
 await page.getByText('What do these mistakes cost?',{exact:true}).click();const candidateCost=()=>page.locator('#drift-cost tbody tr').last().locator('td').last().innerText().then(Number);
 const cost=await candidateCost();await page.locator('#drift-miss-cost').fill('10');assert.equal(await candidateCost(),cost*2);await widths();
 await page.locator('.experiment-desk').screenshot({path:'test-results/details-production.png'});
 await page.locator('#reveal-outcomes').click();assert.equal(await page.locator('.request-unknown').count(),40);assert.equal(await page.locator('#drift-cost table').count(),0);
 await page.locator('#reset-experiment').click();await page.getByText('What do these mistakes cost?',{exact:true}).click();assert.equal(await page.locator('#drift-miss-cost').inputValue(),'5');
 assert.deepEqual(errors,[]);console.log('PASS: loss history, fixed-model inference, model comparison, validation gaps, observed frequencies, greedy decoding, per-request outcomes, weighted costs and mobile layouts.');
}finally{await browser.close();}
