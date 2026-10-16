import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const base=process.env.SITE_URL||'http://127.0.0.1:4180';
const browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await mkdir('test-results',{recursive:true});
 await page.goto(base);assert.ok(await page.locator('#hero-title').isVisible());
 await page.locator('.top-nav a[href="/apricot"]').click();
 assert.equal(new URL(page.url()).pathname,'/apricot');
 await page.locator('.mission-card').first().waitFor();
 const copy=await page.locator('body').innerText();assert.ok(!copy.includes('DevOps → AI engineering'));assert.ok(!copy.includes('You know the cloud'));assert.equal(await page.locator('.avatar').count(),0);
 for(const path of ['/apricot/','/apricot/index.html','/apricot']){const r=await page.goto(base+path);assert.equal(r.status(),200);await page.locator('.mission-card').first().waitFor();await page.reload();await page.locator('.mission-card').first().waitFor();}
 await page.screenshot({path:'test-results/apricot-public-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/apricot-public-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Two visitors receive isolated browser progress, without an account or cookie.
 await page.locator('.mission-card').first().click();await page.locator('#next').click();
 const second=await browser.newContext();const visitor=await second.newPage();await visitor.goto(base+'/apricot');await visitor.locator('.mission-card').first().click();assert.equal(await visitor.locator('#lab-tab').isDisabled(),true);assert.equal(await visitor.evaluate(()=>JSON.parse(localStorage.getItem('apricot-workshop-v1')).read[0]||0),0);await second.close();
 await page.goto(base);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS: portfolio navigation, clean URLs, refreshes, scoped assets, neutral copy, mobile layout, visitor isolation.');
}finally{await browser.close();}
