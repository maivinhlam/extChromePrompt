export {};

import { setupMessageListener } from "./listeners";
import { startAutomation } from "./automation";
import { LOG_STORAGE_KEY, STATUS_STORAGE_KEY, state } from "./constants";
import type { AutomationFeatures } from "./types";
import {
  appendAutomationLog,
  loadAutomationStatus,
  setAutomationStatus,
} from "./storage";

// ── Types ──────────────────────────────────────────────
type PromptMode = "image" | "video";
type RunnerSettings = {
  intervalSeconds?: number;
  mode?: PromptMode;
  promptsText?: string;
  enableReferenceImages?: boolean;
  enableAutoDownload?: boolean;
};
type LogEntry = { timestamp?: number; message?: string };

const STORAGE_KEY = "flowPromptRunnerSettings";
const DEFAULT_PROMPTS_TEXT = "SCENE 1: A cinematic shot of a forest at sunrise";
const CONTENT_PANEL_HTML_URL = chrome.runtime.getURL("content.html");

setupMessageListener();
void injectPanel();

async function injectPanel(): Promise<void> {
  if (document.getElementById("flow-prompt-runner-host")) {
    return;
  }

  const host = document.createElement("div");
  host.id = "flow-prompt-runner-host";

  const shadow = host.attachShadow({ mode: "open" });

  try {
    const response = await fetch(CONTENT_PANEL_HTML_URL);
    if (!response.ok) {
      throw new Error(`Failed to load content panel HTML: ${response.status}`);
    }

    shadow.innerHTML = await response.text();
  } catch (error) {
    console.error("Failed to inject Flow Prompt Runner panel.", error);
    return;
  }

  const wrapper = shadow.getElementById("wrapper") as HTMLDivElement | null;
  const dragHandle = shadow.getElementById(
    "drag-handle",
  ) as HTMLDivElement | null;
  const panelWrap = shadow.getElementById(
    "panel-wrap",
  ) as HTMLDivElement | null;
  const reopenBtn = shadow.getElementById(
    "reopen-btn",
  ) as HTMLButtonElement | null;

  if (!wrapper || !dragHandle || !panelWrap || !reopenBtn) {
    console.error("Content panel HTML is missing required elements.");
    return;
  }

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
  const compactStatusEl = shadow.getElementById(
    "compact-status-text",
  ) as HTMLElement | null;

  let collapsed = false;
  panelWrap.style.height = "660px";

  const setCollapsedState = (nextCollapsed: boolean): void => {
    collapsed = nextCollapsed;

    if (collapsed) {
      panelWrap.classList.add("collapsed");
      collapseBtn.textContent = "+";
      collapseBtn.title = "Expand";
      return;
    }

    panelWrap.classList.remove("collapsed");
    collapseBtn.textContent = "−";
    collapseBtn.title = "Collapse";
  };

  collapseBtn.addEventListener("click", () => {
    setCollapsedState(!collapsed);
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
  const enableReferenceImagesInput = shadow.getElementById(
    "enableReferenceImages",
  ) as HTMLInputElement;
  const enableAutoDownloadInput = shadow.getElementById(
    "enableAutoDownload",
  ) as HTMLInputElement;
  const promptsInput = shadow.getElementById("prompts") as HTMLTextAreaElement;
  const totalPromptsEl = shadow.getElementById("totalPrompts") as HTMLElement;
  const statusEl = shadow.getElementById("status") as HTMLElement;
  const logEl = shadow.getElementById("log") as HTMLElement;
  const clearPromptsBtn = shadow.getElementById(
    "clearPromptsBtn",
  ) as HTMLButtonElement;
  const importBtn = shadow.getElementById("importBtn") as HTMLButtonElement;
  const startBtn = shadow.getElementById("startBtn") as HTMLButtonElement;
  const pauseBtn = shadow.getElementById("pauseBtn") as HTMLButtonElement;
  const resumeBtn = shadow.getElementById("resumeBtn") as HTMLButtonElement;
  const stopBtn = shadow.getElementById("stopBtn") as HTMLButtonElement;

  const getPromptLines = (): string[] =>
    promptsInput.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const updatePromptCount = (): void => {
    totalPromptsEl.textContent = String(getPromptLines().length);
  };

  const updateActionButtons = (): void => {
    const isRunning = !!state.running;
    const isPaused = !!state.pauseRequested;

    startBtn.hidden = isRunning;
    pauseBtn.hidden = !isRunning || isPaused;
    resumeBtn.hidden = !isRunning || !isPaused;

    stopBtn.disabled = !isRunning;
  };

  const setStatus = (text: string, isError = false): void => {
    statusEl.textContent = text;
    statusEl.style.color = isError ? "#8a1d1d" : "#2f594a";
    if (compactStatusEl) {
      compactStatusEl.textContent = text;
      compactStatusEl.style.color = isError ? "#8a1d1d" : "#2f594a";
    }
  };

  const setLog = (text: string): void => {
    logEl.textContent = text;
  };

  const getIntervalSeconds = (): number => {
    const digitsOnly = intervalInput.value.replace(/\D+/g, "");
    const parsed = Number(digitsOnly);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
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

  const getFeatureSettings = (): AutomationFeatures => ({
    enableReferenceImages: enableReferenceImagesInput.checked,
    enableAutoDownload: enableAutoDownloadInput.checked,
  });

  const persistSettings = async (): Promise<void> => {
    const existing = ((await chrome.storage.local.get(STORAGE_KEY))[
      STORAGE_KEY
    ] || {}) as RunnerSettings;
    const updated: RunnerSettings = {
      ...existing,
      intervalSeconds: getIntervalSeconds(),
      mode: modeVideoInput.checked ? "video" : "image",
      promptsText: promptsInput.value,
      ...getFeatureSettings(),
    };
    await chrome.storage.local.set({ [STORAGE_KEY]: updated });
  };

  const loadSettings = async (): Promise<void> => {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const settings = (data[STORAGE_KEY] || {}) as RunnerSettings;

    intervalInput.value = String(settings.intervalSeconds || 15);

    const mode: PromptMode = settings.mode === "video" ? "video" : "image";
    modeImageInput.checked = mode === "image";
    modeVideoInput.checked = mode === "video";
    enableReferenceImagesInput.checked =
      settings.enableReferenceImages !== false;
    enableAutoDownloadInput.checked = settings.enableAutoDownload !== false;
    promptsInput.value = settings.promptsText || "";
    updatePromptCount();
  };
  const clearLogs = async (): Promise<void> => {
    await chrome.storage.local.set({ [LOG_STORAGE_KEY]: [] });
  };

  const onStart = async (): Promise<void> => {
    if (state.running) {
      setStatus("Automation is already running.", true);
      updateActionButtons();
      return;
    }

    const prompts = getPromptLines();
    if (!prompts.length) {
      setStatus("Please add at least one prompt line.", true);
      return;
    }

    await clearLogs();
    state.pauseRequested = false;
    await setAutomationStatus(`Started. Total prompts: ${prompts.length}`);
    await persistSettings();

    setStatus(`Started. Total prompts: ${prompts.length}`);
    setCollapsedState(true);
    const automationRun = startAutomation({
      prompts,
      mode: modeVideoInput.checked ? "video" : "image",
      intervalMs: getIntervalSeconds() * 1000,
      ...getFeatureSettings(),
    });

    updateActionButtons();

    void automationRun.catch((error: Error) => {
      state.running = false;
      state.pauseRequested = false;
      updateActionButtons();
      setStatus(error.message || "Could not start automation.", true);
    });
  };

  const onPause = async (): Promise<void> => {
    if (!state.running) {
      setStatus("Automation is not running.", true);
      updateActionButtons();
      return;
    }

    state.pauseRequested = true;
    updateActionButtons();

    await appendAutomationLog("Pause requested from embedded panel.");
    await setAutomationStatus("Pause requested.");
    setStatus("Pause requested.");
  };

  const onResume = async (): Promise<void> => {
    if (!state.running) {
      setStatus("Automation is not running.", true);
      updateActionButtons();
      return;
    }

    state.pauseRequested = false;
    updateActionButtons();

    await appendAutomationLog("Resume requested from embedded panel.");
    await setAutomationStatus("Resume requested.");
    setStatus("Resume requested.");
  };

  const onStop = async (): Promise<void> => {
    state.stopRequested = true;
    state.pauseRequested = false;
    await appendAutomationLog("Stop requested from embedded panel.");
    await setAutomationStatus("Stop requested.");
    updateActionButtons();
    setStatus("Stop requested.");
  };

  const onIncrementInterval = (): void => {
    const current = getIntervalSeconds();
    intervalInput.value = String(current + 1);
    void persistSettings();
  };

  const onDecrementInterval = (): void => {
    const current = getIntervalSeconds();
    intervalInput.value = String(Math.max(1, current - 1));
    void persistSettings();
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

    if (changes[STATUS_STORAGE_KEY]) {
      const nextStatus =
        typeof changes[STATUS_STORAGE_KEY].newValue === "string"
          ? (changes[STATUS_STORAGE_KEY].newValue as string)
          : "Ready.";

      if (
        nextStatus === "Automation completed." ||
        nextStatus === "Stop requested." ||
        nextStatus.startsWith("Automation error")
      ) {
        state.running = false;
        state.pauseRequested = false;
        updateActionButtons();
      }

      setStatus(nextStatus);
    }
  };
  modeImageInput.addEventListener("change", () => {
    void persistSettings();
  });
  modeVideoInput.addEventListener("change", () => {
    void persistSettings();
  });
  enableReferenceImagesInput.addEventListener("change", () => {
    void persistSettings();
  });
  enableAutoDownloadInput.addEventListener("change", () => {
    void persistSettings();
  });
  promptsInput.addEventListener("input", () => {
    updatePromptCount();
    void persistSettings();
  });

  const startIntervalChange = (direction: 1 | -1): (() => void) => {
    const step = (): void => {
      if (direction === 1) {
        onIncrementInterval();
        return;
      }

      onDecrementInterval();
    };

    step();
    let intervalId: number | null = null;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(step, 120);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  };

  let activePressCleanup: (() => void) | null = null;

  startBtn.addEventListener("click", () => {
    void onStart();
  });
  pauseBtn.addEventListener("click", () => {
    void onPause();
  });
  resumeBtn.addEventListener("click", () => {
    void onResume();
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

  updateActionButtons();

  void Promise.all([
    loadSettings(),
    loadAutomationStatus().then((statusText) => {
      setStatus(statusText);
    }),
  ]);
}
