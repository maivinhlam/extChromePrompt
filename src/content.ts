export {};

import { setupMessageListener } from "./listeners";
import { startAutomation } from "./automation";
import { LOG_STORAGE_KEY, state } from "./constants";
import { appendAutomationLog } from "./storage";

// ── Types ──────────────────────────────────────────────
type PromptMode = "image" | "video";
type RunnerSettings = {
  intervalSeconds?: number;
  mode?: PromptMode;
  promptsText?: string;
};
type LogEntry = { timestamp?: number; message?: string };

const STORAGE_KEY = "flowPromptRunnerSettings";
const DEFAULT_PROMPTS_TEXT = "SCENE 1: A cinematic shot of a forest at sunrise";

setupMessageListener();
injectPanel();

function injectPanel(): void {
  if (document.getElementById("flow-prompt-runner-host")) {
    return;
  }

  const host = document.createElement("div");
  host.id = "flow-prompt-runner-host";

  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    #wrapper {
      position: fixed;
      top: 72px;
      right: 16px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.28);
      background: #fff8f0;
      width: 420px;
      max-width: calc(100vw - 24px);
    }
    #drag-handle {
      background: #be5d2d;
      color: #fff;
      padding: 7px 12px;
      cursor: grab;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      user-select: none;
      font-family: "Segoe UI", sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.2px;
      flex-shrink: 0;
    }
    #drag-handle:active { cursor: grabbing; }
    #drag-title { flex: 1; }
    #collapse-btn, #close-btn {
      background: none;
      border: none;
      color: #fff;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      padding: 2px 4px;
      border-radius: 4px;
      opacity: 0.85;
    }
    #collapse-btn:hover, #close-btn:hover { opacity: 1; background: rgba(255,255,255,0.18); }
    #panel-wrap {
      display: block;
      overflow: hidden;
      transition: height 0.2s ease;
      background: #fff8f0;
    }
    #panel-wrap.collapsed { height: 0 !important; }
    .panel {
      margin: 0;
      padding: 14px;
      min-height: 560px;
      display: flex;
      flex-direction: column;
      color: #2c2a28;
      font-family: "Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif;
    }
    .panel h1 {
      margin: 0 0 12px;
      font-size: 20px;
      letter-spacing: 0.2px;
    }
    .mode-group {
      margin: 0 0 8px;
      border: 1px solid #d7c7b8;
      border-radius: 10px;
      padding: 8px 10px;
      display: flex;
      gap: 14px;
      align-items: center;
    }
    .mode-group legend {
      padding: 0 6px;
      font-size: 12px;
      color: #6d665f;
      font-weight: 600;
    }
    .mode-item {
      margin: 0;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
    }
    .field-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 10px;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 600;
    }
    #prompts {
      width: 100%;
      resize: vertical;
      min-height: 180px;
      line-height: 1.35;
      border: 1px solid #d7c7b8;
      border-radius: 10px;
      padding: 10px;
      font-size: 13px;
      background: #fff;
    }
    .status-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 10px;
    }
    #status {
      margin: 0;
      font-size: 12px;
      color: #2f594a;
      min-height: 1em;
    }
    .clear-prompts-btn {
      border: 0;
      border-radius: 10px;
      padding: 6px 10px;
      line-height: 1;
      font-size: 12px;
      white-space: nowrap;
      cursor: pointer;
      color: #fff;
      background: #7f7468;
      font-weight: 700;
    }
    .clear-prompts-btn:hover { background: #5f564d; }
    .bottom-bar {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 12px;
      padding-top: 12px;
      flex-wrap: nowrap;
    }
    .interval-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      margin: 0;
    }
    #intervalSeconds {
      width: 58px;
      padding: 6px 8px;
      border-radius: 8px;
      border: 1px solid #d7c7b8;
      font-size: 13px;
      background: #fff;
    }
    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 12px;
    }
    .actions button {
      border: 0;
      border-radius: 10px;
      padding: 10px 12px;
      font-weight: 700;
      letter-spacing: 0.2px;
      cursor: pointer;
      color: #fff;
      background: #be5d2d;
    }
    .actions button:hover { background: #93431f; }
    #stopBtn {
      background: #7f7468;
    }
    #stopBtn:hover { background: #5f564d; }
    .logs-section {
      margin-top: 12px;
    }
    .logs-section h2 {
      margin: 0 0 6px;
      font-size: 12px;
      color: #6d665f;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    #logs {
      border: 1px solid #d7c7b8;
      border-radius: 10px;
      background: #fff;
      padding: 8px;
      height: 300px;
      overflow-y: auto;
      font-size: 12px;
      line-height: 1.35;
    }
    .log-item {
      margin: 0 0 6px;
      color: #36312d;
      word-break: break-word;
    }
    .log-item:last-child { margin-bottom: 0; }
    .log-time {
      color: #6d665f;
      margin-right: 6px;
    }
    .log-empty {
      color: #6d665f;
    }
    #reopen-btn {
      position: fixed;
      top: 72px;
      right: 16px;
      z-index: 2147483647;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #be5d2d;
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 22px;
      display: none;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.30);
    }
    #reopen-btn:hover { background: #93431f; }
    #reopen-btn.visible { display: flex; }
    .import-btn-row {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    #importBtn {
      flex: 1;
      border: 0;
      border-radius: 10px;
      padding: 10px 12px;
      font-weight: 700;
      letter-spacing: 0.2px;
      cursor: pointer;
      color: #fff;
      background: #be5d2d;
      font-size: 13px;
    }
    #importBtn:hover { background: #93431f; }
  `;

  const wrapper = document.createElement("div");
  wrapper.id = "wrapper";

  const dragHandle = document.createElement("div");
  dragHandle.id = "drag-handle";
  dragHandle.innerHTML = `
    <span id="drag-title">⚡ Flow Prompt Runner</span>
    <button id="collapse-btn" title="Collapse">−</button>
    <button id="close-btn" title="Close">✕</button>
  `;

  const panelWrap = document.createElement("div");
  panelWrap.id = "panel-wrap";
  panelWrap.innerHTML = `
    <main class="panel">
      <h1>Flow Prompt Runner</h1>

      <fieldset class="mode-group">
        <legend>Mode</legend>
        <label class="mode-item">
          <input id="modeImage" type="radio" name="runMode" value="image" checked />
          <span>Create image</span>
        </label>
        <label class="mode-item">
          <input id="modeVideo" type="radio" name="runMode" value="video" />
          <span>Create video</span>
        </label>
      </fieldset>

      <label for="prompts" class="field-header">
        <span>Prompts (one line each)</span>
        <span>Total: <span id="totalPrompts">0</span></span>
      </label>

      <textarea id="prompts" placeholder="SCENE 1: A cinematic shot of a forest at sunrise"></textarea>

      <div class="status-row">
        <p id="status">Ready.</p>
        <button id="clearPromptsBtn" type="button" class="clear-prompts-btn">Clear</button>
      </div>

      <div class="import-btn-row">
        <button id="importBtn" type="button">Import Prompt</button>
      </div>

      <div class="bottom-bar">
        <label class="interval-item">
          <span>Time between two prompt</span>
          <input id="intervalSeconds" type="text" inputmode="numeric" value="15" />
          <span>seconds</span>
        </label>
      </div>

      <div class="actions">
        <button id="startBtn" type="button">Start</button>
        <button id="stopBtn" type="button">Stop</button>
      </div>
    </main>
  `;

  wrapper.appendChild(dragHandle);
  wrapper.appendChild(panelWrap);

  const reopenBtn = document.createElement("button");
  reopenBtn.id = "reopen-btn";
  reopenBtn.title = "Open Flow Prompt Runner";
  reopenBtn.textContent = "⚡";

  shadow.appendChild(style);
  shadow.appendChild(wrapper);
  shadow.appendChild(reopenBtn);

  document.body.appendChild(host);

  // ── Drag ──────────────────────────────────────────────
  let posTop = 72;
  let posRight = 16;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  dragHandle.addEventListener("mousedown", (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.id === "collapse-btn" || target.id === "close-btn") {
      return;
    }
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e: MouseEvent) => {
    if (!dragging) {
      return;
    }
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    posTop = Math.max(0, posTop + dy);
    posRight = Math.max(0, posRight - dx);

    wrapper.style.top = `${posTop}px`;
    wrapper.style.right = `${posRight}px`;
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });

  // ── Collapse / Expand ─────────────────────────────────
  const collapseBtn = shadow.getElementById(
    "collapse-btn",
  ) as HTMLButtonElement;

  let collapsed = false;
  panelWrap.style.height = "560px";

  collapseBtn.addEventListener("click", () => {
    collapsed = !collapsed;
    if (collapsed) {
      panelWrap.classList.add("collapsed");
      collapseBtn.textContent = "+";
      collapseBtn.title = "Expand";
    } else {
      panelWrap.classList.remove("collapsed");
      collapseBtn.textContent = "−";
      collapseBtn.title = "Collapse";
    }
  });

  // ── Close / Reopen ────────────────────────────────────
  const closeBtn = shadow.getElementById("close-btn") as HTMLButtonElement;

  closeBtn.addEventListener("click", () => {
    wrapper.style.display = "none";
    reopenBtn.style.top = `${posTop}px`;
    reopenBtn.style.right = `${posRight}px`;
    reopenBtn.classList.add("visible");
  });

  reopenBtn.addEventListener("click", () => {
    wrapper.style.display = "flex";
    reopenBtn.classList.remove("visible");
  });

  const intervalInput = shadow.getElementById(
    "intervalSeconds",
  ) as HTMLInputElement;
  const modeImageInput = shadow.getElementById("modeImage") as HTMLInputElement;
  const modeVideoInput = shadow.getElementById("modeVideo") as HTMLInputElement;
  const promptsInput = shadow.getElementById("prompts") as HTMLTextAreaElement;
  const totalPromptsEl = shadow.getElementById("totalPrompts") as HTMLElement;
  const statusEl = shadow.getElementById("status") as HTMLElement;
  const clearPromptsBtn = shadow.getElementById(
    "clearPromptsBtn",
  ) as HTMLButtonElement;
  const importBtn = shadow.getElementById("importBtn") as HTMLButtonElement;
  const startBtn = shadow.getElementById("startBtn") as HTMLButtonElement;
  const stopBtn = shadow.getElementById("stopBtn") as HTMLButtonElement;

  const getPromptLines = (): string[] =>
    promptsInput.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const updatePromptCount = (): void => {
    totalPromptsEl.textContent = String(getPromptLines().length);
  };

  const setStatus = (text: string, isError = false): void => {
    statusEl.textContent = text;
    statusEl.style.color = isError ? "#8a1d1d" : "#2f594a";
  };

  const getIntervalSeconds = (): number => {
    const digitsOnly = intervalInput.value.replace(/\D+/g, "");
    const parsed = Number(digitsOnly);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
  };

  const normalizeIntervalInput = (): void => {
    intervalInput.value = String(getIntervalSeconds());
  };

  const formatLogTime = (timestamp?: number): string => {
    if (!timestamp) {
      return "--:--:--";
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return "--:--:--";
    }
    return date.toLocaleTimeString();
  };

  const escapeHtml = (text: string): string =>
    text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  const persistSettings = async (): Promise<void> => {
    const existing = ((await chrome.storage.local.get(STORAGE_KEY))[
      STORAGE_KEY
    ] || {}) as RunnerSettings;
    const updated: RunnerSettings = {
      ...existing,
      intervalSeconds: getIntervalSeconds(),
      mode: modeVideoInput.checked ? "video" : "image",
      promptsText: promptsInput.value,
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: updated });
  };

  const loadSettings = async (): Promise<void> => {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const settings = (data[STORAGE_KEY] || {}) as RunnerSettings;

    intervalInput.value = String(settings.intervalSeconds || 15);
    console.log(
      "🚀 ~ loadSettings ~ intervalInput.value:",
      intervalInput.value,
    );

    const mode: PromptMode = settings.mode === "video" ? "video" : "image";
    modeImageInput.checked = mode === "image";
    modeVideoInput.checked = mode === "video";
    promptsInput.value = settings.promptsText || "";
    updatePromptCount();
  };
  const clearLogs = async (): Promise<void> => {
    await chrome.storage.local.set({ [LOG_STORAGE_KEY]: [] });
  };

  const onStart = async (): Promise<void> => {
    if (state.running) {
      setStatus("Automation is already running.", true);
      return;
    }

    const prompts = getPromptLines();
    if (!prompts.length) {
      setStatus("Please add at least one prompt line.", true);
      return;
    }

    await clearLogs();
    await persistSettings();

    setStatus(`Started. Total prompts: ${prompts.length}`);

    void startAutomation({
      prompts,
      mode: modeVideoInput.checked ? "video" : "image",
      intervalMs: getIntervalSeconds() * 1000,
    }).catch((error: Error) => {
      setStatus(error.message || "Could not start automation.", true);
    });
  };

  const onStop = async (): Promise<void> => {
    state.stopRequested = true;
    await appendAutomationLog("Stop requested from embedded panel.");
    setStatus("Stop requested.");
  };

  const onClearPrompts = async (): Promise<void> => {
    promptsInput.value = "";
    updatePromptCount();
    await persistSettings();
    setStatus("Cleared all prompts.");
  };

  const onImportPrompts = async (): Promise<void> => {
    const importedText = window.prompt(
      "Please enter your prompt:",
      promptsInput.value || DEFAULT_PROMPTS_TEXT,
    );

    if (importedText === null) {
      setStatus("Import canceled.");
      return;
    }

    const nextPrompts = importedText.trim();
    if (!nextPrompts) {
      setStatus("Nothing to import.", true);
      return;
    }
    promptsInput.value = nextPrompts;
    updatePromptCount();
    await persistSettings();
    setStatus(`Imported ${getPromptLines().length} prompts.`);
  };

  const onStorageChanged = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ): void => {
    if (areaName !== "local") {
      return;
    }

    if (changes[LOG_STORAGE_KEY]) {
      const nextLogs = Array.isArray(changes[LOG_STORAGE_KEY].newValue)
        ? (changes[LOG_STORAGE_KEY].newValue as LogEntry[])
        : [];
    }
  };

  intervalInput.addEventListener("input", () => {
    intervalInput.value = intervalInput.value.replace(/\D+/g, "");
    void persistSettings();
  });
  intervalInput.addEventListener("blur", normalizeIntervalInput);
  modeImageInput.addEventListener("change", () => {
    void persistSettings();
  });
  modeVideoInput.addEventListener("change", () => {
    void persistSettings();
  });
  promptsInput.addEventListener("input", () => {
    updatePromptCount();
    void persistSettings();
  });

  startBtn.addEventListener("click", () => {
    void onStart();
  });
  stopBtn.addEventListener("click", () => {
    void onStop();
  });
  clearPromptsBtn.addEventListener("click", () => {
    void onClearPrompts();
  });

  importBtn.addEventListener("click", () => {
    void onImportPrompts();
  });

  chrome.storage.onChanged.addListener(onStorageChanged);

  void loadSettings();
}
