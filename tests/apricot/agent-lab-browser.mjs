import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';

const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:900}});
const base=process.env.APRICOT_URL||'http://127.0.0.1:4180/apricot';
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(base+'#agents');
 assert.match(await page.locator('h1').innerText(),/Give the model a job/);
 await page.locator('[data-tool="page"]').click();
 assert.match(await page.locator('.agent-feedback').innerText(),/Blocked/);
 await page.locator('[data-tool="status"]').click();
 await page.locator('[data-tool="runbook"]').click();
 await page.locator('#backlog').check();await page.locator('#approved').check();
 await page.locator('[data-tool="page"]').click();
 assert.match(await page.locator('.agent-update').innerText(),/paged/);
 await page.getByText('Working memory',{exact:true}).click();
 assert.equal(await page.locator('.agent-memory>div').count(),2);
 for(const width of [390,768]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 assert.deepEqual(errors,[]);console.log('PASS: agent route, blocked tool, evidence, approval, trace, memory and mobile.');
}finally{await browser.close();}
