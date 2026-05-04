const state = {
  running: false,
  stopRequested: false,
  prompts: [],
  intervalMs: 15000,
  saveImage: true,
  saveVideo: true,
  downloadedButtonIds: new Set(),
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "START_AUTOMATION") {
    startAutomation(message.config)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "STOP_AUTOMATION") {
    state.stopRequested = true;
    sendResponse({ ok: true });
    return;
  }

  sendResponse({ ok: false, error: "Unknown message." });
});

async function startAutomation(config) {
  if (state.running) {
    throw new Error("Automation is already running.");
  }

  if (!Array.isArray(config?.prompts) || !config.prompts.length) {
    throw new Error("No prompts provided.");
  }

  state.running = true;
  state.stopRequested = false;
  state.prompts = config.prompts;
  state.intervalMs = Math.max(1000, Number(config.intervalMs || 15000));
  state.saveImage = !!config.saveImage;
  state.saveVideo = !!config.saveVideo;
  state.downloadedButtonIds.clear();

  await chrome.runtime.sendMessage({ type: "CLEAR_DOWNLOAD_QUEUE" });

  try {
    for (const prompt of state.prompts) {
      if (state.stopRequested) {
        break;
      }

      await sendPrompt(prompt);
      await monitorAndDownload(prompt, state.intervalMs);
    }
  } finally {
    state.running = false;
  }
}

async function sendPrompt(prompt) {
  const promptInput = findPromptInput();
  if (!promptInput) {
    throw new Error("Could not find Flow prompt input.");
  }

  setInputValue(promptInput, prompt);
  const sendButton = findSendButton();

  if (!sendButton) {
    throw new Error("Could not find send button.");
  }

  sendButton.click();
}

async function monitorAndDownload(prompt, waitMs) {
  const started = Date.now();
  const maxMonitorMs = Math.max(waitMs, 35000);

  while (Date.now() - started < maxMonitorMs) {
    if (state.stopRequested) {
      return;
    }

    clickRetryButtons();

    if (state.saveImage || state.saveVideo) {
      await clickDownloadButtons(prompt);
    }

    await sleep(1300);
  }
}

async function clickDownloadButtons(prompt) {
  const sceneName = extractSceneName(prompt);
  const buttons = Array.from(
    document.querySelectorAll("button, a, [role='button']"),
  );

  for (const button of buttons) {
    const meta = readButtonMeta(button);
    if (!meta) {
      continue;
    }

    const buttonId = getStableButtonId(button, meta.label);
    if (state.downloadedButtonIds.has(buttonId)) {
      continue;
    }

    if (meta.mediaType === "image" && !state.saveImage) {
      continue;
    }

    if (meta.mediaType === "video" && !state.saveVideo) {
      continue;
    }

    await chrome.runtime.sendMessage({
      type: "REGISTER_DOWNLOAD_NAME",
      sceneName,
      mediaType: meta.mediaType,
    });

    button.click();
    state.downloadedButtonIds.add(buttonId);
    await sleep(250);
  }
}

function clickRetryButtons() {
  const buttons = Array.from(
    document.querySelectorAll("button, [role='button']"),
  );

  for (const button of buttons) {
    const text = (button.textContent || "").trim().toLowerCase();
    const label = (button.getAttribute("aria-label") || "")
      .trim()
      .toLowerCase();
    const combined = `${text} ${label}`;

    if (
      /retry|re-try|regenerate|re-run|rerun|try again|thử lại|tao lai|tạo lại/.test(
        combined,
      )
    ) {
      button.click();
    }
  }
}

function findPromptInput() {
  const selectors = [
    "textarea",
    "textarea[placeholder*='Prompt' i]",
    "textarea[placeholder*='Describe' i]",
    "div[contenteditable='true']",
    "[role='textbox'][contenteditable='true']",
  ];

  for (const selector of selectors) {
    const candidates = Array.from(document.querySelectorAll(selector));
    const visible = candidates.find(isVisible);
    if (visible) {
      return visible;
    }
  }

  return null;
}

function findSendButton() {
  const buttons = Array.from(
    document.querySelectorAll("button, [role='button']"),
  );

  return buttons.find((button) => {
    const text = (button.textContent || "").toLowerCase();
    const label = (button.getAttribute("aria-label") || "").toLowerCase();
    const combined = `${text} ${label}`;
    return (
      isVisible(button) &&
      /send|generate|run|create|submit|gửi|gui|tạo|tao/.test(combined)
    );
  });
}

function setInputValue(node, value) {
  node.focus();

  if (node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement) {
    node.value = value;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  node.textContent = value;
  node.dispatchEvent(new InputEvent("input", { bubbles: true, data: value }));
}

function readButtonMeta(button) {
  const text = (button.textContent || "").trim().toLowerCase();
  const label = (button.getAttribute("aria-label") || "").trim().toLowerCase();
  const title = (button.getAttribute("title") || "").trim().toLowerCase();
  const href = button.getAttribute("href") || "";
  const combined = `${text} ${label} ${title} ${href}`;

  const isDownload = /download|save|tải xuống|tai xuong|lưu|luu/.test(combined);
  if (!isDownload) {
    return null;
  }

  if (/video|\.mp4|\.webm/.test(combined)) {
    return { mediaType: "video", label: combined };
  }

  if (/image|photo|picture|\.png|\.jpg|\.jpeg/.test(combined)) {
    return { mediaType: "image", label: combined };
  }

  return null;
}

function getStableButtonId(button, fallback) {
  if (!button.dataset.flowPromptRunnerId) {
    button.dataset.flowPromptRunnerId = `${Date.now()}_${Math.random().toString(36).slice(2)}_${fallback.slice(0, 18)}`;
  }
  return button.dataset.flowPromptRunnerId;
}

function extractSceneName(prompt) {
  const trimmed = String(prompt || "").trim();
  if (!trimmed) {
    return "scene";
  }

  const match = trimmed.match(/^(SCENE\s*\d+\s*:\s*.+)$/i);
  if (match) {
    return match[1];
  }

  return trimmed.slice(0, 80);
}

function isVisible(element) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== "hidden" &&
    style.display !== "none"
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
