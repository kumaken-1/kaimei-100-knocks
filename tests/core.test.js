import assert from "node:assert/strict";

import { QUESTIONS, QUESTION_GROUPS } from "../js/questions.js";
import {
  createInitialState,
  getProgress,
  nextUncompletedId,
  pickRandomId,
  recordResponse,
  sanitizeState,
} from "../js/core.js";

const tests = [];

function test(name, run) {
  tests.push({ name, run });
}

test("the full set contains one hundred complete, uniquely identified questions", () => {
  assert.equal(QUESTIONS.length, 100);
  assert.equal(new Set(QUESTIONS.map((question) => question.id)).size, 100);
  assert.deepEqual(
    QUESTIONS.map((question) => question.id),
    Array.from({ length: 100 }, (_, index) => `knock-${String(index + 1).padStart(3, "0")}`),
  );
  assert.equal(
    new Set(QUESTIONS.map((question) => `${question.context}\n${question.prompt}`)).size,
    100,
  );
  assert.equal(QUESTION_GROUPS.length, 10);
  for (const group of QUESTION_GROUPS) {
    assert.equal(QUESTIONS.filter((question) => question.groupId === group.id).length, 10);
  }

  for (const question of QUESTIONS) {
    assert.match(question.id, /^knock-\d{3}$/);
    assert.ok(question.theme);
    assert.ok(question.context);
    assert.ok(question.prompt);
    assert.ok(question.choices.length >= 3);
    assert.ok(question.perspective.title);
    assert.ok(question.perspective.body);
    assert.equal(question.followUps.length, 2);
  }
});

test("recording a response marks the question complete and keeps the note", () => {
  const state = createInitialState();
  const updated = recordResponse(state, "knock-001", "observe", "発言の変化を見る");

  assert.deepEqual(updated.completed, ["knock-001"]);
  assert.deepEqual(updated.responses["knock-001"], {
    choiceId: "observe",
    note: "発言の変化を見る",
  });
  assert.deepEqual(state.completed, []);
});

test("progress reports completed and total counts without scoring", () => {
  const state = {
    completed: ["knock-001", "knock-003"],
    responses: {},
  };

  assert.deepEqual(getProgress(state, QUESTIONS), {
    completed: 2,
    total: 100,
    percent: 2,
  });
});

test("next uncompleted question wraps through the ordered list", () => {
  const state = {
    completed: ["knock-001", "knock-002"],
    responses: {},
  };

  assert.equal(nextUncompletedId("knock-100", QUESTIONS, state), "knock-003");
});

test("random selection can avoid the question currently shown", () => {
  const ids = ["knock-001", "knock-002", "knock-003"];
  assert.equal(pickRandomId(ids, "knock-001", () => 0), "knock-002");
});

test("sanitizing stored state removes unknown questions and malformed responses", () => {
  const validIds = QUESTIONS.map((question) => question.id);
  const sanitized = sanitizeState(
    {
      completed: ["knock-001", "unknown"],
      responses: {
        "knock-001": { choiceId: "observe", note: "メモ" },
        unknown: { choiceId: "x", note: "破棄" },
        "knock-002": null,
      },
    },
    validIds,
  );

  assert.deepEqual(sanitized, {
    completed: ["knock-001"],
    responses: {
      "knock-001": { choiceId: "observe", note: "メモ" },
    },
  });
});

let failures = 0;

for (const { name, run } of tests) {
  try {
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`\n${tests.length} tests passed.`);
}
