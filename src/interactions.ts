import { sleep, isVisible } from "./utils";
import { appendAutomationLog } from "./storage";
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
    await sleep(getTypingDelay(character));
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

    await sleep(120);
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

    await sleep(50);
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
  await sleep(80);

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

    //   if (
    //     promptInput instanceof HTMLTextAreaElement ||
    //     promptInput instanceof HTMLInputElement
    //   ) {
    //     await typeTextIntoField(promptInput, newPrompt);
    //     console.log(`[AutoFlow] Da nhap: ${newPrompt.substring(0, 30)}...`);
    //     return true;
    //   }

    //   await sleep(120);

    //   const selection = window.getSelection();
    //   if (!selection) {
    //     return false;
    //   }

    //   const range = document.createRange();
    //   range.selectNodeContents(editor);
    //   selection.removeAllRanges();
    //   selection.addRange(range);

    //   editor.dispatchEvent(
    //     new InputEvent("beforeinput", {
    //       bubbles: true,
    //       cancelable: true,
    //       inputType: "deleteByCut",
    //       data: null,
    //     }),
    //   );
    //   document.execCommand("insertText", false, "");
    //   editor.dispatchEvent(new Event("input", { bubbles: true }));

    //   await sleep(180);

    //   const ensureCaretAtEnd = (): void => {
    //     const targetNode =
    //       editor.querySelector("span[data-slate-string='true']") || editor;
    //     const endRange = document.createRange();

    //     let caretNode: Node = targetNode;
    //     if (targetNode.firstChild) {
    //       caretNode = targetNode.firstChild;
    //     }

    //     if (caretNode.nodeType === Node.TEXT_NODE) {
    //       const length = caretNode.textContent?.length || 0;
    //       endRange.setStart(caretNode, length);
    //     } else {
    //       const childCount = caretNode.childNodes.length;
    //       endRange.setStart(caretNode, childCount);
    //     }

    //     endRange.collapse(true);
    //     selection.removeAllRanges();
    //     selection.addRange(endRange);
    //   };

    //   ensureCaretAtEnd();

    //   for (const character of newPrompt) {
    //     editor.dispatchEvent(
    //       new KeyboardEvent("keydown", {
    //         bubbles: true,
    //         cancelable: true,
    //         key: character,
    //       }),
    //     );
    //     editor.dispatchEvent(
    //       new InputEvent("beforeinput", {
    //         bubbles: true,
    //         cancelable: true,
    //         inputType: "insertText",
    //         data: character,
    //       }),
    //     );
    //     document.execCommand("insertText", false, character);
    //     editor.dispatchEvent(
    //       new InputEvent("input", {
    //         bubbles: true,
    //         cancelable: true,
    //         inputType: "insertText",
    //         data: character,
    //       }),
    //     );
    //     editor.dispatchEvent(
    //       new KeyboardEvent("keyup", {
    //         bubbles: true,
    //         cancelable: true,
    //         key: character,
    //       }),
    //     );
    //     ensureCaretAtEnd();
    //     await sleep(getTypingDelay(character) + 8);
    //   }

    //   editor.dispatchEvent(new Event("change", { bubbles: true }));

    //   await sleep(220);

    //   editor.dispatchEvent(
    //     new KeyboardEvent("keydown", {
    //       bubbles: true,
    //       cancelable: true,
    //       composed: true,
    //       key: "Enter",
    //       code: "Enter",
    //     }),
    //   );
    //   editor.dispatchEvent(
    //     new KeyboardEvent("keypress", {
    //       bubbles: true,
    //       cancelable: true,
    //       composed: true,
    //       key: "Enter",
    //       code: "Enter",
    //     }),
    //   );
    //   editor.dispatchEvent(
    //     new KeyboardEvent("keyup", {
    //       bubbles: true,
    //       cancelable: true,
    //       composed: true,
    //       key: "Enter",
    //       code: "Enter",
    //     }),
    //   );

    //   console.log(`[AutoFlow] Da nhap: ${prompt.substring(0, 30)}...`);
    //   return true;
  });
}

export async function clickCreateButton(): Promise<void> {
  const sendButton = findSendButton();

  if (!sendButton) {
    await appendAutomationLog("Could not find send button.");
    throw new Error("Could not find send button.");
  }
  await appendAutomationLog("Found send button.");
  await safeClick(sendButton);
  await appendAutomationLog("Prompt sent. Moving to next prompt immediately.");
}

export async function safeClick(element: HTMLElement | null): Promise<boolean> {
  if (!element || !isVisible(element)) {
    return false;
  }

  const clicked = await debuggerClickElement(element);
  if (!clicked) {
    return false;
  }

  await sleep(80);
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
  await sleep(80);

  const rect = mediaContainer.getBoundingClientRect();
  console.log("🚀 ~ openContextMenuAtContainerCenter ~ rect:", rect);
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

export async function clickAndWaitForMenu(
  button: HTMLElement,
  maxRetries: number,
  timeoutPerTryMs: number,
): Promise<boolean> {
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
        await safeClick(videoOption);
        await appendAutomationLog("Selected Video option from model menu.");
      } else {
        await appendAutomationLog("Video option not found in model menu.");
      }

      await configureVideoModeModel();
      await sleep(300);
      await safeClick(videoOption);
    } else {
      const imageOption = findButtonByText(["Hình ảnh"], menuShown);
      if (imageOption) {
        await safeClick(imageOption);
        await sleep(200);
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
    await safeClick(referencesTab);
    await sleep(250);
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

  await safeClick(modelDropdown);
  await sleep(220);

  await appendAutomationLog("Choose Veo 3.1 - Lite [Lower Priority].");
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
      await sleep(300);
      await safeClick(openButton);
      await sleep(500);

      const dialogAfter = await waitForDialog(500);
      if (dialogAfter) {
        const imageName = expectedNames[i];
        const searchInput = findReferenceImageSearchInput(dialogAfter);

        if (searchInput) {
          await typeTextIntoField(searchInput, imageName);
          await sleep(350);
        }

        const item = findImgItemByAlt(imageName, dialogAfter);
        if (item) {
          await sleep(300);
          await safeClick(item);
          await appendAutomationLog(`Selected reference image: ${imageName}`);
          await waitForTransientUiToClose(300);
        }
      } else {
        await appendAutomationLog(
          `Reference image dialog did not appear after clicking open button.`,
        );
      }

      await safeClick(openButton);
    }

    await sleep(300);
  });
}

export async function renameLatestGeneratedMedia(
  newName: string,
): Promise<void> {
  const latest = getLatestMainMediaContainer();
  if (!latest) {
    return;
  }

  const { x, y } = getElementClickPoint(latest);
  await debuggerClickAtPoint(x, y, "right");
  await sleep(240);

  const renameButton = findButtonByText(["doi ten", "rename", "whiteboard"]);
  if (!renameButton) {
    return;
  }
  await safeClick(renameButton);
  await sleep(220);

  const input =
    (document.querySelector(
      "[role='dialog'] input[type='text']",
    ) as HTMLInputElement | null) ||
    (document.querySelector(
      "[role='dialog'] textarea",
    ) as HTMLTextAreaElement | null) ||
    (document.querySelector("input[type='text']") as HTMLInputElement | null);

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

  const saveButton = findButtonByText(["doi ten", "rename", "save"]);
  if (saveButton) {
    await safeClick(saveButton);
    await sleep(200);
  }
}

function getFirstRowPrimaryTileContainer(): HTMLElement | null {
  const rowPrimary = document.querySelector(
    "div[data-index='0'][data-item-index='0']",
  ) as HTMLElement | null;
  if (!rowPrimary) {
    return null;
  }

  const withTileId = rowPrimary.querySelector(
    "[data-tile-id]",
  ) as HTMLElement | null;
  return withTileId || rowPrimary;
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
  await sleep(2000);

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

    if (text.includes("không thành công") && !hasProgressPercentage(text)) {
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

export async function waitForFirstRowItemDone(
  waitMs: number,
  shouldStop: () => boolean,
): Promise<HTMLElement | null> {
  const started = Date.now();

  const getCompletedTile = (): HTMLElement | null => {
    const tile = getFirstRowPrimaryTileContainer();
    if (!tile) {
      return null;
    }

    return isTileGenerationComplete(tile) ? tile : null;
  };

  const immediate = getCompletedTile();
  if (immediate) {
    return immediate;
  }

  return new Promise<HTMLElement | null>((resolve) => {
    const observerRoot = document.body;

    if (!observerRoot) {
      resolve(null);
      return;
    }

    let done = false;
    let pollTimer = 0;
    let checkInFlight = false;

    const finalize = (result: HTMLElement | null): void => {
      if (done) {
        return;
      }
      done = true;
      observer.disconnect();
      window.clearInterval(pollTimer);
      resolve(result);
    };

    const checkNow = async (): Promise<void> => {
      if (done || checkInFlight) {
        return;
      }

      checkInFlight = true;

      try {
        if (shouldStop()) {
          finalize(null);
          return;
        }

        const elapsed = Date.now() - started;
        if (elapsed >= waitMs) {
          finalize(null);
          return;
        }

        const tile = getCompletedTile();
        if (tile) {
          finalize(tile);
          return;
        }

        const firstRowTile = getFirstRowPrimaryTileContainer();
        if (!firstRowTile) {
          return;
        }

        const text = (firstRowTile.textContent || "").toLowerCase();
        if (
          text.includes("flow đang có lượng truy cập cao") ||
          text.includes("we noticed some unusual activity")
        ) {
          finalize(null);
        }

        if (text.includes("không thành công") && !hasProgressPercentage(text)) {
          finalize(null);
        }
      } finally {
        checkInFlight = false;
      }
    };

    const observer = new MutationObserver(() => {
      void checkNow();
    });

    observer.observe(observerRoot, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["style", "class", "data-state", "data-index"],
    });

    pollTimer = window.setInterval(() => {
      void checkNow();
    }, 1000);
    void checkNow();
  });
}

export async function renameMediaItem(
  mediaContainer: HTMLElement,
  newName: string,
): Promise<boolean> {
  console.log("🚀 ~ renameMediaItem ~ mediaContainer:", mediaContainer);
  return withPageInteractionLock(async () => {
    const trimmed = String(newName || "").trim();
    if (!trimmed) {
      return false;
    }
    await sleep(1000);
    await openContextMenuAtContainerCenter(mediaContainer);

    await sleep(250);

    let renameButton = findButtonByText(["doi ten", "rename", "Đổi tên"]);

    await safeClick(renameButton);
    await sleep(250);

    const input =
      (document.querySelector(
        "[role='dialog'] input[type='text']",
      ) as HTMLInputElement | null) ||
      (document.querySelector(
        "[role='dialog'] textarea",
      ) as HTMLTextAreaElement | null) ||
      (document.querySelector("input[type='text']") as HTMLInputElement | null);

    if (!input) {
      console.log("🚀 ~ renameMediaItem ~ input:", input);
      return false;
    }

    await typeTextIntoField(input, trimmed);

    await sleep(520);

    input.form?.requestSubmit();

    input.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        composed: true,
        key: "Enter",
        code: "Enter",
      }),
    );
    input.dispatchEvent(
      new KeyboardEvent("keypress", {
        bubbles: true,
        cancelable: true,
        composed: true,
        key: "Enter",
        code: "Enter",
      }),
    );
    input.dispatchEvent(
      new KeyboardEvent("keyup", {
        bubbles: true,
        cancelable: true,
        composed: true,
        key: "Enter",
        code: "Enter",
      }),
    );

    return true;
  });
}

export async function downloadMediaItem(
  mediaContainer: HTMLElement,
): Promise<boolean> {
  return withPageInteractionLock(async () => {
    const contextMenuOpened =
      await openContextMenuAtContainerCenter(mediaContainer);
    if (!contextMenuOpened) {
      console.log(
        "🚀 ~ downloadMediaItem ~ can't open context menu:",
        contextMenuOpened,
      );

      return false;
    }

    const item = mediaContainer.querySelectorAll(
      "img, video",
    )[0] as HTMLElement | null;

    if (!item) {
      return false;
    }

    await sleep(300);

    const downloadButton = findButtonByText([
      "tải xuống",
      "download",
      "Tải xuống",
    ]);
    if (!downloadButton) {
      return false;
    }

    await safeClick(downloadButton);
    await sleep(300);

    const qualityButton = findButtonByText([
      "kích thước gốc",
      "original size",
      "Kích thước gốc",
      "1K",
    ]);

    if (!qualityButton) {
      return false;
    }

    await sleep(300);
    await safeClick(qualityButton);
    await waitForTransientUiToClose(3000);
    await sleep(300);

    return true;
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

    await sleep(1200);
  }

  await appendAutomationLog("No new media detected before timeout.");
}

async function clickOutsideTile(mediaContainer: HTMLElement): Promise<void> {
  const rect = mediaContainer.getBoundingClientRect();
  const x = rect.left - 10;
  const y = rect.top - 10;
  await debuggerClickAtPoint(x, y, "left");
}
