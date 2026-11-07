// Browser checks for /ai-platform pages. Needs a running site (default http://127.0.0.1:4180):
//   npm run build && npx next start -p 4180   then   npm run test:platform:browser
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const base = process.env.SITE_URL || "http://127.0.0.1:4180";
const browser = await chromium.launch();
const errors = [];
const tile = (page, testid, label) => page.locator(`[data-testid=${testid}] div`, { hasText: label }).locator("strong").innerText().then(Number);

async function noOverflow(page, path) {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + path);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} overflows at ${width}px`);
  }
}

async function takeQuiz(page, id) {
  const quiz = page.locator(`#quiz-${id}`);
  await quiz.locator("[data-testid=quiz-start]").click();
  for (;;) {
    await quiz.locator(".pl-options button").first().click();
    assert.ok(await quiz.locator("[data-testid=quiz-feedback]").isVisible());
    const next = quiz.locator("button", { hasText: /Next question|See my score/ });
    const label = await next.innerText();
    await next.click();
    if (label.includes("See my score")) break;
  }
  assert.match(await quiz.locator("[data-testid=quiz-score]").innerText(), /^\d+ \/ 8 correct$/);
}

try {
  await mkdir("test-results", { recursive: true });
  const page = await browser.newPage({ reducedMotion: "reduce" });
  page.on("pageerror", e => errors.push(e.message));

  for (const path of ["/ai-platform", "/ai-platform/llm-gateway", "/ai-platform/gpu-inference", "/ai-platform/rag-eval"]) {
    await noOverflow(page, path);
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/ai-platform");
  assert.equal(await page.locator(".pl-card").count(), 3);
  await page.locator(".pl-card a", { hasText: "Explore and test me" }).first().click();
  await page.waitForURL(/\/ai-platform\/llm-gateway$/);

  // Gateway: default run fails over; a guardrail refusal must never fail over.
  assert.ok(await tile(page, "gateway-tiles", "Failed over") > 50);
  assert.equal(await tile(page, "gateway-tiles", "Primary calls while it was down"), 3);
  await page.locator("[data-testid=gw-filter]").click();
  assert.equal(await tile(page, "gateway-tiles", "Failed over"), 0);
  assert.ok(await tile(page, "gateway-tiles", "Blocked") > 0);
  await page.locator("#gw-inspect").fill("70");
  assert.match(await page.locator("[data-testid=gateway-inspect]").innerText(), /#70/);
  await page.locator("[data-testid=gateway-lab]").screenshot({ path: "test-results/platform-gateway.png" });
  await takeQuiz(page, "llm-gateway");

  // GPU: 8B bf16 at 8k fits 3 sequences; time-slicing packs onto fewer nodes.
  await page.goto(base + "/ai-platform/gpu-inference");
  assert.match(await page.locator("[data-testid=vram-verdict]").innerText(), /at most 3 full-length sequences/);
  await page.locator("#vr-conc").fill("4");
  assert.match(await page.locator("[data-testid=vram-verdict]").innerText(), /Does not fit/);
  const exclusiveNodes = await tile(page, "pack-tiles", "Nodes");
  await page.locator("[data-testid=mode-time-slicing]").click();
  assert.ok(await tile(page, "pack-tiles", "Nodes") < exclusiveNodes);
  assert.match(await page.locator("[data-testid=cost-knee]").innerText(), /At the knee \(4 concurrent\)/);
  await page.locator("[data-testid=cost-lab]").screenshot({ path: "test-results/platform-gpu-cost.png" });
  await takeQuiz(page, "gpu-inference");

  // RAG: floor 0.10 passes the gate, 0.08 does not; v2 champion blocks the old baseline.
  await page.goto(base + "/ai-platform/rag-eval");
  await page.locator("#sw-floor").fill("4");
  assert.match(await page.locator("[data-testid=sweep-verdict]").innerText(), /Release blocked/);
  await page.locator("#sw-floor").fill("5");
  assert.match(await page.locator("[data-testid=sweep-verdict]").innerText(), /Gate passes/);
  await page.locator("[data-testid=champion-v2]").click();
  assert.match(await page.locator("[data-testid=config-table] tr", { hasText: "baseline" }).innerText(), /blocked/);
  await page.locator("button[aria-label='Move deploy-process up']").click();
  assert.equal(await tile(page, "rank-tiles", "reciprocal rank"), 1);
  await page.locator("[data-testid=sweep-lab]").screenshot({ path: "test-results/platform-rag-sweep.png" });
  await takeQuiz(page, "rag-eval");

  // Dark theme and a phone viewport, with storage blocked.
  const dark = await browser.newPage({ viewport: { width: 390, height: 844 } });
  dark.on("pageerror", e => errors.push(e.message));
  await dark.addInitScript(() => localStorage.setItem("portfolio-theme", "dark"));
  await dark.goto(base + "/ai-platform/rag-eval");
  assert.equal(await dark.evaluate(() => document.documentElement.dataset.theme), "dark");
  assert.equal(await dark.evaluate(() => getComputedStyle(document.querySelector("main")).backgroundColor), "rgb(29, 24, 20)");
  await dark.screenshot({ path: "test-results/platform-rag-dark-mobile.png" });
  const blocked = await browser.newPage();
  blocked.on("pageerror", e => errors.push(e.message));
  await blocked.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }));
  await blocked.goto(base + "/ai-platform/llm-gateway");
  await takeQuiz(blocked, "llm-gateway");

  assert.deepEqual(errors, []);
  console.log("PASS: 4 pages x 4 widths without overflow, gateway failover/guardrail, VRAM fit, packing modes, cost knee, RAG gate sweep, champion regression, ranking metrics, 3 quizzes, dark theme, blocked storage.");
} finally {
  await browser.close();
}
