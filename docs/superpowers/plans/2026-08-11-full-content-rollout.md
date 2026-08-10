# Full Content Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 100問すべてをケース固有の内容へ個別編集し、選択した判断に対応するフィードバックと任意で開く深掘りをアプリへ実装する。

**Architecture:** 100問を領域別の10ファイルへ分割し、`js/questions.js` はグループ定義と結合だけを担当する。選択別フィードバックは各 `choice.feedback` に保持し、純粋関数で取得してから既存の回答後パネルへ表示する。保存形式 `{ choiceId }` は維持する。

**Tech Stack:** HTML、CSS、Vanilla JavaScript ES Modules、Node.js標準テスト、Playwrightブラウザ確認

---

## File Structure

- Create: `js/question-groups/group-01.js` through `js/question-groups/group-10.js` — 各領域10問の完成データ
- Modify: `js/questions.js` — グループ情報と10ファイルの結合・公開
- Modify: `js/core.js` — 選択IDからフィードバックを安全に取得する純粋関数
- Modify: `js/app.js` — 選択した回答へのフィードバック表示と再表示
- Modify: `index.html` — 選択別フィードバック領域とネイティブ折りたたみ
- Modify: `css/styles.css` — 新しいフィードバック領域と `<details>` の表示
- Modify: `tests/core.test.js` — データ契約、取得関数、保存互換性、重複検査
- Modify: `tests/dom-contract.test.js` — 必須DOMと折りたたみ構造
- Modify: `tests/browser-check.cjs` — 選択別表示、回答変更、折りたたみ、モバイル表示
- Reference: `docs/review/2026-08-10-first-ten-content-draft.md` — 問01〜10の承認済み原稿
- Reference: `docs/superpowers/specs/2026-08-11-full-content-rollout-design.md` — 完成条件

### Task 1: 選択別フィードバック取得をTDDで追加する

**Files:**
- Modify: `tests/core.test.js`
- Modify: `js/core.js`

- [ ] **Step 1: 失敗する取得テストを書く**

`tests/core.test.js` のimportへ `getChoiceFeedback` を追加し、次を加える。

```js
test("choice feedback is returned only for a matching choice", () => {
  const question = {
    choices: [
      {
        id: "observe",
        feedback: {
          value: "子どもの変化を判断の中心に置いています。",
          check: "計画のどこが変化を支えたかも確かめます。",
        },
      },
    ],
  };

  assert.deepEqual(getChoiceFeedback(question, "observe"), question.choices[0].feedback);
  assert.equal(getChoiceFeedback(question, "unknown"), null);
  assert.equal(getChoiceFeedback(null, "observe"), null);
});
```

- [ ] **Step 2: テストが失敗することを確認する**

Run: `npm.cmd test`

Expected: `getChoiceFeedback` がexportされていないためFAIL。

- [ ] **Step 3: 最小実装を追加する**

`js/core.js` へ追加する。

```js
export function getChoiceFeedback(question, choiceId) {
  if (!question || typeof choiceId !== "string") return null;
  const choice = question.choices?.find((item) => item.id === choiceId);
  if (!choice?.feedback?.value || !choice?.feedback?.check) return null;
  return choice.feedback;
}
```

- [ ] **Step 4: テストを通す**

Run: `npm.cmd test`

Expected: 既存7件と新規1件がすべてPASS。

- [ ] **Step 5: コミットする**

```powershell
git add js/core.js tests/core.test.js
git commit -m "feat: resolve feedback for selected choice"
```

### Task 2: 問01〜20を個別データへ移す

**Files:**
- Create: `js/question-groups/group-01.js`
- Create: `js/question-groups/group-02.js`
- Reference: `docs/review/2026-08-10-first-ten-content-draft.md`
- Reference: `js/questions.js`

- [ ] **Step 1: 問01〜10を承認済み原稿から作る**

`group-01.js` は `export const GROUP_01_QUESTIONS = [...]` とする。各選択肢へ次の形で原稿の2文を分けて入れる。

```js
{
  id: "plan",
  label: "まず、計画どおり進んだことを評価する",
  feedback: {
    value: "授業の見通しや時間配分が、子どもの安心を支えた可能性を大切にする判断です。",
    check: "同時に、振り返りが短い子にも考えの変化があったのか、書く時間や表し方が合っていたのかを確かめたいところです。",
  },
}
```

`perspective` と `deepDive` は承認済み原稿をそのまま使用し、`followUps` は持たせない。

- [ ] **Step 2: 問11〜20をケース固有に書く**

既存の `theme`、`context`、`prompt`、`id`、`groupId` を維持する。各問の3択、選択別6文、共通解説、深掘り4項目を個別編集し、発言・成果物・前後の変化などケース中の事実へ戻す。

- [ ] **Step 3: 2グループのデータ契約を確認する**

Run:

```powershell
node --input-type=module -e "Promise.all([import('./js/question-groups/group-01.js'),import('./js/question-groups/group-02.js')]).then(([a,b])=>{const qs=[...a.GROUP_01_QUESTIONS,...b.GROUP_02_QUESTIONS];if(qs.length!==20||qs.some(q=>q.choices.length!==3||q.choices.some(c=>!c.feedback?.value||!c.feedback?.check)))process.exit(1);console.log('PASS groups 01-02: 20 questions, 60 complete choices')})"
```

Expected: `PASS groups 01-02: 20 questions, 60 complete choices`

- [ ] **Step 4: コミットする**

```powershell
git add js/question-groups/group-01.js js/question-groups/group-02.js
git commit -m "feat: author feedback for questions 1 to 20"
```

### Task 3: 問21〜40を個別データへ移す

**Files:**
- Create: `js/question-groups/group-03.js`
- Create: `js/question-groups/group-04.js`
- Reference: `js/questions.js`

- [ ] **Step 1: 問21〜30「個別と協働」を編集する**

一人で進める自由、協働への参加、役割、待つ時間、支援の公平さを別々の判断軸として扱う。各 `experiment` は一人または一場面で一度試せる行動にする。

- [ ] **Step 2: 問31〜40「問い・探究」を編集する**

教師の問い、子どもの違和感、問いの持続、情報収集、立ち止まり、成果発表を区別する。「もっと調べたい」という発言だけを問いの証拠にしない。

- [ ] **Step 3: データ契約を確認する**

Run:

```powershell
node --input-type=module -e "Promise.all([import('./js/question-groups/group-03.js'),import('./js/question-groups/group-04.js')]).then(([a,b])=>{const qs=[...a.GROUP_03_QUESTIONS,...b.GROUP_04_QUESTIONS];const texts=qs.flatMap(q=>q.choices.flatMap(c=>[c.feedback.value,c.feedback.check]));if(qs.length!==20||new Set(texts).size!==120)process.exit(1);console.log('PASS groups 03-04: 120 unique feedback sentences')})"
```

Expected: `PASS groups 03-04: 120 unique feedback sentences`

- [ ] **Step 4: コミットする**

```powershell
git add js/question-groups/group-03.js js/question-groups/group-04.js
git commit -m "feat: author feedback for questions 21 to 40"
```

### Task 4: 問41〜60を個別データへ移す

**Files:**
- Create: `js/question-groups/group-05.js`
- Create: `js/question-groups/group-06.js`
- Reference: `js/questions.js`

- [ ] **Step 1: 問41〜50「授業設計」を編集する**

時間配分、教材、学習形態、教師の介入、まとめ、評価場面を混同せず、計画と子どもの反応が食い違った場面を判断の中心に置く。

- [ ] **Step 2: 問51〜60「校内研究」を編集する**

研究テーマ、指導案、協議、公開授業、共通実践を、実施の有無ではなく子どもの事実に結びつける。会議全体の制度変更ではなく、次の一回で試せる行動を書く。

- [ ] **Step 3: データ契約を確認する**

Run:

```powershell
node --input-type=module -e "Promise.all([import('./js/question-groups/group-05.js'),import('./js/question-groups/group-06.js')]).then(([a,b])=>{const qs=[...a.GROUP_05_QUESTIONS,...b.GROUP_06_QUESTIONS];if(qs.length!==20||qs.some(q=>Object.values(q.deepDive).some(v=>!v.trim())))process.exit(1);console.log('PASS groups 05-06: 20 complete deep dives')})"
```

Expected: `PASS groups 05-06: 20 complete deep dives`

- [ ] **Step 4: コミットする**

```powershell
git add js/question-groups/group-05.js js/question-groups/group-06.js
git commit -m "feat: author feedback for questions 41 to 60"
```

### Task 5: 問61〜80を個別データへ移す

**Files:**
- Create: `js/question-groups/group-07.js`
- Create: `js/question-groups/group-08.js`
- Reference: `js/questions.js`

- [ ] **Step 1: 問61〜70「教育課程」を編集する**

時数、行事、教科横断、年間計画、評価、地域資源を、運用のしやすさと子どもの経験の両面から扱う。制度用語だけで解説を終えない。

- [ ] **Step 2: 問71〜80「ICT・生成AI」を編集する**

効率、表現、情報量、個人情報、根拠確認、教師の責任を問題ごとに分ける。AI利用を推奨または禁止する一方向の結論にしない。

- [ ] **Step 3: データ契約を確認する**

Run:

```powershell
node --input-type=module -e "Promise.all([import('./js/question-groups/group-07.js'),import('./js/question-groups/group-08.js')]).then(([a,b])=>{const qs=[...a.GROUP_07_QUESTIONS,...b.GROUP_08_QUESTIONS];const experiments=qs.map(q=>q.deepDive.experiment);if(qs.length!==20||new Set(experiments).size!==20)process.exit(1);console.log('PASS groups 07-08: 20 unique experiments')})"
```

Expected: `PASS groups 07-08: 20 unique experiments`

- [ ] **Step 4: コミットする**

```powershell
git add js/question-groups/group-07.js js/question-groups/group-08.js
git commit -m "feat: author feedback for questions 61 to 80"
```

### Task 6: 問81〜100を個別データへ移す

**Files:**
- Create: `js/question-groups/group-09.js`
- Create: `js/question-groups/group-10.js`
- Reference: `js/questions.js`

- [ ] **Step 1: 問81〜90「学校づくり」を編集する**

学校目標、行事、校則、保護者・地域、教職員の協働を、平均値や多数意見だけで判断しない内容にする。少数の子の過程と全体傾向を対立させず、両方の根拠を示す。

- [ ] **Step 2: 問91〜100「多様な学び」を編集する**

参加の仕方、表現方法、登校、支援、評価、安心を区別する。同じ扱いと公平さを混同せず、本人の選択と周囲の責任の両方を扱う。

- [ ] **Step 3: データ契約を確認する**

Run:

```powershell
node --input-type=module -e "Promise.all([import('./js/question-groups/group-09.js'),import('./js/question-groups/group-10.js')]).then(([a,b])=>{const qs=[...a.GROUP_09_QUESTIONS,...b.GROUP_10_QUESTIONS];const conditions=qs.map(q=>q.deepDive.condition);if(qs.length!==20||new Set(conditions).size!==20)process.exit(1);console.log('PASS groups 09-10: 20 unique conditions')})"
```

Expected: `PASS groups 09-10: 20 unique conditions`

- [ ] **Step 4: コミットする**

```powershell
git add js/question-groups/group-09.js js/question-groups/group-10.js
git commit -m "feat: author feedback for questions 81 to 100"
```

### Task 7: 10グループを結合し、旧生成処理を削除する

**Files:**
- Modify: `js/questions.js`
- Modify: `tests/core.test.js`
- Test: `tests/core.test.js`

- [ ] **Step 1: 完成データ契約の失敗テストを書く**

既存の完全性テストを、3択とフィードバックを必須にする形へ変更し、重複検査を追加する。

```js
for (const question of QUESTIONS) {
  assert.equal(question.choices.length, 3);
  for (const choice of question.choices) {
    assert.ok(choice.feedback.value.trim());
    assert.ok(choice.feedback.check.trim());
  }
  assert.equal("followUps" in question, false);
}

const feedbackSentences = QUESTIONS.flatMap((question) =>
  question.choices.flatMap((choice) => [choice.feedback.value, choice.feedback.check]),
);
assert.equal(new Set(feedbackSentences).size, 600);
assert.equal(new Set(QUESTIONS.map((question) => question.perspective.body)).size, 100);

for (const key of ["perspective", "evidence", "experiment", "condition"]) {
  assert.equal(new Set(QUESTIONS.map((question) => question.deepDive[key])).size, 100);
}
```

- [ ] **Step 2: 旧構造のままでは失敗することを確認する**

Run: `npm.cmd test`

Expected: `QUESTIONS` が新しいグループファイルをまだ使っていないためFAIL。

- [ ] **Step 3: `js/questions.js` を結合専用にする**

10ファイルをimportし、次の形で公開する。

```js
import { GROUP_01_QUESTIONS } from "./question-groups/group-01.js";
import { GROUP_02_QUESTIONS } from "./question-groups/group-02.js";
import { GROUP_03_QUESTIONS } from "./question-groups/group-03.js";
import { GROUP_04_QUESTIONS } from "./question-groups/group-04.js";
import { GROUP_05_QUESTIONS } from "./question-groups/group-05.js";
import { GROUP_06_QUESTIONS } from "./question-groups/group-06.js";
import { GROUP_07_QUESTIONS } from "./question-groups/group-07.js";
import { GROUP_08_QUESTIONS } from "./question-groups/group-08.js";
import { GROUP_09_QUESTIONS } from "./question-groups/group-09.js";
import { GROUP_10_QUESTIONS } from "./question-groups/group-10.js";

export const QUESTION_GROUPS = [
  { id: "group-01", range: "01–10", title: "基本の10問" },
  { id: "group-02", range: "11–20", title: "見取り・評価" },
  { id: "group-03", range: "21–30", title: "個別と協働" },
  { id: "group-04", range: "31–40", title: "問い・探究" },
  { id: "group-05", range: "41–50", title: "授業設計" },
  { id: "group-06", range: "51–60", title: "校内研究" },
  { id: "group-07", range: "61–70", title: "教育課程" },
  { id: "group-08", range: "71–80", title: "ICT・生成AI" },
  { id: "group-09", range: "81–90", title: "学校づくり" },
  { id: "group-10", range: "91–100", title: "多様な学び" },
];

export const QUESTIONS = [
  ...GROUP_01_QUESTIONS,
  ...GROUP_02_QUESTIONS,
  ...GROUP_03_QUESTIONS,
  ...GROUP_04_QUESTIONS,
  ...GROUP_05_QUESTIONS,
  ...GROUP_06_QUESTIONS,
  ...GROUP_07_QUESTIONS,
  ...GROUP_08_QUESTIONS,
  ...GROUP_09_QUESTIONS,
  ...GROUP_10_QUESTIONS,
];
```

`LENSES`、`DEEP_DIVE_BUILDERS`、`EXPANSION_SEEDS`、`expandQuestion`、`followUps` を削除する。

- [ ] **Step 4: 完成データ契約を通す**

Run: `npm.cmd test`

Expected: 100問、600フィードバック文、深掘り各100件の検査を含めてPASS。

- [ ] **Step 5: コミットする**

```powershell
git add js/questions.js js/question-groups tests/core.test.js
git commit -m "refactor: replace generated questions with authored groups"
```

### Task 8: 選択別フィードバックと折りたたみUIを実装する

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`
- Modify: `css/styles.css`
- Modify: `tests/dom-contract.test.js`

- [ ] **Step 1: DOM契約の失敗テストを書く**

`tests/dom-contract.test.js` の必須マーカーへ次を追加し、旧 `follow-up-list` の不在も検査する。

```js
for (const marker of [
  'id="choice-feedback"',
  'id="choice-feedback-value"',
  'id="choice-feedback-check"',
  '<details class="deep-dive-block"',
  '<summary',
]) {
  assert.ok(html.includes(marker), `missing ${marker}`);
}
assert.equal(html.includes('id="follow-up-list"'), false);
```

- [ ] **Step 2: DOM契約が失敗することを確認する**

Run: `npm.cmd test`

Expected: 新しいフィードバック要素と `<details>` がないためFAIL。

- [ ] **Step 3: HTMLを更新する**

`reflection-panel` 冒頭へ選択別領域を追加する。

```html
<section class="choice-feedback" id="choice-feedback" aria-labelledby="choice-feedback-title" hidden>
  <p class="reflection-kicker">選んだ判断を、見つめてみる</p>
  <h2 id="choice-feedback-title">この判断が大切にしていること</h2>
  <p id="choice-feedback-value"></p>
  <h3>同時に確かめたいこと</h3>
  <p id="choice-feedback-check"></p>
</section>
```

`follow-up-block` を削除し、`deep-dive-block` を次のネイティブ要素へ置換する。

```html
<details class="deep-dive-block" id="deep-dive-block">
  <summary>もう一段、見方を増やす</summary>
  <div class="deep-dive-grid">
    <section class="deep-dive-item" aria-labelledby="deep-dive-perspective-title">
      <h3 id="deep-dive-perspective-title">別の読み方</h3>
      <p id="deep-dive-perspective"></p>
    </section>
    <section class="deep-dive-item" aria-labelledby="deep-dive-evidence-title">
      <h3 id="deep-dive-evidence-title">確かめたい事実</h3>
      <p id="deep-dive-evidence"></p>
    </section>
    <section class="deep-dive-item" aria-labelledby="deep-dive-experiment-title">
      <h3 id="deep-dive-experiment-title">小さく試すなら</h3>
      <p id="deep-dive-experiment"></p>
    </section>
    <section class="deep-dive-item" aria-labelledby="deep-dive-condition-title">
      <h3 id="deep-dive-condition-title">判断を変える条件</h3>
      <p id="deep-dive-condition"></p>
    </section>
  </div>
</details>
```

- [ ] **Step 4: 選択内容を表示する**

`js/app.js` で `getChoiceFeedback` をimportし、DOM参照を追加する。`fillReflection` を次の責務に変更する。

```js
function fillReflection(question, choiceId) {
  const feedback = getChoiceFeedback(question, choiceId);
  elements.choiceFeedback.hidden = !feedback;
  elements.choiceFeedbackValue.textContent = feedback?.value ?? "";
  elements.choiceFeedbackCheck.textContent = feedback?.check ?? "";
  elements.perspectiveTitle.textContent = question.perspective.title;
  elements.perspectiveBody.textContent = question.perspective.body;
  elements.deepDivePerspective.textContent = question.deepDive.perspective;
  elements.deepDiveEvidence.textContent = question.deepDive.evidence;
  elements.deepDiveExperiment.textContent = question.deepDive.experiment;
  elements.deepDiveCondition.textContent = question.deepDive.condition;
  elements.deepDiveBlock.open = false;
}
```

`showQuestion` では `fillReflection(question, savedResponse?.choiceId)`、送信時は保存後に `fillReflection(question, choiceId)` を呼ぶ。存在しない選択IDでは反射パネル全体を表示しない。

- [ ] **Step 5: CSSを追加する**

`.choice-feedback` を既存パネル内の独立ブロックとして表示し、次を基準に既存の色変数へ合わせる。

```css
.choice-feedback {
  padding: 1.25rem;
  border: 1px solid var(--line);
  border-radius: 1rem;
  background: var(--white);
}

.choice-feedback[hidden] {
  display: none;
}

.choice-feedback h2,
.choice-feedback h3 {
  margin: 0.75rem 0 0.35rem;
}

.deep-dive-block > summary {
  min-height: 44px;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 700;
}

.deep-dive-block > summary:focus-visible {
  outline: 3px solid var(--coral);
  outline-offset: 3px;
}

.deep-dive-block[open] .deep-dive-grid {
  margin-top: 1rem;
}
```

既存の `--line`、`--white`、`--coral` を使い、新しい色変数は増やさない。

- [ ] **Step 6: テストを通す**

Run: `npm.cmd test`

Expected: コアテストと静的UI契約がすべてPASS。

- [ ] **Step 7: コミットする**

```powershell
git add index.html js/app.js css/styles.css tests/dom-contract.test.js
git commit -m "feat: show feedback for the selected judgment"
```

### Task 9: ブラウザ挙動とレスポンシブ表示を検証する

**Files:**
- Modify: `tests/browser-check.cjs`
- Test: `tests/browser-check.cjs`

- [ ] **Step 1: ブラウザ検査へ選択別表示を追加する**

問01でAを選んだ後に `#choice-feedback-value` が計画と見通しに関する文章を含むこと、Bへ変更後に子どもの考えの変化に関する文章へ変わることを検査する。`#deep-dive-block` は初期状態で閉じ、クリック後に `open` になることを検査する。

```js
await desktop.locator(".choice-option").first().locator("label").click();
await desktop.locator("#answer-form button[type='submit']").click();
assert.match(await desktop.locator("#choice-feedback-value").innerText(), /見通し|時間配分/);
assert.equal(await desktop.locator("#deep-dive-block").getAttribute("open"), null);

await desktop.locator(".choice-option").nth(1).locator("label").click();
await desktop.locator("#answer-form button[type='submit']").click();
assert.match(await desktop.locator("#choice-feedback-value").innerText(), /子ども|考え|変化/);

await desktop.locator("#deep-dive-block > summary").click();
assert.notEqual(await desktop.locator("#deep-dive-block").getAttribute("open"), null);
```

- [ ] **Step 2: デスクトップで検査する**

Run: `npm.cmd test`

Run: `node tests/browser-check.cjs`

Expected: 選択別表示、変更後の更新、折りたたみ、コンソールエラー0件、横スクロールなし。

- [ ] **Step 3: 390px幅で検査する**

`tests/browser-check.cjs` のモバイルページで問100へ回答し、次を確認する。

- 選択別フィードバックがケース本文の幅を超えない
- `summary` の高さが44px以上
- 深掘りを閉じた状態で次の操作が見つかる
- 開いた状態でも横スクロールがない

- [ ] **Step 4: スクリーンショットを目視確認する**

`tests/screenshots/desktop-reflection.png` と `tests/screenshots/mobile-reflection.png` を確認し、見出し階層、余白、折りたたみの affordance、長文の読みやすさを点検する。

- [ ] **Step 5: コミットする**

```powershell
git add tests/browser-check.cjs
git commit -m "test: verify selected feedback in the browser"
```

### Task 10: 最終検証と公開前確認を行う

**Files:**
- Verify: `index.html`
- Verify: `css/styles.css`
- Verify: `js/*.js`
- Verify: `js/question-groups/*.js`
- Verify: `tests/*.js`

- [ ] **Step 1: 旧テンプレートがないことを確認する**

Run:

```powershell
rg -n "LENSES|DEEP_DIVE_BUILDERS|EXPANSION_SEEDS|expandQuestion|followUps|follow-up-list" js index.html tests
```

Expected: 一致なし。

- [ ] **Step 2: 全データの数と重複を確認する**

Run:

```powershell
node --input-type=module -e "import('./js/questions.js').then(({QUESTIONS})=>{const fb=QUESTIONS.flatMap(q=>q.choices.flatMap(c=>[c.feedback.value,c.feedback.check]));const keys=['perspective','evidence','experiment','condition'];const out={questions:QUESTIONS.length,feedback:[new Set(fb).size,fb.length],commonPerspectives:new Set(QUESTIONS.map(q=>q.perspective.body)).size,deep:Object.fromEntries(keys.map(k=>[k,new Set(QUESTIONS.map(q=>q.deepDive[k])).size]))};console.log(JSON.stringify(out,null,2));if(out.questions!==100||out.feedback[0]!==600||out.commonPerspectives!==100||Object.values(out.deep).some(n=>n!==100))process.exit(1)})"
```

Expected: `questions: 100`、`feedback: [600, 600]`、`commonPerspectives: 100`、深掘り4項目がすべて `100`。

- [ ] **Step 3: 全テストを実行する**

Run: `npm.cmd test`

Expected: 全テストPASS、失敗0件。

- [ ] **Step 4: Git差分を確認する**

Run:

```powershell
git diff --check
git status --short
```

Expected: 空白エラーなし。変更は計画対象ファイルだけ。

- [ ] **Step 5: Kenさんの公開前レビューで停止する**

ローカルの完成版をブラウザで開き、問01、問50、問100の回答後画面を提示する。Kenさんの確認前に `main` へのマージ、Push、公開を行わない。
