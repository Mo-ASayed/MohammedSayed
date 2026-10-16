import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.APRICOT_URL||'http://127.0.0.1:4180/apricot';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await mkdir('test-results',{recursive:true});
 await page.goto(base);await page.locator('#start-rag-studio').click();
 assert.equal(new URL(page.url()).hash,'#rag');
 assert.ok(await page.locator('[data-stage="2"]').isDisabled());
 await page.locator('[data-pipe="5"]').click();assert.ok((await page.locator('.pipeline-detail').innerText()).includes('Check that its claims'));
 await page.screenshot({path:'test-results/rag-overview.png',fullPage:true});
 await page.locator('#open-map').click();await page.locator('[data-query="luggage"]').click();
 assert.ok((await page.locator('#ranked-results').innerText()).includes('Cabin bag allowance'));
 await page.locator('#search-method').selectOption('keyword');assert.ok(await page.locator('.no-evidence').isVisible());
 await page.locator('#search-method').selectOption('vector');await page.locator('#vector-query').fill('flight baggage');await page.locator('#vector-query').press('Enter');
 await page.locator('#current-only').uncheck();assert.ok((await page.locator('#ranked-results').innerText()).includes('Old cabin bag policy'));
 await page.locator('[data-doc="7"]').click();assert.ok((await page.locator('#document-inspector').innerText()).includes('OUTDATED'));
 await page.screenshot({path:'test-results/rag-map.png',fullPage:true});
 await page.locator('#vector-query').fill('<img src=x onerror=alert(1)>');await page.locator('#vector-query').press('Enter');assert.equal(await page.locator('#ranked-results img').count(),0);
 await page.locator('#open-missions').click();await page.locator('[data-evidence="7"]').click();await page.locator('#check-context').click();assert.ok(await page.locator('.retry').isVisible());
 await page.locator('[data-evidence="7"]').click();await page.locator('[data-evidence="1"]').click();await page.locator('#check-context').click();assert.ok((await page.locator('.success blockquote').innerText()).includes('8 kg'));
 await page.locator('#next-request').click();await page.locator('[data-evidence="5"]').click();await page.locator('#check-context').click();await page.locator('#next-request').click();
 await page.locator('#no-answer').click();assert.equal(await page.locator('.passport-stamps .stamped').count(),3);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('apricot-rag-studio-v1'))),[0,1,2]);
 await page.screenshot({path:'test-results/rag-stamps.png',fullPage:true});
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:844});await page.goto(base+'#rag');await page.reload();await page.locator('#open-map').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Map overflow at ${width}`);
  await page.locator('#open-missions').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Game overflow at ${width}`);
  assert.equal(await page.locator('.passport-stamps .stamped').count(),3);
 }
 await page.screenshot({path:'test-results/rag-mobile.png',fullPage:true});
 await page.locator('[data-page="notebook"]').click();await page.locator('#reset-progress').click();await page.locator('#confirm-reset').click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('apricot-rag-studio-v1')),null);
 assert.deepEqual(errors,[]);console.log('PASS: RAG overview, vector/keyword retrieval, stale filtering, inspection, all3 missions, persistence, escaping and responsive layouts.');
} finally {await browser.close();}
