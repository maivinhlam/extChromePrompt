const state = {
  running: false,
  stopRequested: false,
  prompts: [],
  mode: "image",
  intervalMs: 15000,
};
const LOG_STORAGE_KEY = "flowPromptRunnerLogs";
const STEP_DELAY_MS = 1000;
const MAX_LOG_ITEMS = 300;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PING_FLOW_PROMPT_RUNNER") {
    sendResponse({ ok: true });
    return;
  }

  if (message?.type === "START_AUTOMATION") {
    startAutomation(message.config)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "STOP_AUTOMATION") {
    state.stopRequested = true;
    appendAutomationLog("Stop requested from popup.");
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
  state.mode = config.mode === "video" ? "video" : "image";
  state.intervalMs = Math.max(1000, Number(config.intervalMs || 15000));

  try {
    await appendAutomationLog(
      `Automation started. Mode: ${state.mode}. Total prompts: ${state.prompts.length}.`,
    );

    await pauseBeforeStep(`Set mode and model to ${state.mode}.`);
    let err = await selectModelAndModeTab(state.mode);
    if (err) {
      return err;
    }

    for (let i = 0; i < state.prompts.length; i += 1) {
      const prompt = state.prompts[i];
      const numbers = parseSceneNumbers(prompt, i + 1);

      if (state.stopRequested) {
        await appendAutomationLog(
          "Stop requested. Exiting before next prompt.",
        );
        break;
      }

      await appendAutomationLog(
        `Prompt ${i + 1}/${state.prompts.length}: SCENE ${numbers.scene}.`,
      );

      const mediaCountBefore = countMainMediaItems();

      await pauseBeforeStep("Fill prompt input.");
      await fillPromptInput(prompt);

      if (state.mode === "video") {
        const expectedImageName = formatSceneName(
          numbers.scene,
          "Image",
          numbers.item,
        );
        await pauseBeforeStep(`Select reference image: ${expectedImageName}.`);
        await selectReferenceImage(expectedImageName);
      }
      await pauseBeforeStep("Click Create.");
      await clickCreateButton();
      await appendAutomationLog("Waiting for generated media...");
      await waitForMediaIncrease(mediaCountBefore, state.intervalMs);

      if (state.mode === "image") {
        const imageName = formatSceneName(numbers.scene, "Image", numbers.item);
        // await pauseBeforeStep(`Rename latest media to ${imageName}.`);
        // await renameLatestGeneratedMedia(imageName);
      } else {
        const videoName = formatSceneName(numbers.scene, "Video", numbers.item);
        // await pauseBeforeStep(`Rename latest media to ${videoName}.`);
        // await renameLatestGeneratedMedia(videoName);
      }

      await sleep(900);
    }
    await appendAutomationLog("Automation completed.");
  } catch (error) {
    await appendAutomationLog(`Automation error: ${error.message}`);
    throw error;
  } finally {
    state.running = false;
  }
}

async function fillPromptInput(prompt) {
  const promptInput = findPromptInput();
  if (!promptInput) {
    throw new Error("Could not find Flow prompt input.");
  }

  setInputValue(promptInput, prompt);
  await sleep(180);
}

async function clickCreateButton() {
  const sendButton = findSendButton();

  if (!sendButton) {
    await appendAutomationLog("Could not find send button.");
    throw new Error("Could not find send button.");
  }
  await appendAutomationLog("Found send button.");

  sendButton.click();
}

async function waitForMediaIncrease(beforeCount, waitMs) {
  const started = Date.now();
  const timeoutMs = Math.max(waitMs, state.mode === "video" ? 210000 : 90000);

  while (Date.now() - started < timeoutMs) {
    if (state.stopRequested) {
      return;
    }

    if (countMainMediaItems() > beforeCount) {
      return;
    }

    await sleep(1200);
  }

  await appendAutomationLog("No new media detected before timeout.");
}
// this function return error if the expected media is not detected, caller can decide to continue or stop automation
async function selectModelAndModeTab(mode) {
  await appendAutomationLog(`Selecting ${mode} tab.`);

  const modelButton = findModelButton();
  if (modelButton) {
    const menuOpened = await clickAndWaitForMenu(modelButton, 3, 3000);
    if (!menuOpened) {
      await appendAutomationLog(
        "Model menu did not appear after clicking model button.",
      );
      return;
    }

    // check the menu is shown before looking for options
    const menuShown = await waitForMenu(3000);
    if (!menuShown) {
      await appendAutomationLog(
        "Model menu did not appear after clicking model button.",
      );
      return;
    }

    if (mode === "video") {
      const videoOption = findButtonByText(["video"]);
      if (videoOption) {
        await safeClick(videoOption);

        await appendAutomationLog("Selected Video option from model menu.");
      } else {
        await appendAutomationLog("Video option not found in model menu.");
      }
    } else {
      const imageOption = findButtonByText(["hình ảnh"]);
      if (imageOption) {
        await safeClick(imageOption);
        await sleep(200);
        await appendAutomationLog("Selected Hình ảnh option from model menu.");
      } else {
        await appendAutomationLog("Hình ảnh option not found in model menu.");
      }
    }
  }

  if (mode === "video") {
    await configureVideoModeModel();
    return;
  }
}

async function clickAndWaitForMenu(button, maxRetries, timeoutPerTryMs) {
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    await safeClick(button);
    const menuShown = await waitForMenu(timeoutPerTryMs);
    if (menuShown) {
      return true;
    }
    await sleep(160);
  }

  return false;
}

async function safeClick(element) {
  if (!element || !isVisible(element)) {
    return false;
  }

  element.scrollIntoView({ block: "center", inline: "nearest" });
  element.focus();

  // Try native click first.
  element.click();
  await sleep(80);

  const rect = element.getBoundingClientRect();
  const x = rect.left + Math.max(1, Math.min(rect.width / 2, rect.width - 1));
  const y = rect.top + Math.max(1, Math.min(rect.height / 2, rect.height - 1));

  element.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerType: "mouse",
      clientX: x,
      clientY: y,
      button: 0,
      buttons: 1,
      isPrimary: true,
    }),
  );
  element.dispatchEvent(
    new MouseEvent("mousedown", {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: 1,
    }),
  );
  element.dispatchEvent(
    new MouseEvent("mouseup", {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: 0,
    }),
  );
  element.dispatchEvent(
    new PointerEvent("pointerup", {
      bubbles: true,
      cancelable: true,
      pointerType: "mouse",
      clientX: x,
      clientY: y,
      button: 0,
      buttons: 0,
      isPrimary: true,
    }),
  );
  element.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: 0,
    }),
  );

  await sleep(80);
  return true;
}

async function configureVideoModeModel() {
  await pauseBeforeStep("Open Thành phần tab.");
  const referencesTab = findVideoReferencesTab();
  if (referencesTab) {
    await safeClick(referencesTab);
    await sleep(250);
    await appendAutomationLog("Thành phần tab selected.");
  } else {
    await appendAutomationLog("Thành phần tab not found.");
  }

  await pauseBeforeStep("Open video model dropdown.");
  const modelDropdown = findVideoModelDropdownButton();
  if (!modelDropdown) {
    await appendAutomationLog("Video model dropdown not found.");
    return;
  }

  await safeClick(modelDropdown);
  await sleep(220);

  await pauseBeforeStep("Choose Veo 3.1 - Lite [Lower Priority].");
  const veoLiteOption = findButtonByText([
    "veo 3.1 - lite [lower priority]",
    "veo 3.1 - lite",
  ]);
  if (veoLiteOption) {
    await safeClick(veoLiteOption);
    await sleep(240);
    await appendAutomationLog(
      "Video model set to Veo 3.1 - Lite [Lower Priority].",
    );
  } else {
    await appendAutomationLog("Veo 3.1 - Lite option not found.");
  }
}

async function selectReferenceImage(expectedName) {
  const openButton = findReferenceImageOpenButton();
  if (!openButton) {
    return;
  }

  openButton.click();
  const dialog = await waitForDialog(4000);
  if (!dialog) {
    return;
  }

  const item = findDialogItemByText(dialog, expectedName);
  if (item) {
    item.click();
    await sleep(200);
  }

  const confirmButton = findButtonByText(
    ["chọn", "select", "xác nhận", "confirm"],
    dialog,
  );
  if (confirmButton) {
    confirmButton.click();
    await sleep(200);
  }

  // Close the dialog if it's still open
  openButton.click();
}

async function renameLatestGeneratedMedia(newName) {
  const latest = getLatestMainMediaContainer();
  if (!latest) {
    return;
  }

  const rect = latest.getBoundingClientRect();
  latest.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + Math.min(20, rect.width / 2),
      clientY: rect.top + Math.min(20, rect.height / 2),
      button: 2,
    }),
  );
  await sleep(240);

  const renameButton = findButtonByText(["đổi tên", "rename", "whiteboard"]);
  if (!renameButton) {
    return;
  }
  renameButton.click();
  await sleep(220);

  const input =
    document.querySelector("[role='dialog'] input[type='text']") ||
    document.querySelector("[role='dialog'] textarea") ||
    document.querySelector("input[type='text']");

  if (!input) {
    return;
  }

  if (
    input instanceof HTMLInputElement ||
    input instanceof HTMLTextAreaElement
  ) {
    input.focus();
    input.value = newName;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const saveButton = findButtonByText(["đổi tên", "rename", "save"]);
  if (saveButton) {
    saveButton.click();
    await sleep(200);
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
    return isVisible(button) && /arrow_forward/.test(combined);
  });
}

function findModelButton() {
  const buttons = Array.from(
    document.querySelectorAll("button[aria-haspopup='menu']"),
  );

  const primary = buttons.find((button) => {
    if (!isVisible(button)) {
      return false;
    }

    const text = (button.textContent || "").toLowerCase();
    return (
      text.includes("nano banana") ||
      text.includes("video") ||
      text.includes("crop_16_9")
    );
  });
  if (primary) {
    return primary;
  }

  return buttons.find(isVisible) || null;
}

function findVideoReferencesTab() {
  const tabs = Array.from(document.querySelectorAll("button[role='tab']"));
  return tabs.find((tab) => {
    if (!isVisible(tab)) {
      return false;
    }

    const text = (tab.textContent || "").toLowerCase();
    const controls = (tab.getAttribute("aria-controls") || "").toLowerCase();
    const id = (tab.id || "").toLowerCase();
    return (
      text.includes("thành phần") ||
      text.includes("thanh phan") ||
      controls.includes("video_references") ||
      id.includes("video_references")
    );
  });
}

function findVideoModelDropdownButton() {
  const buttons = Array.from(
    document.querySelectorAll("button[aria-haspopup='menu']"),
  );

  const exact = buttons.find((button) => {
    if (!isVisible(button)) {
      return false;
    }

    const text = (button.textContent || "").toLowerCase();
    return text.includes("veo 3.1 - lite") && text.includes("lower priority");
  });
  if (exact) {
    return exact;
  }

  return buttons.find((button) => {
    if (!isVisible(button)) {
      return false;
    }

    const text = (button.textContent || "").toLowerCase();
    return text.includes("veo") || text.includes("video model");
  });
}

function findReferenceImageOpenButton() {
  const buttons = Array.from(document.querySelectorAll("button"));
  return buttons.find((button) => {
    if (!isVisible(button)) {
      return false;
    }

    const hasDialog = button.getAttribute("aria-haspopup") === "dialog";
    if (!hasDialog) {
      return false;
    }

    const text =
      `${button.textContent || ""} ${button.getAttribute("aria-label") || ""}`.toLowerCase();
    return /add_2|thêm|them|add|chọn|chon/.test(text);
  });
}

async function waitForDialog(timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const dialog = document.querySelector("[role='dialog']");
    if (dialog && isVisible(dialog)) {
      return dialog;
    }
    await sleep(120);
  }
  return null;
}

// check the menu is shown before looking for options
// this menu contains a text: "Quá trình tạo sẽ tốn"
async function waitForMenu(timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const menu = document.querySelector("[role='menu']");
    if (menu && isVisible(menu)) {
      return menu;
    }
    await sleep(120);
  }
  return null;
}

function findDialogItemByText(dialog, text) {
  const expected = String(text || "")
    .trim()
    .toLowerCase();
  if (!expected) {
    return null;
  }

  const candidates = Array.from(
    dialog.querySelectorAll("button, [role='button'], [data-index], li, div"),
  );
  return candidates.find((el) => {
    if (!isVisible(el)) {
      return false;
    }
    const content = (el.textContent || "").trim().toLowerCase();
    return content.includes(expected);
  });
}

function findButtonByText(terms, root = document) {
  const buttons = Array.from(
    root.querySelectorAll("button, [role='button'], [role='menuitem']"),
  );
  return buttons.find((button) => {
    if (!isVisible(button)) {
      return false;
    }

    const text =
      `${button.textContent || ""} ${button.getAttribute("aria-label") || ""}`.toLowerCase();
    return terms.some((term) => text.includes(String(term).toLowerCase()));
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

function parseSceneNumbers(prompt, fallback) {
  const text = String(prompt || "").trim();
  const fromPrompt = text.match(/scene\s*(\d+)/i);
  const scene = fromPrompt ? Number(fromPrompt[1]) : fallback;
  return {
    scene,
    item: scene,
  };
}

function formatSceneName(sceneNumber, typeLabel, itemNumber) {
  return `SCENE ${sceneNumber} - ${typeLabel} ${itemNumber}`;
}

function countMainMediaItems() {
  return getMainMediaContainers().length;
}

function getLatestMainMediaContainer() {
  const items = getMainMediaContainers();
  return items.length ? items[items.length - 1] : null;
}

function getMainMediaContainers() {
  const mediaNodes = Array.from(document.querySelectorAll("img, video"));
  const containers = [];
  const seen = new Set();

  for (const media of mediaNodes) {
    if (!isMainMediaCandidate(media)) {
      continue;
    }

    const container = findMediaContainer(media);
    if (!container) {
      continue;
    }

    if (!seen.has(container)) {
      seen.add(container);
      containers.push(container);
    }
  }

  return containers;
}

function isMainMediaCandidate(media) {
  if (!isVisible(media)) {
    return false;
  }

  if (media.closest("[role='dialog']")) {
    return false;
  }

  const rect = media.getBoundingClientRect();
  if (media.tagName.toLowerCase() === "img") {
    return rect.width >= 96 && rect.height >= 96;
  }

  if (media.tagName.toLowerCase() === "video") {
    return rect.width >= 120 && rect.height >= 80;
  }

  return false;
}

function findMediaContainer(media) {
  let node = media;
  for (let depth = 0; depth < 8; depth += 1) {
    if (!node || !(node instanceof HTMLElement)) {
      break;
    }

    const rect = node.getBoundingClientRect();
    if (rect.width >= 120 && rect.height >= 90) {
      return node;
    }

    node = node.parentElement;
  }

  return media.parentElement;
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

async function pauseBeforeStep(stepText) {
  await appendAutomationLog(`${stepText} Running in 1 seconds...`);
  await sleepWithStop(STEP_DELAY_MS);
}

async function sleepWithStop(ms) {
  const stepMs = 200;
  let elapsed = 0;

  while (elapsed < ms) {
    if (state.stopRequested) {
      return;
    }
    await sleep(stepMs);
    elapsed += stepMs;
  }
}

async function appendAutomationLog(message) {
  const entry = {
    timestamp: Date.now(),
    message: String(message || ""),
  };

  try {
    const data = await chrome.storage.local.get(LOG_STORAGE_KEY);
    const logs = Array.isArray(data[LOG_STORAGE_KEY])
      ? data[LOG_STORAGE_KEY]
      : [];
    logs.push(entry);

    if (logs.length > MAX_LOG_ITEMS) {
      logs.splice(0, logs.length - MAX_LOG_ITEMS);
    }

    await chrome.storage.local.set({ [LOG_STORAGE_KEY]: logs });
  } catch {
    // no-op
  }
}
