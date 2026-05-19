import { sleepMilliseconds, isVisible, pauseBeforeStep } from "./utils";
import { appendAutomationLog, saveMatchedImageNames } from "./storage";
import {
  findPromptInput,
  findSendButton,
  findModelButton,
  findVideoReferencesTab,
  findVideoModelDropdownButton,
  findReferenceImageOpenButton,
  findReferenceImageSearchInput,
  findButtonByText,
  findImgItemByAlt,
  waitForDialog,
  waitForMenu,
} from "./dom-finders";
import {
  countMainMediaItems,
  getLatestMainMediaContainer,
} from "./media-utils";
import { cleanPromptText, formatSceneName } from "./formatting";
import { state, TEST_MODE } from "./constants";

let pageInteractionLock: Promise<void> = Promise.resolve();

type DebuggerMouseButton = "left" | "right" | "middle";

async function withPageInteractionLock<T>(
  action: () => Promise<T>,
): Promise<T> {
  const previousLock = pageInteractionLock;
  let releaseLock: (() => void) | null = null;

  pageInteractionLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  await previousLock;

  try {
    return await action();
  } finally {
    releaseLock?.();
  }
}

function getTypingDelay(character: string): number {
  if (character === " ") {
    return 5;
  }

  if (/[.,;:!?]/.test(character)) {
    return 6;
  }

  return 4;
}

async function typeTextIntoField(
  field: HTMLInputElement | HTMLTextAreaElement,
  text: string,
): Promise<void> {
  field.focus();
  field.select();
  field.value = "";
  field.dispatchEvent(new Event("input", { bubbles: true }));

  for (const character of text) {
    field.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: character,
      }),
    );
    field.dispatchEvent(
      new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: character,
      }),
    );
    field.value += character;
    field.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: character,
      }),
    );
    field.dispatchEvent(
      new KeyboardEvent("keyup", {
        bubbles: true,
        cancelable: true,
        key: character,
      }),
    );
    await sleepMilliseconds(getTypingDelay(character));
  }

  field.dispatchEvent(new Event("change", { bubbles: true }));
}

async function waitForTransientUiToClose(timeoutMs: number): Promise<boolean> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const hasVisibleDialog = Array.from(
      document.querySelectorAll("div[role='dialog']"),
    ).some((dialog) => isVisible(dialog as HTMLElement));
    const menu = document.querySelector("[role='menu']") as HTMLElement | null;
    const hasVisibleMenu = !!menu && isVisible(menu);

    if (!hasVisibleDialog && !hasVisibleMenu) {
      return true;
    }

    await sleepMilliseconds(120);
  }

  return false;
}

async function ensurePageCanOpenNativeUi(timeoutMs = 2000): Promise<boolean> {
  if (!document.hidden && document.hasFocus()) {
    return true;
  }

  const response = await chrome.runtime
    .sendMessage({ type: "FOCUS_SENDER_TAB" })
    .catch(() => null);

  if (!response?.ok) {
    return !document.hidden;
  }

  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (!document.hidden && document.hasFocus()) {
      return true;
    }

    await sleepMilliseconds(50);
  }

  return !document.hidden;
}

function getElementClickPoint(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + Math.max(1, Math.min(rect.width / 2, rect.width - 1)),
    y: rect.top + Math.max(1, Math.min(rect.height / 2, rect.height - 1)),
  };
}

export function randomInt(min: number, max: number): number {
  const lower = Math.ceil(Math.min(min, max));
  const upper = Math.floor(Math.max(min, max));
  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

function dispatchHoverEvents(element: HTMLElement): void {
  const { x, y } = getElementClickPoint(element);
  const hoverEvents: Array<
    | "pointerover"
    | "pointerenter"
    | "mouseover"
    | "mouseenter"
    | "pointermove"
    | "mousemove"
  > = [
    "pointerover",
    "pointerenter",
    "mouseover",
    "mouseenter",
    "pointermove",
    "mousemove",
  ];

  for (const eventName of hoverEvents) {
    element.dispatchEvent(
      new MouseEvent(eventName, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        view: window,
      }),
    );
  }
}

function getHoverCandidates(mediaContainer: HTMLElement): HTMLElement[] {
  const candidates = [
    mediaContainer,
    mediaContainer.querySelector("video"),
    mediaContainer.querySelector("img"),
    mediaContainer.parentElement,
    mediaContainer.previousElementSibling,
    mediaContainer.nextElementSibling,
  ].filter(
    (element): element is HTMLElement =>
      !!element && element instanceof HTMLElement && isVisible(element),
  );

  return Array.from(new Set(candidates));
}

async function simulateHumanPresenceBeforeDownload(
  mediaContainer: HTMLElement,
): Promise<void> {
  mediaContainer.scrollIntoView({ block: "center", inline: "nearest" });
  await sleepMilliseconds(randomInt(180, 420));

  const scrollSteps = randomInt(1, 3);
  for (let index = 0; index < scrollSteps; index += 1) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    window.scrollBy({
      top: direction * randomInt(40, 180),
      behavior: "smooth",
    });
    await sleepMilliseconds(randomInt(220, 520));
  }

  mediaContainer.scrollIntoView({ block: "center", inline: "nearest" });
  await sleepMilliseconds(randomInt(160, 320));

  const hoverCandidates = getHoverCandidates(mediaContainer);
  const hoverCount = Math.min(hoverCandidates.length, randomInt(2, 4));

  for (let index = 0; index < hoverCount; index += 1) {
    const candidate = hoverCandidates[index];
    candidate.focus?.();
    dispatchHoverEvents(candidate);
    await sleepMilliseconds(randomInt(450, 1100));
  }

  await sleepMilliseconds(randomInt(450, 1100));
}

async function debuggerClickAtPoint(
  x: number,
  y: number,
  button: DebuggerMouseButton = "left",
): Promise<boolean> {
  const response = await chrome.runtime
    .sendMessage({
      type: "DEBUGGER_CLICK",
      x,
      y,
      button,
    })
    .catch(() => null);

  return !!response?.ok;
}

async function debuggerClickElement(
  element: HTMLElement,
  button: DebuggerMouseButton = "left",
): Promise<boolean> {
  if (!isVisible(element)) {
    return false;
  }

  element.scrollIntoView({ block: "center", inline: "nearest" });
  element.focus();
  await sleepMilliseconds(80);

  const { x, y } = getElementClickPoint(element);
  return debuggerClickAtPoint(x, y, button);
}

// Hàm hỗ trợ gõ từng ký tự
async function typeChar(element: HTMLElement, char: string): Promise<void> {
  const eventObj = { key: char, char: char, bubbles: true };
  element.dispatchEvent(new KeyboardEvent("keydown", eventObj));
  element.dispatchEvent(new KeyboardEvent("keypress", eventObj));

  // Cập nhật giá trị trực tiếp cho input
  if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
    const input = element as HTMLInputElement | HTMLTextAreaElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value =
      input.value.substring(0, start) + char + input.value.substring(end);
    input.selectionStart = input.selectionEnd = start + 1;
  }

  element.dispatchEvent(new InputEvent("input", { data: char, bubbles: true }));
  element.dispatchEvent(new KeyboardEvent("keyup", eventObj));
}

// Hàm hỗ trợ xoá ký tự (Backspace)
async function backspace(element: HTMLElement): Promise<void> {
  element.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Backspace",
      keyCode: 8,
      bubbles: true,
    }),
  );
  if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
    const input = element as HTMLInputElement | HTMLTextAreaElement;
    input.value = input.value.slice(0, -1);
  }
  element.dispatchEvent(new InputEvent("input", { bubbles: true }));
  element.dispatchEvent(
    new KeyboardEvent("keyup", { key: "Backspace", keyCode: 8, bubbles: true }),
  );
}

export async function fillPromptInput(prompt: string): Promise<boolean> {
  return withPageInteractionLock(async () => {
    /**
     * Loại bỏ phần "SCENE <số>: <tên scene> |" ở đầu và "IMAGES: ..." cùng mọi nội dung phía sau.
     * Trả về phần mô tả chính giữa (đã trim).
     */

    const newPrompt = cleanPromptText(prompt);

    const promptInput = findPromptInput();
    if (!promptInput) {
      throw new Error("Could not find Flow prompt input.");
    }

    const editor = (promptInput.closest('[data-slate-editor="true"]') ||
      promptInput) as HTMLElement | null;
    if (!editor) {
      console.error("Khong tim thay khung nhap prompt!");
      return false;
    }

    editor.focus();

    // Tell the background script to start typing
    const response = await chrome.runtime.sendMessage({
      action: "PERFORM_TYPE",
      text: newPrompt,
    });
    if (response?.status === "completed") {
      console.log("This specific typing task is DONE!");
    }
    return true;
  });
}

export async function safeClick(element: HTMLElement | null): Promise<boolean> {
  if (!element || !isVisible(element)) {
    return false;
  }

  const clicked = await debuggerClickElement(element);
  if (!clicked) {
    return false;
  }

  await sleepMilliseconds(80);
  return true;
}

async function openContextMenuAtContainerCenter(
  mediaContainer: HTMLElement,
): Promise<boolean> {
  if (!mediaContainer || !isVisible(mediaContainer)) {
    return false;
  }

  const pageReady = await ensurePageCanOpenNativeUi();
  if (!pageReady) {
    return false;
  }

  mediaContainer.scrollIntoView({ block: "center", inline: "nearest" });
  await sleepMilliseconds(80);

  const rect = mediaContainer.getBoundingClientRect();
  const clientX = rect.left + rect.width / 2;
  const clientY = rect.top + rect.height / 2;

  const pointTarget = document.elementFromPoint(
    clientX,
    clientY,
  ) as HTMLElement | null;
  if (!pointTarget || !mediaContainer.contains(pointTarget)) {
    return false;
  }

  const opened = await debuggerClickAtPoint(clientX, clientY, "right");
  if (!opened) {
    return false;
  }

  return true;
}

function resolveLabsMediaUrl(url: string): string | null {
  const trimmed = String(url || "").trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed, "https://labs.google").toString();
  } catch {
    return null;
  }
}

type FlowWorkflowIdentity = {
  workflowId: string;
  projectId: string;
};

function extractFlowWorkflowIdentity(
  mediaContainer: HTMLElement,
): FlowWorkflowIdentity | null {
  const workflowLink = mediaContainer.querySelector(
    "a[href*='/fx/'][href*='/tools/flow/project/'][href*='/edit/']",
  ) as HTMLAnchorElement | null;

  const href = workflowLink?.getAttribute("href") || workflowLink?.href || "";
  if (!href) {
    return null;
  }

  try {
    const parsedUrl = new URL(href, window.location.origin);
    const match = parsedUrl.pathname.match(
      /\/project\/([^/]+)\/edit\/([^/]+)/i,
    );

    if (!match) {
      return null;
    }

    const [, projectId, workflowId] = match;
    if (!projectId || !workflowId) {
      return null;
    }

    return { projectId, workflowId };
  } catch {
    return null;
  }
}

async function patchFlowWorkflowDisplayName(
  identity: FlowWorkflowIdentity,
  displayName: string,
): Promise<boolean> {
  const response = await chrome.runtime
    .sendMessage({
      type: "PATCH_FLOW_WORKFLOW_DISPLAY_NAME",
      workflowId: identity.workflowId,
      projectId: identity.projectId,
      displayName,
    })
    .catch(() => null);

  return !!response?.ok;
}

function getDirectVideoDownloadUrl(mediaContainer: HTMLElement): string | null {
  const video = mediaContainer.querySelector(
    "video",
  ) as HTMLVideoElement | null;
  if (!video) {
    return null;
  }

  return resolveLabsMediaUrl(
    video.currentSrc || video.getAttribute("src") || "",
  );
}

function sanitizeDownloadBaseName(name: string): string {
  return String(name || "")
    .trim()
    .replace(/\.mp4$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildVideoDownloadFilename(renameTo: string): string {
  const baseName = sanitizeDownloadBaseName(renameTo) || "video";

  const now = new Date();
  const format = (date) => {
    const o = new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false, // Use 24-hour format
    }).formatToParts(date);

    // Extract parts and join them
    return (
      `${o.find((p) => p.type === "year").value}` +
      `${o.find((p) => p.type === "month").value}` +
      `${o.find((p) => p.type === "day").value}` +
      `_` +
      `${o.find((p) => p.type === "hour").value}` +
      `${o.find((p) => p.type === "minute").value}` +
      `${o.find((p) => p.type === "second").value}`
    );
  };

  return `${baseName}_${format(now)}.mp4`;
}

async function requestDirectDownload(
  url: string,
  filename?: string,
): Promise<boolean> {
  const response = await chrome.runtime
    .sendMessage({
      type: "DOWNLOAD_URL",
      url,
      filename,
    })
    .catch(() => null);

  return !!response?.ok;
}

export async function clickAndWaitForMenu(
  button: HTMLElement,
  maxRetries: number,
  timeoutPerTryMs: number,
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    await button.click();
    const menuShown = await waitForMenu(timeoutPerTryMs);
    if (menuShown) {
      return true;
    }
    await sleepMilliseconds(160);
  }

  return false;
}

export async function selectModelAndModeTab(
  mode: "image" | "video",
): Promise<void> {
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

    const menuShown = await waitForMenu(3000);
    if (!menuShown) {
      await appendAutomationLog(
        "Model menu did not appear after clicking model button.",
      );
      return;
    }

    if (mode === "video") {
      const videoOption = findButtonByText(["video"], menuShown);
      if (videoOption) {
        await videoOption.click();
        await appendAutomationLog("Selected Video option from model menu.");
      } else {
        await appendAutomationLog("Video option not found in model menu.");
      }

      await configureVideoModeModel();
      await sleepMilliseconds(300);
      await videoOption.click();
    } else {
      const imageOption = findButtonByText(["Hình ảnh"], menuShown);
      if (imageOption) {
        await imageOption.click();
        await sleepMilliseconds(200);
        await appendAutomationLog("Selected Hinh anh option from model menu.");
      } else {
        await appendAutomationLog("Hinh anh option not found in model menu.");
      }
    }
  }
}

export async function configureVideoModeModel(): Promise<void> {
  await appendAutomationLog("Click Thanh phan tab.");
  const referencesTab = findVideoReferencesTab();
  if (referencesTab) {
    await referencesTab.click();
    await sleepMilliseconds(250);
    await appendAutomationLog(`"Thanh phan" tab selected.`);
  } else {
    await appendAutomationLog("Thanh phan tab not found.");
    return;
  }

  await appendAutomationLog("Open video model dropdown.");
  const modelDropdown = findVideoModelDropdownButton();
  if (!modelDropdown) {
    await appendAutomationLog("Video model dropdown not found.");
    return;
  }

  await modelDropdown.click();
  await sleepMilliseconds(220);

  await appendAutomationLog("Choose Veo 3.1 - Lite [Lower Priority].");
  const veoLiteOption = findButtonByText([
    "veo 3.1 - lite [lower priority]",
    "veo 3.1 - lite",
  ]);
  if (veoLiteOption) {
    await veoLiteOption.click();
    await sleepMilliseconds(240);
    await appendAutomationLog(
      "Video model set to Veo 3.1 - Lite [Lower Priority].",
    );
  } else {
    await appendAutomationLog("Veo 3.1 - Lite option not found.");
  }
}

export async function selectReferenceImage(
  expectedNames: string[],
): Promise<void> {
  await withPageInteractionLock(async () => {
    const openButton = findReferenceImageOpenButton();
    if (!openButton) {
      await appendAutomationLog("Reference image open button not found.");
      return;
    }

    for (let i = 0; i < expectedNames.length; i++) {
      await openButton.focus();
      await sleepMilliseconds(randomInt(100, 200));

      await openButton.click();
      await sleepMilliseconds(randomInt(400, 600));

      const dialogAfter = await waitForDialog(500);
      if (dialogAfter) {
        const imageName = expectedNames[i];
        const matchImageName =
          state.matchedImageNames[imageName]?.trim() || imageName;

        const item = findImgItemByAlt(matchImageName, dialogAfter);
        if (item) {
          // await simulateHumanPresenceBeforeDownload(item);
        } else {
          await appendAutomationLog(
            `Could not find reference image with name "${matchImageName}".`,
          );
        }
        await sleepMilliseconds(randomInt(200, 300));

        // Tell the background script to start typing
        const response = await chrome.runtime.sendMessage({
          action: "PERFORM_TYPE",
          text: matchImageName,
        });
        if (response?.status === "completed") {
          console.log("This specific typing to matchImageName task is DONE!");
        }
        await waitForTransientUiToClose(300);
      } else {
        await appendAutomationLog(
          `Reference image dialog did not appear after clicking open button.`,
        );
      }
    }

    await sleepMilliseconds(300);
  });
}

function isTileGenerationComplete(root: HTMLElement): boolean {
  const text = (root.textContent || "").toLowerCase();
  const percentMatches = text.match(/\b(\d{1,3})\s*%\b/g) || [];
  const progressValues = percentMatches
    .map((entry) => Number(entry.replace(/[^0-9]/g, "")))
    .filter((value) => Number.isFinite(value));
  if (progressValues.length) {
    return progressValues.some((value) => value >= 99);
  }

  if (text == "") {
    return true;
  }

  if (
    state.mode === "video" &&
    text.includes("play_circle") &&
    !hasProgressPercentage(text)
  ) {
    return true;
  }
  const statusTerms = ["dang tao", "dang xu ly", "generating", "processing"];

  // Strict mode: if no explicit percentage is present, do not consider done.
  if (statusTerms.some((term) => text.includes(term))) {
    return false;
  }

  return false;
}

function hasProgressPercentage(text: string): boolean {
  return /\d{1,3}\s*%/.test(text);
}

function escapeSelectorValue(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }

  return value.replace(/['"\\]/g, "\\$&");
}

function getTileContainerById(tileId: string): HTMLElement | null {
  const escapedId = escapeSelectorValue(tileId);
  const nodes = Array.from(
    document.querySelectorAll(`[data-tile-id='${escapedId}']`),
  ) as HTMLElement[];

  const visibleNode = nodes.find(isVisible) || nodes[0] || null;
  if (!visibleNode) {
    return null;
  }

  const container = visibleNode.closest(
    "div[data-index][data-item-index], [data-tile-id]",
  ) as HTMLElement | null;
  return container || visibleNode;
}

export function getTopRowTileIds(): string[] {
  const tileIds: string[] = [];
  const seen = new Set<string>();

  const topRowItems = Array.from(
    document.querySelectorAll("div[data-index='0'][data-item-index]"),
  ) as HTMLElement[];

  for (const rowItem of topRowItems) {
    const tile = rowItem.querySelector("[data-tile-id]") as HTMLElement | null;
    const id = (tile?.getAttribute("data-tile-id") || "").trim();
    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);
    tileIds.push(id);
  }

  return tileIds;
}

export async function waitForNewTopRowTileId(
  existingIds: Set<string>,
  waitMs: number,
  shouldStop: () => boolean,
): Promise<string | null> {
  const findNewTileId = (): string | null => {
    const latestIds = getTopRowTileIds();
    for (const id of latestIds) {
      if (TEST_MODE ? existingIds.has(id) : !existingIds.has(id)) {
        return id;
      }
    }

    return null;
  };

  const immediate = findNewTileId();
  if (immediate) {
    return immediate;
  }

  return new Promise<string | null>((resolve) => {
    const started = Date.now();
    const observerRoot = document.body;

    if (!observerRoot) {
      resolve(null);
      return;
    }

    let done = false;
    let pollTimer = 0;

    const finalize = (result: string | null): void => {
      if (done) {
        return;
      }
      done = true;
      observer.disconnect();
      window.clearInterval(pollTimer);
      resolve(result);
    };

    const checkNow = (): void => {
      if (shouldStop()) {
        finalize(null);
        return;
      }

      if (Date.now() - started >= waitMs) {
        finalize(null);
        return;
      }

      const newId = findNewTileId();
      if (newId) {
        finalize(newId);
      }
    };

    const observer = new MutationObserver(() => {
      checkNow();
    });

    observer.observe(observerRoot, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["style", "class", "data-state", "data-index"],
    });

    pollTimer = window.setInterval(checkNow, 500);
    checkNow();
  });
}

export async function waitForTileDoneById(
  tileId: string,
  waitMs: number,
  shouldStop: () => boolean,
): Promise<
  | { status: "completed"; tile: HTMLElement }
  | { status: "failed" }
  | { status: "timeout" }
  | { status: "stopped" }
> {
  await sleepMilliseconds(2000);

  const started = Date.now();

  const getTileResult = ():
    | { status: "completed"; tile: HTMLElement }
    | { status: "failed" }
    | null => {
    const tile = getTileContainerById(tileId);
    if (!tile) {
      return null;
    }

    if (isTileGenerationComplete(tile)) {
      return { status: "completed", tile };
    }

    const text = (tile.textContent || "").toLowerCase();
    if (
      text.includes("flow đang có lượng truy cập cao") ||
      text.includes("we noticed some unusual activity")
    ) {
      return { status: "failed" };
    }

    if (
      (text.includes("không thành công") && !hasProgressPercentage(text)) ||
      text.includes("Không tạo được âm thanh")
    ) {
      return { status: "failed" };
    }

    return null;
  };

  const immediate = getTileResult();
  if (immediate) {
    return immediate;
  }

  return new Promise<
    | { status: "completed"; tile: HTMLElement }
    | { status: "failed" }
    | { status: "timeout" }
    | { status: "stopped" }
  >((resolve) => {
    const observerRoot = document.body;

    if (!observerRoot) {
      resolve({ status: "timeout" });
      return;
    }

    let done = false;
    let pollTimer = 0;

    const finalize = (
      result:
        | { status: "completed"; tile: HTMLElement }
        | { status: "failed" }
        | { status: "timeout" }
        | { status: "stopped" },
    ): void => {
      if (done) {
        return;
      }
      done = true;
      observer.disconnect();
      window.clearInterval(pollTimer);
      resolve(result);
    };

    const checkNow = (): void => {
      if (done) {
        return;
      }

      if (shouldStop()) {
        finalize({ status: "stopped" });
        return;
      }

      if (Date.now() - started >= waitMs) {
        finalize({ status: "timeout" });
        return;
      }

      const tileResult = getTileResult();
      if (tileResult) {
        finalize(tileResult);
      }
    };

    const observer = new MutationObserver(() => {
      checkNow();
    });

    observer.observe(observerRoot, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["style", "class", "data-state", "data-index"],
    });

    pollTimer = window.setInterval(checkNow, 1000);
    checkNow();
  });
}

export async function renameMediaItem(
  mediaContainer: HTMLElement,
  newName: string,
): Promise<boolean> {
  return withPageInteractionLock(async () => {
    await simulateHumanPresenceBeforeDownload(mediaContainer);

    const trimmed = String(newName || "").trim();
    if (!trimmed) {
      return false;
    }
    const identity = extractFlowWorkflowIdentity(mediaContainer);
    if (!identity) {
      return false;
    }

    return patchFlowWorkflowDisplayName(identity, trimmed);
  });
}

export async function downloadMediaItem(
  mediaContainer: HTMLElement,
  renameTo = "video",
): Promise<boolean> {
  return withPageInteractionLock(async () => {
    const videoUrl = getDirectVideoDownloadUrl(mediaContainer);
    if (videoUrl) {
      await simulateHumanPresenceBeforeDownload(mediaContainer);

      const filename = buildVideoDownloadFilename(renameTo);
      await appendAutomationLog(
        `Downloading video directly from ${videoUrl} as ${filename}`,
      );
      return requestDirectDownload(videoUrl, filename);
    }

    return false;
  });
}

export async function getImageNameFromMediaContainer(
  mediaContainer: HTMLElement,
  imageName: string,
): Promise<boolean> {
  return withPageInteractionLock(async () => {
    if (mediaContainer) {
      await sleepMilliseconds(500);
      await simulateHumanPresenceBeforeDownload(mediaContainer);
      await sleepMilliseconds(500);

      const text = mediaContainer.textContent || "";
      // get the text after the text "image"  const match = text.match(/image\s*[:\-]?\s*(.+)/i);
      const match = text.match(/IMAGE\s*[:\-]?\s*(.+)/i);
      let name = "";
      if (match && match[1]) {
        name = match[1].trim();
      }
      if (name) {
        state.matchedImageNames[imageName] = name;
        await saveMatchedImageNames(state.matchedImageNames);
        await appendAutomationLog(
          `Stored image name match: ${imageName} -> ${name}`,
        );
        return true;
      } else {
        await appendAutomationLog(
          `Could not extract image name for ${imageName} from media container.`,
        );
      }

      return false;
    }
  });
}

export async function waitForMediaIncrease(
  beforeCount: number,
  waitMs: number,
  shouldStop: () => boolean,
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < waitMs) {
    if (shouldStop()) {
      return;
    }

    if (countMainMediaItems() > beforeCount) {
      return;
    }

    await sleepMilliseconds(1200);
  }

  await appendAutomationLog("No new media detected before timeout.");
}

export async function waitBlurForActiveTile(
  mediaContainer: HTMLElement,
  waitMs: number,
): Promise<boolean> {
  // Find the opacity layer which indicates the tile is active
  const opacityLayer = mediaContainer.querySelector(
    "div[style*='--blur-amount']",
  ) as HTMLElement | null;
  if (!opacityLayer) {
    await sleepMilliseconds(waitMs);
    return true;
  }

  // Wait for the opacity layer to disappear, indicating the tile is no longer active
  const start = Date.now();
  while (opacityLayer.style.getPropertyValue("--blur-amount") === "0px") {
    if (Date.now() - start > waitMs) {
      return true;
    }
    await sleepMilliseconds(100);
  }
  await sleepMilliseconds(100);
  return true;
}
