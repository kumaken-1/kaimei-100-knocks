import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, app, styles] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../js/app.js", import.meta.url), "utf8"),
  readFile(new URL("../css/styles.css", import.meta.url), "utf8"),
]);

const requiredHtml = [
  "viewport",
  'id="home-view"',
  'id="question-view"',
  'id="list-view"',
  'id="answer-form"',
  'id="reflection-panel"',
  'id="deep-dive-block"',
  'id="deep-dive-perspective"',
  'id="deep-dive-evidence"',
  'id="deep-dive-experiment"',
  'id="question-list"',
  'id="list-group-filter"',
  'aria-live="polite"',
  'type="module"',
];

for (const marker of requiredHtml) {
  assert.ok(html.includes(marker), `index.html is missing ${marker}`);
}

for (const marker of [
  "localStorage",
  "recordResponse",
  "pickRandomId",
  "renderQuestionList",
  "showQuestion",
  "deepDiveBlock",
]) {
  assert.ok(app.includes(marker), `app.js is missing ${marker}`);
}

assert.ok(!html.includes("https://"), "the app should not require external assets");
assert.ok(!html.includes('class="brand-school"'), "header school name should be removed");
assert.ok(!html.includes('id="thought-note"'), "unused thought note should be removed");
assert.ok(!app.includes("thoughtNote"), "note handling should be removed from app.js");
const fixedRemSizes = [...styles.matchAll(/font-size:\s*(\d*\.?\d+)rem/g)].map((match) => Number(match[1]));
assert.ok(Math.min(...fixedRemSizes) >= 0.89, "fixed text sizes should be at least 0.89rem (about 10.7pt)");
console.log("PASS static UI contract");
