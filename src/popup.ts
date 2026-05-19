export {};

const STORAGE_KEY = 'flowPromptRunnerSettings';
const LOG_STORAGE_KEY = 'flowPromptRunnerLogs';

type PromptMode = 'image' | 'video';

type RunnerSettings = {
  intervalSeconds?: number;
  mode?: PromptMode;
  promptsText?: string;
  enableReferenceImages?: boolean;
  enableAutoDownload?: boolean;
  matchedImageNames?: Record<string, string>;
};

type LogEntry = {
  timestamp?: number;
  message?: string;
};

const intervalInput = document.getElementById('intervalSeconds') as HTMLInputElement;
const modeImageInput = document.getElementById('modeImage') as HTMLInputElement;
const modeVideoInput = document.getElementById('modeVideo') as HTMLInputElement;
const enableReferenceImagesInput = document.getElementById('enableReferenceImages') as HTMLInputElement;
const enableAutoDownloadInput = document.getElementById('enableAutoDownload') as HTMLInputElement;
const promptsInput = document.getElementById('prompts') as HTMLTextAreaElement;
const totalPromptsEl = document.getElementById('totalPrompts') as HTMLElement;
const statusEl = document.getElementById('status') as HTMLElement;
const clearPromptsBtn = document.getElementById('clearPromptsBtn') as HTMLButtonElement;
const importBtn = document.getElementById('importBtn') as HTMLButtonElement;
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
const logsEl = document.getElementById('logs') as HTMLElement;
const DEFAULT_PROMPTS_TEXT = 'SCENE 1: A cinematic shot of a forest at sunrise';

init().catch((error: Error) => setStatus(`Init error: ${error.message}`, true));

async function init() {
  await loadSettings();
  await loadLogs();

  intervalInput.addEventListener('input', persistSettings);
  modeImageInput.addEventListener('change', persistSettings);
  modeVideoInput.addEventListener('change', persistSettings);
  enableReferenceImagesInput.addEventListener('change', persistSettings);
  enableAutoDownloadInput.addEventListener('change', persistSettings);
  promptsInput.addEventListener('input', persistSettings);
  promptsInput.addEventListener('input', updatePromptCount);

  startBtn.addEventListener('click', onStart);
  stopBtn.addEventListener('click', onStop);
  clearPromptsBtn.addEventListener('click', onClearPrompts);
  importBtn.addEventListener('click', () => {
    void onImportPrompts();
  });

  chrome.storage.onChanged.addListener(onStorageChanged);

  setStatus('Ready.');
}

async function loadSettings() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const settings = (data[STORAGE_KEY] || {}) as RunnerSettings;

  intervalInput.value = String(settings.intervalSeconds || 15);
  const mode: PromptMode = settings.mode === 'video' ? 'video' : 'image';
  modeImageInput.checked = mode === 'image';
  modeVideoInput.checked = mode === 'video';
  enableReferenceImagesInput.checked = settings.enableReferenceImages !== false;
  enableAutoDownloadInput.checked = settings.enableAutoDownload !== false;
  promptsInput.value = settings.promptsText || '';
  updatePromptCount();
}

async function persistSettings() {
  const existing = ((await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] || {}) as RunnerSettings;
  const updated: RunnerSettings = {
    ...existing,
    intervalSeconds: Number(intervalInput.value || 15),
    mode: modeVideoInput.checked ? 'video' : 'image',
    promptsText: promptsInput.value,
    enableReferenceImages: enableReferenceImagesInput.checked,
    enableAutoDownload: enableAutoDownloadInput.checked,
  };
  await chrome.storage.local.set({ [STORAGE_KEY]: updated });
}

async function onStart() {
  const prompts = getPromptLines();
  setStatus(`Started. Total prompts: ${prompts.length}`);

  if (!prompts.length) {
    setStatus('Please add at least one prompt line.', true);
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus('Cannot detect active tab.', true);
    return;
  }

  if (!tab.url?.includes('labs.google')) {
    setStatus('Open labs.google Flow first.', true);
    return;
  }

  const ready = await ensureContentScript(tab.id);
  if (!ready) {
    setStatus('Could not attach automation to this tab. Reload the page and try again.', true);
    return;
  }

  await clearLogs();

  const payload = {
    type: 'START_AUTOMATION',
    config: {
      prompts,
      mode: modeVideoInput.checked ? 'video' : 'image',
      intervalMs: Math.max(1, Number(intervalInput.value || 15)) * 1000,
      enableReferenceImages: enableReferenceImagesInput.checked,
      enableAutoDownload: enableAutoDownloadInput.checked,
    },
  };

  const response = await chrome.tabs.sendMessage(tab.id, payload).catch(() => null);
  if (!response?.ok) {
    setStatus(response?.error || 'Could not start automation in this tab.', true);
    return;
  }

  await persistSettings();

  window.close();
}

async function onStop() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    setStatus('Cannot detect active tab.', true);
    return;
  }

  await ensureContentScript(tab.id);

  const response = await chrome.tabs.sendMessage(tab.id, { type: 'STOP_AUTOMATION' }).catch(() => null);

  if (!response?.ok) {
    setStatus(response?.error || 'Could not stop automation.', true);
    return;
  }

  setStatus('Stop requested.');
}

async function onClearPrompts() {
  promptsInput.value = '';
  updatePromptCount();
  await persistSettings();
  setStatus('Cleared all prompts.');
}

async function onImportPrompts() {
  const importedText = window.prompt('Please enter your prompt:', promptsInput.value || DEFAULT_PROMPTS_TEXT);

  if (importedText === null) {
    setStatus('Import canceled.');
    return;
  }

  const nextPrompts = importedText.trim();
  if (!nextPrompts) {
    setStatus('Nothing to import.', true);
    return;
  }

  promptsInput.value = nextPrompts;
  updatePromptCount();
  await persistSettings();
  setStatus(`Imported ${getPromptLines().length} prompts.`);
}

function getPromptLines(): string[] {
  return promptsInput.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function updatePromptCount() {
  if (!totalPromptsEl) {
    return;
  }

  totalPromptsEl.textContent = String(getPromptLines().length);
}

function setStatus(text: string, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? '#8a1d1d' : '#2f594a';
}

function onStorageChanged(changes: Record<string, chrome.storage.StorageChange>, areaName: string) {
  if (areaName !== 'local') {
    return;
  }

  if (changes[LOG_STORAGE_KEY]) {
    const nextLogs = Array.isArray(changes[LOG_STORAGE_KEY].newValue)
      ? (changes[LOG_STORAGE_KEY].newValue as LogEntry[])
      : [];
    renderLogs(nextLogs);
  }
}

async function loadLogs() {
  const data = await chrome.storage.local.get(LOG_STORAGE_KEY);
  const logs = Array.isArray(data[LOG_STORAGE_KEY]) ? (data[LOG_STORAGE_KEY] as LogEntry[]) : [];
  renderLogs(logs);
}

async function clearLogs() {
  await chrome.storage.local.set({ [LOG_STORAGE_KEY]: [] });
  renderLogs([]);
}

function renderLogs(logs: LogEntry[]) {
  if (!logsEl) {
    return;
  }

  if (!Array.isArray(logs) || !logs.length) {
    logsEl.innerHTML = '<p class="log-empty">No logs yet.</p>';
    return;
  }

  const lines = logs
    .map((entry) => {
      const message = escapeHtml(String(entry?.message || ''));
      const timeText = formatLogTime(entry?.timestamp);
      return `<p class="log-item"><span class="log-time">[${timeText}]</span>${message}</p>`;
    })
    .join('');

  logsEl.innerHTML = lines;
  logsEl.scrollTop = logsEl.scrollHeight;
}

function formatLogTime(timestamp?: number) {
  if (!timestamp) {
    return '--:--:--';
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '--:--:--';
  }

  return date.toLocaleTimeString();
}

function escapeHtml(text: string) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

async function ensureContentScript(tabId: number) {
  const ping = await chrome.tabs.sendMessage(tabId, { type: 'PING_FLOW_PROMPT_RUNNER' }).catch(() => null);

  if (ping?.ok) {
    return true;
  }

  // With CRXJS + Vite, content script file names are generated at build time.
  // We rely on manifest-declared injection and only verify reachability here.
  return false;
}
