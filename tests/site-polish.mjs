import {click,savedXP} from './apricot/navigation.mjs';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.SITE_URL || 'http://127.0.0.1:4180';
const browser = await chromium.launch();
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await mkdir('test-results', { recursive: true });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Homepage overflow at ${width}`);
    assert.match(await page.locator('h1').innerText(), /Mohammed Sayed/);
    const preview = page.locator('.apricot-preview img');
    await preview.scrollIntoViewIfNeeded();
    await preview.evaluate(img => img.decode());
    assert.ok(await preview.evaluate(img => img.naturalWidth > 0), 'Apricot preview failed to load');
    const roleDetails = page.locator('.experience-more').first();
    await roleDetails.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await roleDetails.getAttribute('open'), '');
    assert.ok(await roleDetails.locator('li').first().isVisible());
    await page.goto(base);
    const links = await page.locator('.hero-links').boundingBox();
    const strip = await page.locator('.signal-strip').boundingBox();
    assert.ok(links.y + links.height <= strip.y, `Hero actions overlap stats at ${width}`);
    for (const selector of ['.story-copy', '.hero-actions', '.experience-details', '.contact-copy']) {
      for (const box of await page.locator(selector).evaluateAll(nodes => nodes.map(n => ({ left: n.getBoundingClientRect().left, right: n.getBoundingClientRect().right })))) {
        assert.ok(box.left >= -1 && box.right <= width + 1, `${selector} clips at ${width}`);
      }
    }
    if (width <= 760) {
      await page.locator('.mobile-navigation summary').click();
      for (const text of ['About', 'Projects', 'Experience', 'Contact', 'Learn']) {
        assert.ok(await page.locator('.mobile-navigation nav').getByRole('link', { name: text, exact: true }).isVisible());
      }
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.mobile-navigation').getAttribute('open'), null);
      await page.locator('.mobile-navigation summary').click();
      await page.locator('.mobile-navigation nav').getByRole('link', { name: 'Contact', exact: true }).click();
      assert.equal(await page.locator('.mobile-navigation').getAttribute('open'), null);
    }
    await page.goto(base + '/projects');
    assert.equal(await page.locator('.project-card').count(), 4);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://mohammedsayed.com/projects');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError'); }; });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.screenshot({ path: 'test-results/polish-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.screenshot({ path: 'test-results/polish-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 1366, height: 600 });
  await page.goto(base + '/apricot');
  await page.locator('.portfolio-return').scrollIntoViewIfNeeded();
  const back = await page.locator('.portfolio-return').boundingBox();
  assert.ok(back.y >= 0 && back.y + back.height <= 600, 'Sidebar return link is unreachable');
  await click(page,'.mission-card',true);
  await page.locator('#next').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement?.id === 'main');
  assert.equal(await page.locator('#learn-tab').getAttribute('aria-current'), 'true');
  assert.equal(await page.getByRole('tab').count(), 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.screenshot({ path: 'test-results/polish-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS: identity, preview image, keyboard role disclosures, hero geometry, responsive layouts, mobile menu, project routes, themes, blocked storage and keyboard focus.');
} finally {
  await browser.close();
}
