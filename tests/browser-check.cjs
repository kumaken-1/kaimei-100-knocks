const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const SCREENSHOTS = path.join(ROOT, "tmp", "screenshots");
const PORT = 8765;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const server = http.createServer((request, response) => {
  const requestPath = request.url === "/" ? "/index.html" : request.url.split("?")[0];
  const filePath = path.join(ROOT, decodeURIComponent(requestPath));

  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
    response.writeHead(404).end("Not found");
    return;
  }

  response.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(response);
});

async function run() {
  fs.mkdirSync(SCREENSHOTS, { recursive: true });
  await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  });

  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await desktop.goto(`http://127.0.0.1:${PORT}/index.html`);
    await desktop.waitForLoadState("networkidle");
    await desktop.screenshot({ path: path.join(SCREENSHOTS, "desktop-home.png"), fullPage: true });

    assert.match(await desktop.locator("#home-title").innerText(), /子どもの事実から/);
    assert.equal(await desktop.locator("#home-view").isVisible(), true);

    await desktop.locator("#continue-button").click();
    await desktop.locator("#question-view").waitFor({ state: "visible" });
    assert.equal(await desktop.locator("#question-number").innerText(), "KNOCK 01");

    await desktop.locator("#answer-form button[type='submit']").click();
    assert.match(await desktop.locator("#form-message").innerText(), /1つ選んでください/);

    await desktop.locator(".choice-option").first().locator("label").click();
    assert.equal(await desktop.locator("#thought-note").count(), 0);
    await desktop.locator("#answer-form button[type='submit']").click();
    await desktop.locator("#reflection-panel").waitFor({ state: "visible" });
    await desktop.locator("#reflection-panel").evaluate((panel) =>
      Promise.all(panel.getAnimations().map((animation) => animation.finished)),
    );
    assert.match(await desktop.locator("#choice-feedback-value").innerText(), /見通し|時間配分/);
    assert.equal(await desktop.locator("#deep-dive-block").getAttribute("open"), null);
    await desktop.locator(".choice-option").nth(1).locator("label").click();
    await desktop.locator("#answer-form button[type='submit']").click();
    assert.match(await desktop.locator("#choice-feedback-value").innerText(), /子ども|考え|変化/);
    await desktop.locator("#deep-dive-block > summary").click();
    assert.notEqual(await desktop.locator("#deep-dive-block").getAttribute("open"), null);
    assert.equal(await desktop.locator("#question-progress-text").innerText(), "1 / 100");
    await desktop.screenshot({ path: path.join(SCREENSHOTS, "desktop-reflection.png"), fullPage: true });

    const stored = JSON.parse(await desktop.evaluate(() => localStorage.getItem("kaimei-100-knocks-state-v1")));
    assert.deepEqual(stored.completed, ["knock-001"]);

    await desktop.locator("#next-button").click();
    assert.equal(await desktop.locator("#question-number").innerText(), "KNOCK 02");

    await desktop.locator("#list-nav").click();
    await desktop.locator("#list-view").waitFor({ state: "visible" });
    assert.equal(await desktop.locator("#question-list > li").count(), 10);
    assert.match(
      await desktop.locator("#question-list > li").first().locator(".list-status").innerText(),
      /立ち止まった/,
    );
    await desktop.screenshot({ path: path.join(SCREENSHOTS, "desktop-list.png"), fullPage: true });

    await desktop.locator("#list-group-filter").selectOption("group-10");
    assert.equal(await desktop.locator("#question-list > li").count(), 10);
    await desktop.locator("#question-list > li").last().locator("button").click();
    assert.equal(await desktop.locator("#question-number").innerText(), "KNOCK 100");
    assert.equal(await desktop.locator(".choice-option").count(), 3);

    await desktop.locator("#list-nav").click();

    await desktop.locator("#random-list-button").click();
    await desktop.locator("#question-view").waitFor({ state: "visible" });

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`http://127.0.0.1:${PORT}/index.html`);
    await mobile.waitForLoadState("networkidle");
    await mobile.screenshot({ path: path.join(SCREENSHOTS, "mobile-home.png"), fullPage: true });
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);

    await mobile.locator("#continue-button").click();
    await mobile.locator("#question-view").waitFor({ state: "visible" });
    await mobile.screenshot({ path: path.join(SCREENSHOTS, "mobile-question.png"), fullPage: true });
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);

    await mobile.locator(".choice-option").first().locator("label").click();
    await mobile.locator("#answer-form button[type='submit']").click();
    await mobile.locator("#reflection-panel").waitFor({ state: "visible" });
    await mobile.locator("#reflection-panel").evaluate((panel) =>
      Promise.all(panel.getAnimations().map((animation) => animation.finished)),
    );
    assert.equal(await mobile.locator("#deep-dive-block").getAttribute("open"), null);
    const summaryBox = await mobile.locator("#deep-dive-block > summary").boundingBox();
    assert.ok(summaryBox && summaryBox.height >= 44, `deep-dive summary is too short: ${summaryBox?.height}`);
    await mobile.screenshot({ path: path.join(SCREENSHOTS, "mobile-reflection.png"), fullPage: true });
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);

    const targetSizes = await mobile.locator("button:visible").evaluateAll((buttons) =>
      buttons.map((button) => {
        const box = button.getBoundingClientRect();
        return { label: button.innerText.trim() || button.getAttribute("aria-label"), width: box.width, height: box.height };
      }),
    );
    const undersized = targetSizes.filter(({ width, height }) => width < 38 || height < 38);
    assert.deepEqual(undersized, [], `undersized mobile targets: ${JSON.stringify(undersized)}`);

    await mobile.locator("#list-nav").click();
    await mobile.locator("#list-view").waitFor({ state: "visible" });
    await mobile.locator("#list-group-filter").selectOption("group-10");
    assert.equal(await mobile.locator("#question-list > li").count(), 10);
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    await mobile.screenshot({ path: path.join(SCREENSHOTS, "mobile-list.png"), fullPage: true });

    console.log("PASS browser golden path, persistence, list, random, desktop and mobile layout");
    console.log(`Screenshots: ${SCREENSHOTS}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  server.close();
});
