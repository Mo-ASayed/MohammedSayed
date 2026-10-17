import {click,savedXP} from './navigation.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const url=process.env.APRICOT_URL||'http://127.0.0.1:4180/apricot';
try{
 await page.goto(url);await click(page,'[data-page="review"]');assert.equal(await page.locator('#begin-review').isDisabled(),true);
 await page.locator('#first-lesson').click();await page.locator('#next').click();await page.reload();await click(page,'#resume-session');assert.equal(await page.locator('.lesson-article h2').innerText(),'Predict a label, a number, or generate content');
 for(let i=0;i<3;i++)await page.locator('#next').click();
 await click(page,'[data-page="review"]');assert.match(await page.locator('.review-stats').innerText(),/4/);await page.locator('#begin-review').click();
 assert.equal(await page.locator('#reveal-answer').isDisabled(),true);
 await page.locator('#review-answer').fill('The model learns a mapping from examples. <img src=x onerror=alert(1)>');await page.locator('#reveal-answer').click();await page.locator('[data-rating="good"]').click();
 await page.locator('#forgot-answer').click();assert.equal(await page.locator('[data-rating="good"]').isDisabled(),true);assert.equal(await page.locator('[data-rating="hard"]').isDisabled(),true);await page.locator('[data-rating="again"]').click();
 await page.locator('#review-answer').fill('Measure a baseline and the business cost of each error.');await page.locator('#reveal-answer').click();await page.locator('[data-rating="good"]').click();
 await page.locator('#review-answer').fill('95');await page.locator('#reveal-answer').click();assert.match(await page.locator('#review-feedback').innerText(),/Check the calculation/);assert.equal(await page.locator('[data-rating="good"]').isDisabled(),true);
 await page.screenshot({path:'test-results/review-calculation.png',fullPage:true});await page.locator('[data-rating="again"]').click();
 assert.match(await page.locator('.review-finish').innerText(),/4 prompts/);await page.locator('#review-overview').click();assert.equal(await page.locator('.mistake-journal details').count(),2);
 await page.reload();await click(page,'[data-page="review"]');assert.equal(await page.locator('.mistake-journal details').count(),2);assert.equal(await page.locator('.review-stats strong').first().innerText(),'0');
 await page.screenshot({path:'test-results/review-overview.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#begin-review').click();await page.locator('#review-answer').fill('A useful explanation.');await page.locator('#reveal-answer').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'test-results/review-mobile.png',fullPage:true});
 await click(page,'[data-page="home"]',true);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await click(page,'.mission-card',true);await page.locator('#learn-tab').click();await page.locator('.diagram-stage').first().click();assert.match(await page.locator('.diagram-explanation').innerText(),/measurements/);
 await click(page,'[data-page="notebook"]');await page.locator('#reset-progress').click();await page.locator('#confirm-reset').click();await click(page,'[data-page="review"]');assert.equal(await page.locator('#begin-review').isDisabled(),true);assert.equal(await page.locator('.mistake-journal details').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: review unlocks, exact-step resume, recall, calculations, ratings, scheduling, persistence, reset, interactive diagrams, mobile.');
}finally{await browser.close();}
