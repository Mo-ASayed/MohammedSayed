import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {click} from './navigation.mjs';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1365,height:900},reducedMotion:'reduce'});
const url=process.env.APRICOT_URL||'http://127.0.0.1:4180/apricot';
const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function tapMap(x,y){await page.locator('.quest-map').scrollIntoViewIfNeeded();const box=await page.locator('.quest-map').boundingBox();await page.mouse.click(box.x+box.width*x/100,box.y+box.height*y/100);}
try{
 await mkdir('test-results',{recursive:true});
 await page.goto(url+'#rag');await page.locator('#open-map').click();
 await page.locator('#quest-hint').click();assert.match(await page.locator('#quest-nudge').innerText(),/passage 1/);
 await page.locator('#quest-hint').click();assert.match(await page.locator('#quest-nudge').innerText(),/Shrink/);
 await page.locator('[data-source="1"]').focus();assert.match(await page.locator('#quest-inspect').innerText(),/overhead locker/);
 await tapMap(15,15);assert.equal(Math.round(parseFloat(await page.locator('#quest-query').evaluate(e=>e.style.left))),15);
 await page.locator('#quest-undo').click();assert.equal(await page.locator('#quest-query').evaluate(e=>e.style.left),'20%');
 await click(page,'#pin-setup');await page.locator('#quest-reach').fill('12');assert.ok(await page.locator('#setup-comparison tr.changed').count()>0);
 await tapMap(20,30);await page.locator('#quest-check').click();assert.match(await page.locator('#quest-status').innerText(),/Solved/);
 await page.locator('#quest-next').click();await tapMap(20,30);await page.locator('#quest-reach').fill('12');await page.locator('#quest-filter').check();await page.locator('#quest-check').click();await page.locator('#quest-next').click();
 await page.locator('#quest-budget').fill('6');await page.locator('#quest-check').click();assert.match(await page.locator('#quest-status').innerText(),/two-unit/);
 await page.locator('#quest-undo').click();assert.equal(await page.locator('#quest-budget').inputValue(),'2');
 await tapMap(83,55);await page.locator('#quest-reach').fill('8');await page.locator('#quest-check').click();assert.match(await page.locator('#quest-status').innerText(),/Solved/);
 await page.reload();await page.locator('#open-map').click();assert.equal(await page.locator('#quest-layer').inputValue(),'2');
 await page.locator('#quest-layer').selectOption('0');assert.match(await page.locator('.map-quest h2').innerText(),/neighbourhood/);
 await click(page,'#chunk-test');assert.match(await page.locator('#chunk-feedback').innerText(),/lost part/);
 await page.locator('#chunk-cut').fill('6');await page.locator('#chunk-test').click();assert.match(await page.locator('#chunk-feedback').innerText(),/too large/);
 await page.locator('#chunk-cut').fill('5');await page.locator('#chunk-test').click();assert.match(await page.locator('#chunk-feedback').innerText(),/Solved/);
 await page.screenshot({path:'test-results/chunk-bench-desktop.png',fullPage:true});
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'chunk overflow '+width);}
 await page.goto(url+'#basics');await page.reload();await page.locator('#ai-next').click();await page.locator('#ai-next').click();
 await click(page,'#inbox-test');assert.match(await page.locator('#inbox-feedback').innerText(),/Some spam/);
 await page.locator('#inbox-threshold').fill('-3.5');await page.locator('#inbox-test').click();assert.match(await page.locator('#inbox-feedback').innerText(),/Solved/);
 assert.equal(await page.locator('.wrong-case').count(),1);
 await page.screenshot({path:'test-results/inbox-bench.png',fullPage:true});
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'inbox overflow '+width);}
 await page.locator('#ai-next').click();await page.locator('#meeting-day').fill('0');assert.equal(await page.locator('#source-day').innerText(),'Monday');
 for(let i=0;i<7;i++)await page.locator('#token-next').click();assert.match(await page.locator('#token-output').innerText(),/Monday/);
 await page.locator('#meeting-day').fill('2');assert.equal(await page.locator('.generated-piece').count(),0);
 await click(page,'[data-page="notebook"]');await page.locator('#reset-progress').click();await page.locator('#confirm-reset').click();assert.equal(await page.evaluate(()=>localStorage.getItem('apricot-expedition-v1')),null);
 const blocked=await browser.newPage();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});});await blocked.goto(url+'#rag');await blocked.locator('#open-map').click();assert.match(await blocked.locator('#quest-save-note').innerText(),/unavailable/);await blocked.close();
 const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await touch.goto(url+'#rag');await touch.locator('#open-map').tap();await touch.locator('.quest-map').scrollIntoViewIfNeeded();const box=await touch.locator('.quest-map').boundingBox();await touch.touchscreen.tap(box.x+box.width*.15,box.y+box.height*.85);assert.ok(Math.abs(parseFloat(await touch.locator('#quest-query').evaluate(e=>e.style.left))-15)<1);await touch.close();
 assert.deepEqual(errors,[]);console.log('PASS: hints, source inspection, tap movement, undo, comparisons, capacity, saved layers, chunk puzzle, evaluation, changed context, mobile and blocked storage.');
}finally{await browser.close();}
