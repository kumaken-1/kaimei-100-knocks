export function createInitialState() {
  return { completed: [], responses: {} };
}

export function sanitizeState(rawState, validIds) {
  if (!rawState || typeof rawState !== "object") {
    return createInitialState();
  }

  const validIdSet = new Set(validIds);
  const completed = Array.isArray(rawState.completed)
    ? [...new Set(rawState.completed.filter((id) => validIdSet.has(id)))]
    : [];
  const responses = {};

  if (rawState.responses && typeof rawState.responses === "object") {
    for (const [id, response] of Object.entries(rawState.responses)) {
      if (
        validIdSet.has(id) &&
        response &&
        typeof response === "object" &&
        typeof response.choiceId === "string"
      ) {
        responses[id] = { choiceId: response.choiceId };
      }
    }
  }

  return { completed, responses };
}

export function recordResponse(state, questionId, choiceId) {
  const completed = state.completed.includes(questionId)
    ? [...state.completed]
    : [...state.completed, questionId];

  return {
    completed,
    responses: {
      ...state.responses,
      [questionId]: { choiceId },
    },
  };
}

export function getProgress(state, questions) {
  const validIds = new Set(questions.map((question) => question.id));
  const completed = new Set(state.completed.filter((id) => validIds.has(id))).size;
  const total = questions.length;

  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function nextUncompletedId(currentId, questions, state) {
  if (questions.length === 0) return null;

  const currentIndex = Math.max(
    0,
    questions.findIndex((question) => question.id === currentId),
  );

  for (let offset = 1; offset <= questions.length; offset += 1) {
    const question = questions[(currentIndex + offset) % questions.length];
    if (!state.completed.includes(question.id)) return question.id;
  }

  return questions[(currentIndex + 1) % questions.length].id;
}

export function pickRandomId(ids, currentId = null, random = Math.random) {
  if (ids.length === 0) return null;
  const candidates = ids.length > 1 ? ids.filter((id) => id !== currentId) : ids;
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  return candidates[index];
}
