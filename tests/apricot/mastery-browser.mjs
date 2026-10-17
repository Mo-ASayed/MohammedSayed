import {click,savedXP} from './navigation.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
async function slider(id,value){await page.locator(id).evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input',{bubbles:true}));},value);}
try{
 await page.goto((process.env.APRICOT_URL || 'http://127.0.0.1:4180/apricot'));
 // Existing users retain badges and notes; completed labs unlock the new field challenges.
 await page.evaluate(()=>localStorage.setItem('apricot-workshop-v1',JSON.stringify({read:{0:4,1:4,2:4,3:4,4:4,5:4},wins:[0,1,2,3,4,5],notes:{0:'Existing notebook'},last:0})));
 await page.reload();
 for(let i=0;i<6;i++){
  await click(page,`.mini-lessons [data-lesson="${i}"]`);await page.locator('#lab-tab').click();await page.locator('#start-mastery').click();
  for(let r=0;r<2;r++){
   if(i===0){
    const target=r===0?['Collect','Validate','Calculate','Apply','Page']:['Receive','Retrieve','Assemble','Generate','Check'];
    for(let pos=0;pos<target.length;pos++){
     let items=await page.locator('.pipeline-builder li strong').allTextContents();let at=items.findIndex(x=>x.startsWith(target[pos]));
     while(at>pos){await page.locator(`[data-up="${at}"]`).click();at--;}
    }
    await page.locator('#run-order').click();
   }else if(i===1){for(const [card,bin] of ['train','train','validation','test','quarantine','quarantine'].entries()){await page.locator(`[data-card="${card}"]`).click();await page.locator(`[data-bin="${bin}"]`).click();}await page.locator('#check-split').click();
   }else if(i===2){await slider('#fit-slope',r===0?20:35);await slider('#fit-intercept',r===0?30:50);await page.locator('#submit-fit').click();
   }else if(i===3){await slider('#wave-threshold',r===0?.5:.35);await page.locator('#submit-wave').click();
   }else if(i===4){await slider('#chunk-size',r===0?7:6);await page.locator('#submit-chunks').click();
   }else if(r===0){for(const id of ['model','data','config','eval','rollback'])await page.locator(`[data-pack="${id}"]`).click();await page.locator('#ship').click();
   }else{for(const id of ['shadow','inspect','canary'])await page.locator(`[data-action="${id}"]`).click();await page.locator('#launch').click();}
   assert.match(await page.locator('#round-feedback').innerText(),/Round cleared/);
   if(i===4&&r===0){await page.screenshot({path:'test-results/chunks-desktop.png',fullPage:true});}
   if(r===0)await page.locator('.next-round').click();
  }
  assert.match(await page.locator('.medal-stars').innerText(),/★★★/);
 }
 await page.reload();assert.equal(await savedXP(page),1500);
 await click(page,'[data-page="notebook"]');assert.equal(await page.locator('#note-0').inputValue(),'Existing notebook');assert.equal(await page.locator('.notebook-stars').count(),6);
 // A lower replay result cannot overwrite a previous best medal or award XP twice.
 await click(page,'.mini-lessons [data-lesson="2"]');await page.locator('#lab-tab').click();await page.locator('#start-mastery').click();await page.locator('#submit-fit').click();assert.match(await page.locator('#round-feedback').innerText(),/Try another/);
 await slider('#fit-slope',20);await slider('#fit-intercept',30);await page.locator('#submit-fit').click();await page.locator('.next-round').click();await slider('#fit-slope',35);await slider('#fit-intercept',50);await page.locator('#submit-fit').click();assert.match(await page.locator('.medal-stars').innerText(),/★★☆/);assert.equal(await savedXP(page),1500);
 await page.setViewportSize({width:390,height:844});
 for(let i=0;i<6;i++){
  await click(page,'[data-page="home"]',true);await click(page,`.mission-card[data-lesson="${i}"]`);await page.locator('#lab-tab').click();await page.locator('#start-mastery').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Mastery ${i} mobile overflow`);
 }
 await click(page,'[data-page="home"]',true);await click(page,'.mission-card',true);await page.locator('#learn-tab').click();
 await page.screenshot({path:'test-results/reading-mobile-v2.png',fullPage:true});
 assert.equal(await page.locator('.understanding').count(),1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.setViewportSize({width:1440,height:1100});await page.screenshot({path:'test-results/reading-desktop-v2.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: 12 new rounds, three-star results, replay best-score retention, XP idempotence, old notes, mobile layouts and reading blocks.');
}finally{await browser.close();}
