import {click,savedXP} from './navigation.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
const page=await context.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));
await mkdir('test-results',{recursive:true});
try{
 await page.goto((process.env.APRICOT_URL || 'http://127.0.0.1:4180/apricot'));
 await page.screenshot({path:'test-results/dashboard-desktop.png',fullPage:true});
 assert.equal(await page.locator('.mission-card').count(),6);
 for(let i=0;i<6;i++){
  await click(page,`.mini-lessons [data-lesson="${i}"]`);
  assert.equal(await page.locator('#lab-tab').isDisabled(),true);
  for(let s=0;s<4;s++)await page.locator('#next').click();
  assert.equal(await page.locator('#lab-tab').isDisabled(),false);
  if(i===0){
   await page.locator('#review').click();assert.match(await page.locator('#feedback').innerText(),/Allocate/);
   for(const [j,value] of ['rules','ml','gen','ml'].entries()) await page.locator(`#route${j}`).selectOption(value);
   await page.locator('#review').click();
  }else if(i===1){for(const n of [1,3,4])await page.locator(`.audit-card input[value="${n}"]`).check();await page.locator('#audit').click();
  }else if(i===2){await page.locator('#model').selectOption('memoriser');await page.locator('#submit').click();assert.equal(await page.locator('.award').count(),0);await page.locator('#model').selectOption('line');await page.locator('#submit').click();
  }else if(i===3){await page.locator('#deploy').click();assert.match(await page.locator('#feedback').innerText(),/Hold/);await page.locator('#threshold').focus();await page.keyboard.press('Home');for(let n=0;n<50;n++)await page.keyboard.press('ArrowRight');await page.locator('#deploy').click();await page.screenshot({path:'test-results/metrics-desktop.png',fullPage:true});
  }else if(i===4){await page.locator('input[value="current"]').check();await page.locator('#generate').click();assert.equal(await page.locator('.award').count(),0);await page.locator('input[value="policy"]').check();await page.locator('#generate').click();
  }else{for(const detail of await page.locator('.evidence-grid details').all()){await detail.locator('summary').click();}await page.waitForFunction(()=>document.querySelector('#evidence-count').textContent.startsWith('4/4'));await page.locator('input[value="rollback"]').check();await page.locator('input[value="gate"]').check();await page.locator('#recover').click();}
  await page.locator('#reflect').click();
  await page.locator('#note').fill(`Mission ${i+1}: My own explanation <script>alert(1)</script>`);
  await page.locator('.recall summary').first().click();
 }
 await page.reload();assert.equal(await savedXP(page),600);
 await click(page,'[data-page="notebook"]');
 assert.equal(await page.locator('.badge-shelf .earned').count(),6);
 assert.match(await page.locator('#note-0').inputValue(),/My own explanation/);
 const download=page.waitForEvent('download');await page.locator('#export').click();assert.equal((await download).suggestedFilename(),'apricot-field-notes.md');
 await page.locator('#reset-progress').click();await page.locator('#cancel-reset').click();assert.equal(await page.locator('.badge-shelf .earned').count(),6);
 await click(page,'[data-page="careers"]');assert.equal(await page.locator('.job-card').count(),5);
 await page.setViewportSize({width:390,height:844});await click(page,'[data-page="home"]',true);
 await page.screenshot({path:'test-results/dashboard-mobile.png',fullPage:true});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile dashboard overflow');
 for(let i=0;i<6;i++){
  await click(page,`.mission-card[data-lesson="${i}"]`);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Lesson ${i} mobile overflow`);
  await page.locator('#lab-tab').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Game ${i} mobile overflow`);
  await click(page,'[data-page="home"]',true);
 }
 await click(page,'.mission-card',true);await page.screenshot({path:'test-results/lesson-mobile.png',fullPage:true});
 await click(page,'[data-page="notebook"]');await page.locator('#reset-progress').click();await page.locator('#confirm-reset').click();
 assert.equal(await savedXP(page),0);
 await click(page,'.mission-card',true);assert.equal(await page.locator('#lab-tab').isDisabled(),true);
 await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>document.activeElement!==document.body));
 assert.deepEqual(errors,[]);console.log('PASS: six lesson gates, six challenges, failure feedback, notes, persistence, export, reset, mobile overflow, keyboard focus and console errors.');
}finally{await browser.close();}

