import { QUESTIONS, QUESTION_GROUPS } from "./questions.js";
import {
  createInitialState,
  getProgress,
  nextUncompletedId,
  pickRandomId,
  recordResponse,
  sanitizeState,
} from "./core.js";

const STORAGE_KEY = "kaimei-100-knocks-state-v1";
const views = {
  home: document.querySelector("#home-view"),
  question: document.querySelector("#question-view"),
  list: document.querySelector("#list-view"),
};

let state = loadState();
let currentQuestionId = null;

const elements = {
  main: document.querySelector("#main-content"),
  homeCompleted: document.querySelector("#home-completed"),
  homeTotal: document.querySelector("#home-total"),
  homeProgress: document.querySelector("#home-progress"),
  homeProgressFill: document.querySelector("#home-progress-fill"),
  continueLabel: document.querySelector("#continue-label"),
  questionProgressText: document.querySelector("#question-progress-text"),
  questionProgressFill: document.querySelector("#question-progress-fill"),
  questionNumber: document.querySelector("#question-number"),
  questionTheme: document.querySelector("#question-theme"),
  questionContext: document.querySelector("#question-context"),
  questionTitle: document.querySelector("#question-title"),
  choiceList: document.querySelector("#choice-list"),
  thoughtNote: document.querySelector("#thought-note"),
  answerForm: document.querySelector("#answer-form"),
  formMessage: document.querySelector("#form-message"),
  reflectionPanel: document.querySelector("#reflection-panel"),
  perspectiveTitle: document.querySelector("#perspective-title"),
  perspectiveBody: document.querySelector("#perspective-body"),
  followUpList: document.querySelector("#follow-up-list"),
  questionList: document.querySelector("#question-list"),
  listGroupFilter: document.querySelector("#list-group-filter"),
  listSummary: document.querySelector("#list-summary"),
};

elements.listGroupFilter.replaceChildren(
  ...QUESTION_GROUPS.map((group) => {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = `${group.range}｜${group.label}`;
    return option;
  }),
);

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return sanitizeState(stored, QUESTIONS.map((question) => question.id));
  } catch {
    return createInitialState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    elements.formMessage.textContent = "この端末では進捗を保存できません。画面を閉じるまで回答は残ります。";
  }
}

function setActiveView(name) {
  for (const [viewName, view] of Object.entries(views)) {
    view.hidden = viewName !== name;
  }

  document.querySelector("#home-nav").setAttribute("aria-current", name === "home" ? "page" : "false");
  document.querySelector("#list-nav").setAttribute("aria-current", name === "list" ? "page" : "false");
  window.scrollTo({ top: 0, behavior: "instant" });
  elements.main.focus({ preventScroll: true });
}

function updateProgress() {
  const progress = getProgress(state, QUESTIONS);
  const nextQuestion = QUESTIONS.find((question) => !state.completed.includes(question.id));

  elements.homeCompleted.textContent = progress.completed;
  elements.homeTotal.textContent = progress.total;
  elements.homeProgress.setAttribute("aria-valuemax", progress.total);
  elements.homeProgress.setAttribute("aria-valuenow", progress.completed);
  elements.homeProgressFill.style.width = `${progress.percent}%`;
  elements.questionProgressText.textContent = `${progress.completed} / ${progress.total}`;
  elements.questionProgressFill.style.width = `${progress.percent}%`;
  elements.continueLabel.textContent = nextQuestion
    ? progress.completed === 0
      ? "1問目から始める"
      : "続きの問いへ"
    : "もう一度、問い直す";
  elements.listSummary.textContent = `${progress.completed} / ${progress.total} 問に立ち止まった`;
}

function showHome() {
  currentQuestionId = null;
  updateProgress();
  setActiveView("home");
  history.replaceState(null, "", "#home");
}

function showList() {
  currentQuestionId = null;
  updateProgress();
  renderQuestionList();
  setActiveView("list");
  history.replaceState(null, "", "#list");
}

function createChoice(question, choice, savedChoiceId) {
  const wrapper = document.createElement("div");
  wrapper.className = "choice-option";

  const input = document.createElement("input");
  input.type = "radio";
  input.name = "stance";
  input.id = `${question.id}-${choice.id}`;
  input.value = choice.id;
  input.checked = savedChoiceId === choice.id;

  const label = document.createElement("label");
  label.className = "choice-card";
  label.htmlFor = input.id;
  label.textContent = choice.label;

  wrapper.append(input, label);
  return wrapper;
}

function fillReflection(question) {
  elements.perspectiveTitle.textContent = question.perspective.title;
  elements.perspectiveBody.textContent = question.perspective.body;
  elements.followUpList.replaceChildren(
    ...question.followUps.map((followUp) => {
      const item = document.createElement("li");
      item.textContent = followUp;
      return item;
    }),
  );
}

function showQuestion(questionId) {
  const question = QUESTIONS.find((item) => item.id === questionId) ?? QUESTIONS[0];
  const index = QUESTIONS.indexOf(question);
  const savedResponse = state.responses[question.id];

  currentQuestionId = question.id;
  elements.questionNumber.textContent = `KNOCK ${String(index + 1).padStart(2, "0")}`;
  elements.questionTheme.textContent = question.theme;
  elements.questionContext.textContent = question.context;
  elements.questionTitle.textContent = question.prompt;
  elements.choiceList.replaceChildren(
    ...question.choices.map((choice) => createChoice(question, choice, savedResponse?.choiceId)),
  );
  elements.thoughtNote.value = savedResponse?.note ?? "";
  elements.formMessage.textContent = "";
  fillReflection(question);
  elements.reflectionPanel.hidden = !savedResponse;
  updateProgress();
  setActiveView("question");
  history.replaceState(null, "", `#${question.id}`);
}

function renderQuestionList() {
  const selectedGroupId = elements.listGroupFilter.value || QUESTION_GROUPS[0].id;
  const visibleQuestions = QUESTIONS.filter((question) => question.groupId === selectedGroupId);
  elements.questionList.replaceChildren(
    ...visibleQuestions.map((question) => {
      const index = QUESTIONS.indexOf(question);
      const item = document.createElement("li");
      const button = document.createElement("button");
      const completed = state.completed.includes(question.id);

      button.type = "button";
      button.className = `question-list-button${completed ? " is-complete" : ""}`;
      button.dataset.questionId = question.id;
      button.innerHTML = `
        <span class="list-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="list-copy">
          <strong>${question.theme}</strong>
          <span>${question.prompt}</span>
        </span>
        <span class="list-status">${completed ? "立ち止まった ✓" : "問いを開く →"}</span>
      `;
      item.append(button);
      return item;
    }),
  );
}

function openRandomQuestion() {
  const id = pickRandomId(
    QUESTIONS.map((question) => question.id),
    currentQuestionId,
  );
  showQuestion(id);
}

function openNextQuestion() {
  const id = nextUncompletedId(currentQuestionId, QUESTIONS, state);
  showQuestion(id);
}

elements.answerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(elements.answerForm);
  const choiceId = formData.get("stance");

  if (!choiceId) {
    elements.formMessage.textContent = "いまの考えに近いものを1つ選んでください。正解を選ぶ必要はありません。";
    elements.choiceList.querySelector("input")?.focus();
    return;
  }

  state = recordResponse(state, currentQuestionId, choiceId, elements.thoughtNote.value);
  saveState();
  updateProgress();
  elements.formMessage.textContent = "";
  elements.reflectionPanel.hidden = false;
  elements.reflectionPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  elements.reflectionPanel.focus({ preventScroll: true });
});

document.querySelector("#brand-button").addEventListener("click", showHome);
document.querySelector("#home-nav").addEventListener("click", showHome);
document.querySelector("#list-nav").addEventListener("click", showList);
document.querySelector("#question-back-button").addEventListener("click", showList);
document.querySelector("#list-after-button").addEventListener("click", showList);
document.querySelector("#next-button").addEventListener("click", openNextQuestion);
document.querySelector("#random-home-button").addEventListener("click", openRandomQuestion);
document.querySelector("#random-question-button").addEventListener("click", openRandomQuestion);
document.querySelector("#random-list-button").addEventListener("click", openRandomQuestion);

document.querySelector("#continue-button").addEventListener("click", () => {
  const next = QUESTIONS.find((question) => !state.completed.includes(question.id)) ?? QUESTIONS[0];
  showQuestion(next.id);
});

elements.questionList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-question-id]");
  if (button) showQuestion(button.dataset.questionId);
});

elements.listGroupFilter.addEventListener("change", renderQuestionList);

function startFromHash() {
  const route = location.hash.slice(1);
  if (route === "list") {
    showList();
  } else if (QUESTIONS.some((question) => question.id === route)) {
    showQuestion(route);
  } else {
    showHome();
  }
}

window.addEventListener("hashchange", startFromHash);
startFromHash();
