const storageKey = "common-ground-polls";
const pollForm = document.querySelector("#poll-form");
const optionFields = document.querySelector("#option-fields");
const pollList = document.querySelector("#poll-list");
const pollCount = document.querySelector("#poll-count");
const addOptionButton = document.querySelector("#add-option");

let polls = loadPolls();

function loadPolls() {
  try {
    const savedPolls = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(savedPolls) ? savedPolls : [];
  } catch {
    return [];
  }
}

function savePolls() {
  localStorage.setItem(storageKey, JSON.stringify(polls));
}

function updateOptionFields() {
  const fields = [...optionFields.querySelectorAll(".option-field")];
  const atLimit = fields.length >= 8;

  addOptionButton.disabled = atLimit;
  addOptionButton.hidden = atLimit;

  fields.forEach((field, index) => {
    const letter = String.fromCharCode(65 + index);
    field.querySelector(".option-index").textContent = letter;
    field.querySelector('input[name="option"]').setAttribute("aria-label", `Option ${letter}`);
    const removeButton = field.querySelector(".remove-option");
    removeButton.disabled = fields.length <= 2;
    removeButton.setAttribute("aria-label", `Remove option ${letter}`);
  });
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderEmptyState() {
  const emptyState = makeElement("div", "empty-state");
  emptyState.append(
    makeElement("span", "empty-mark", "?"),
    makeElement("p", "", "It's quiet in here."),
    makeElement("small", "", "Start a poll and get the conversation going.")
  );
  pollList.append(emptyState);
}

function renderResults(poll, totalVotes) {
  const results = makeElement("div", "results");

  poll.options.forEach((option) => {
    const percentage = totalVotes ? Math.round((option.votes / totalVotes) * 100) : 0;
    const row = makeElement("div", "result-row");
    const label = makeElement("span", "result-label", option.text);
    const track = makeElement("div", "result-track");
    const fill = makeElement("div", "result-fill");
    const value = makeElement("span", "result-value", `${percentage}%`);

    track.setAttribute("role", "img");
    track.setAttribute("aria-label", `${option.text}: ${percentage}%`);
    fill.style.width = `${percentage}%`;
    track.append(fill);
    row.append(label, track, value);
    results.append(row);
  });

  const summary = makeElement("p", "results-summary");
  const count = makeElement("strong", "", `${totalVotes} ${totalVotes === 1 ? "vote" : "votes"}`);
  summary.append(count, document.createTextNode(" so far"));
  results.append(summary);
  return results;
}

function renderPoll(poll) {
  const card = makeElement("article", "poll-card");
  const totalVotes = poll.options.reduce((total, option) => total + option.votes, 0);
  const meta = makeElement("div", "poll-meta", "Community poll");
  const question = makeElement("h3", "", poll.question);
  card.append(meta, question);

  if (poll.voted) {
    card.append(renderResults(poll, totalVotes));
    const note = makeElement("p", "already-voted", "Your vote is in. Thanks for weighing in.");
    note.style.margin = "12px 0 0";
    card.append(note);
    return card;
  }

  const form = makeElement("form", "vote-options");
  poll.options.forEach((option, index) => {
    const label = makeElement("label", "vote-choice");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = `vote-${poll.id}`;
    input.value = String(index);
    input.required = true;
    label.append(input, document.createTextNode(option.text));
    form.append(label);
  });

  const actions = makeElement("div", "poll-actions");
  const voteButton = makeElement("button", "vote-button", "Vote");
  voteButton.type = "submit";
  const total = makeElement("span", "vote-total", `${totalVotes} ${totalVotes === 1 ? "vote" : "votes"}`);
  actions.append(voteButton, total);
  form.append(actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const choice = form.querySelector("input:checked");
    if (!choice) return;

    poll.options[Number(choice.value)].votes += 1;
    poll.voted = true;
    savePolls();
    renderPolls();
  });
  card.append(form);
  return card;
}

function renderPolls() {
  pollList.replaceChildren();
  pollCount.textContent = `${polls.length} ${polls.length === 1 ? "poll" : "polls"}`;

  if (polls.length === 0) {
    renderEmptyState();
    return;
  }

  polls.forEach((poll) => pollList.append(renderPoll(poll)));
}

addOptionButton.addEventListener("click", () => {
  if (optionFields.children.length >= 8) return;

  const field = makeElement("div", "option-field");
  const index = makeElement("span", "option-index");
  const input = document.createElement("input");
  input.name = "option";
  input.type = "text";
  input.maxLength = 60;
  input.placeholder = "Another option";
  input.setAttribute("aria-label", `Option ${String.fromCharCode(65 + optionFields.children.length)}`);
  input.required = true;
  const removeButton = makeElement("button", "remove-option", "×");
  removeButton.type = "button";
  field.append(index, input, removeButton);
  optionFields.append(field);
  updateOptionFields();
  input.focus();
});

optionFields.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-option");
  if (!removeButton || optionFields.children.length <= 2) return;

  removeButton.closest(".option-field").remove();
  updateOptionFields();
});

pollForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = pollForm.elements.question.value.trim();
  const options = [...pollForm.querySelectorAll('input[name="option"]')]
    .map((input) => input.value.trim())
    .filter(Boolean);

  if (!question || options.length < 2) return;

  polls.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question,
    options: options.map((text) => ({ text, votes: 0 })),
    voted: false
  });
  savePolls();
  renderPolls();
  pollForm.reset();
  optionFields.querySelectorAll(".option-field").forEach((field, index) => {
    if (index > 1) field.remove();
  });
  updateOptionFields();
  document.querySelector("#poll-question").focus();
});

updateOptionFields();
renderPolls();