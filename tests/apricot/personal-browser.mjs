import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const url=process.env.APRICOT_URL||'http://127.0.0.1:4180/apricot';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(url);
 assert.equal(await page.locator('#main .primary:visible').count(),1);
 assert.equal(await page.locator('.sidebar').count(),0);
 assert.equal(await page.locator('.exploration-shelf').getAttribute('open'),null);
 await page.screenshot({path:'test-results/personal-home.png',fullPage:true});
 await page.locator('#start-basics').click();assert.equal(new URL(page.url()).hash,'#basics');
 assert.equal(await page.locator('.email-chart circle').count(),6);
 await page.locator('#ai-next').click();assert.equal(await page.locator('.centre-0').count(),1);
 await page.locator('#ai-next').click();assert.match(await page.locator('#prediction-result').innerText(),/Ordinary email/);
 for(const id of ['email-links','email-urgency']){await page.locator('#'+id).focus();await page.keyboard.press('End');}
 assert.match(await page.locator('#prediction-result').innerText(),/Spam/);
 const dot=await page.locator('#new-email').boundingBox(),chart=await page.locator('.email-chart svg').boundingBox();assert.ok(dot.y>=chart.y&&dot.x+dot.width<=chart.x+chart.width);
 await page.screenshot({path:'test-results/personal-prediction.png',fullPage:true});
 await page.locator('#ai-next').click();assert.ok(await page.locator('.language-picture').isVisible());
 await page.locator('#ai-rag').click();await page.locator('#open-map').click();
 assert.equal(await page.locator('.search-settings').getAttribute('open'),null);
 await page.locator('[data-query="luggage"]').click();assert.match(await page.locator('#ranked-results').innerText(),/Cabin bag/);
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:844});await page.goto(url);await page.reload();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Home overflow ${width}`);
  await page.locator('#start-basics').click();
  for(let i=0;i<4;i++){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Scene ${i} overflow ${width}`);if(i<3)await page.locator('#ai-next').click();}
  await page.locator('#ai-rag').click();await page.locator('#open-map').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`RAG overflow ${width}`);
 }
 await page.setViewportSize({width:390,height:844});await page.goto(url);await page.reload();await page.screenshot({path:'test-results/personal-home-mobile.png',fullPage:true});
 await page.locator('.reference-menu>summary').click();assert.ok(await page.locator('[data-page="review"]').isVisible());
 await page.keyboard.press('Escape');assert.equal(await page.locator('.reference-menu').getAttribute('open'),null);
 assert.deepEqual(errors,[]);console.log('PASS: single starting action, four AI scenes, fitted predictions, LLM-to-RAG journey, optional controls and mobile layouts.');
}finally{await browser.close();}
