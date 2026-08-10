# First Ten Content Tuning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存の基本10問を、選択別フィードバックとケース固有の実践的な深掘りを備えた全体展開用の基準版として提示する。

**Architecture:** アプリのデータやUIは変更せず、レビュー用Markdownに10問の全文を同一書式でまとめる。各問を独立して編集した後、横断点検で重複、正解誘導、抽象表現、実行可能性を確認する。

**Tech Stack:** Markdown、既存のJavaScript質問データ、PowerShellによる静的確認

---

## File Structure

- Create: `docs/review/2026-08-10-first-ten-content-draft.md` — Kenさんが10問を連続して読み、コメントするための全文草案
- Read: `js/questions.js` — 既存の基本10問のケース、問い、3択、解説を参照する原稿
- Read: `docs/superpowers/specs/2026-08-10-first-ten-content-tuning-design.md` — 文章構成と編集原則
- Modify: なし — フィードバック前はアプリ本体を変更しない

### Task 1: レビュー原稿の骨格を作る

- [ ] **Step 1: 既存10問の事実関係を確認する**

Run:

```powershell
node --input-type=module -e "import('./js/questions.js').then(({QUESTIONS})=>console.log(JSON.stringify(QUESTIONS.slice(0,10),null,2)))"
```

Expected: `knock-001` から `knock-010` までの10問が出力され、それぞれに `theme`、`context`、`prompt`、3件の `choices` がある。

- [ ] **Step 2: 草案ファイルを作る**

各問を必ず次の見出し順で記載する。

```markdown
## 問01｜テーマ

### ケース

### 問い

### 3つの選択肢

### 選択別フィードバック

#### Aを選んだ場合

#### Bを選んだ場合

#### Cを選んだ場合

### 視点をひらく

### もう一段、考えるなら

- 別の読み方：
- 確かめたい事実：
- 明日できる小さな試み：
- 判断を変える条件：
```

### Task 2: 問01〜05を再編集する

- [ ] **Step 1: 問01〜05の選択別フィードバックを書く**

各選択について2文で構成する。第1文はその判断が守る価値、第2文は同時に確かめたいケース固有の事実とする。各選択を正解・不正解として扱わず、3案の文量をそろえる。

- [ ] **Step 2: 問01〜05の共通解説を書く**

ケース中の具体語へ戻り、少なくとも二つの読み方を示す。「子どもを見る」「目的を考える」だけで終わる抽象文は禁止する。

- [ ] **Step 3: 問01〜05の実践項目を書く**

「確かめたい事実」は観察対象を一つ以上明示し、「小さな試み」は次の授業・会議で一度実行できる行動とし、「判断を変える条件」は観察可能な条件文にする。

### Task 3: 問06〜10を再編集する

- [ ] **Step 1: 問06〜10の選択別フィードバックを書く**

各選択について2文で構成する。説明、共通化、教師の問い、生成AI、楽しい学校という各ケース固有の価値と盲点を扱い、問01〜05の一般文を流用しない。

- [ ] **Step 2: 問06〜10の共通解説を書く**

学校や教師の意図だけでなく、子どもの発言・沈黙・選択・成果物・前後の変化のいずれを根拠にするかを明示する。

- [ ] **Step 3: 問06〜10の実践項目を書く**

一人の子、一場面、一回の比較など、小さく確かめられる単位にする。生成AIの問では個人情報と教師の判断責任を外さない。

### Task 4: 10問を横断して編集品質を確認する

- [ ] **Step 1: 必須項目数を確認する**

Run:

```powershell
$draft = 'docs/review/2026-08-10-first-ten-content-draft.md'
rg -c '^## 問[0-9]{2}｜' $draft
rg -c '^#### [ABC]を選んだ場合' $draft
rg -c '^- 明日できる小さな試み：' $draft
rg -c '^- 判断を変える条件：' $draft
```

Expected: 順に `10`、`30`、`10`、`10`。

- [ ] **Step 2: 編集上の禁止事項を目視確認する**

次のすべてを確認する。

- どの選択肢にも正解を示す表現がない
- 選択した人を褒めたり否定したりしていない
- 10問すべてにケース固有の名詞または行動が含まれる
- 「視点をひらく」と4項目が同じ内容を言い換えただけになっていない
- 小さな試みが新制度導入や大規模調査を前提としていない
- 文章量が一問だけ突出していない

- [ ] **Step 3: アプリが未変更であることを確認する**

Run:

```powershell
git status --short
```

Expected: `docs/review/2026-08-10-first-ten-content-draft.md` 以外の新しい変更がない。

### Task 5: Kenさんへレビューを依頼する

- [ ] **Step 1: Markdownを人間レビュー用に開く**

`human-review` スキルを使い、10問の文章へ直接コメントできる状態にする。

- [ ] **Step 2: レビュー観点を明示する**

次の5点についてフィードバックを依頼する。

1. 選択別の返しが、自分の判断を理解する助けになるか
2. 実際に別の見方が増えるか
3. 解説が長すぎないか
4. 小さな試みが実行できそうか
5. 開明小の実態や語り方とずれていないか

- [ ] **Step 3: 次段階を停止する**

フィードバックを受けるまで、`js/questions.js`、`js/app.js`、残り90問を変更しない。
