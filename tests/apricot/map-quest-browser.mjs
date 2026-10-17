import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url=process.env.APRICOT_URL||'http://127.0.0.1:4180/apricot';
async function drag(selector,x,y){
 await page.locator('.quest-map').scrollIntoViewIfNeeded();
 const map=await page.locator('.quest-map').boundingBox(),b=await page.locator(selector).boundingBox();
 await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(map.x+map.width*x/100,map.y+map.height*y/100,{steps:12});await page.mouse.up();
}
async function reach(n){await page.locator('#quest-reach').fill(String(n));}
try{
 await mkdir('test-results',{recursive:true});await page.goto(url+'#rag');await page.locator('#open-map').click();
 assert.equal(await page.locator('.original-search').getAttribute('open'),null);
 await page.locator('#quest-check').click();assert.equal(await page.locator('#quest-next').isVisible(),false);
 await drag('#quest-query',24,26);await reach(12);await page.locator('#quest-check').click();assert.match(await page.locator('#quest-status').innerText(),/Solved/);
 await page.locator('#quest-next').click();await drag('#quest-query',24,26);await reach(12);
 assert.match(await page.locator('#quest-answer').innerText(),/Conflicting/);
 await page.locator('#quest-check').click();assert.match(await page.locator('#quest-status').innerText(),/old 12/);
 await page.locator('#quest-filter').check();assert.match(await page.locator('#quest-answer').innerText(),/8 kg/);
 await page.locator('#quest-check').click();assert.match(await page.locator('#quest-status').innerText(),/Solved/);
 await page.screenshot({path:'test-results/map-quest-filter.png',fullPage:true});
 await page.locator('#quest-next').click();await drag('#quest-query',78,51);await reach(8);
 await page.locator('#quest-check').click();assert.match(await page.locator('#quest-status').innerText(),/Solved/);assert.match(await page.locator('#quest-answer').innerText(),/48 hours/);
 await drag('[data-source="5"]',10,85);assert.match(await page.locator('#quest-answer').innerText(),/do not answer/);assert.equal(await page.locator('#quest-next').isVisible(),false);
 await page.locator('#quest-reset').click();assert.equal(await page.locator('#quest-query').evaluate(e=>e.style.left),'50%');
 await page.locator('#quest-query').focus();await page.keyboard.press('Shift+ArrowRight');assert.equal(await page.locator('#quest-query').evaluate(e=>e.style.left),'55%');
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);}
 await page.screenshot({path:'test-results/map-quest-mobile.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS: map dragging, all layers, freshness, context budget, document movement, reset, keyboard and mobile.');
}finally{await browser.close();}
