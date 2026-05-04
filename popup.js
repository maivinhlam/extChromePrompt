const STORAGE_KEY = "flowPromptRunnerSettings";

const intervalInput = document.getElementById("intervalSeconds");
const saveImageInput = document.getElementById("saveImage");
const saveVideoInput = document.getElementById("saveVideo");
const promptsInput = document.getElementById("prompts");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

init().catch((error) => setStatus(`Init error: ${error.message}`, true));

async function init() {
  await loadSettings();

  intervalInput.addEventListener("input", persistSettings);
  saveImageInput.addEventListener("change", persistSettings);
  saveVideoInput.addEventListener("change", persistSettings);
  promptsInput.addEventListener("input", persistSettings);

  startBtn.addEventListener("click", onStart);
  stopBtn.addEventListener("click", onStop);

  setStatus("Ready.");
}

async function loadSettings() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const settings = data[STORAGE_KEY] || {};

  intervalInput.value = settings.intervalSeconds || 15;
  saveImageInput.checked = settings.saveImage ?? true;
  saveVideoInput.checked = settings.saveVideo ?? true;
  promptsInput.value = settings.promptsText || "";
}

async function persistSettings() {
  const existing =
    (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || {};
  const updated = {
    ...existing,
    intervalSeconds: Number(intervalInput.value || 15),
    saveImage: saveImageInput.checked,
    saveVideo: saveVideoInput.checked,
    promptsText: promptsInput.value,
  };
  await chrome.storage.local.set({ [STORAGE_KEY]: updated });
}

async function onStart() {
  const prompts = promptsInput.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!prompts.length) {
    setStatus("Please add at least one prompt line.", true);
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus("Cannot detect active tab.", true);
    return;
  }

  if (!tab.url?.includes("labs.google")) {
    setStatus("Open labs.google Flow first.", true);
    return;
  }

  const payload = {
    type: "START_AUTOMATION",
    config: {
      prompts,
      intervalMs: Math.max(1, Number(intervalInput.value || 15)) * 1000,
      saveImage: !!saveImageInput.checked,
      saveVideo: !!saveVideoInput.checked,
    },
  };

  const response = await chrome.tabs
    .sendMessage(tab.id, payload)
    .catch(() => null);
  if (!response?.ok) {
    setStatus(
      response?.error || "Could not start automation in this tab.",
      true,
    );
    return;
  }

  await persistSettings();
  setStatus(`Started. Total prompts: ${prompts.length}`);
}

async function onStop() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus("Cannot detect active tab.", true);
    return;
  }

  const response = await chrome.tabs
    .sendMessage(tab.id, { type: "STOP_AUTOMATION" })
    .catch(() => null);

  if (!response?.ok) {
    setStatus(response?.error || "Could not stop automation.", true);
    return;
  }

  setStatus("Stop requested.");
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#8a1d1d" : "#2f594a";
}
