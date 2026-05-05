import { sleep, isVisible } from "./utils";
import { appendAutomationLog } from "./storage";
import {
  findPromptInput,
  findSendButton,
  findModelButton,
  findVideoReferencesTab,
  findVideoModelDropdownButton,
  findReferenceImageOpenButton,
  findButtonByText,
  findImgItemByAlt,
  waitForDialog,
  waitForMenu,
} from "./dom-finders";
import {
  countMainMediaItems,
  getLatestMainMediaContainer,
} from "./media-utils";
import { formatSceneName } from "./formatting";

function getTypingDelay(character: string): number {
  if (character === " ") {
    return 10;
  }

  if (/[.,;:!?]/.test(character)) {
    return 12;
  }

  return 11;
}

export async function fillPromptInput(prompt: string): Promise<boolean> {
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

  if (
    promptInput instanceof HTMLTextAreaElement ||
    promptInput instanceof HTMLInputElement
  ) {
    promptInput.focus();
    promptInput.select();
    promptInput.value = "";
    promptInput.dispatchEvent(new Event("input", { bubbles: true }));

    for (const character of prompt) {
      promptInput.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: character,
        }),
      );
      promptInput.dispatchEvent(
        new InputEvent("beforeinput", {
          bubbles: true,
          cancelable: true,
          inputType: "insertText",
          data: character,
        }),
      );
      promptInput.value += character;
      promptInput.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          inputType: "insertText",
          data: character,
        }),
      );
      promptInput.dispatchEvent(
        new KeyboardEvent("keyup", {
          bubbles: true,
          cancelable: true,
          key: character,
        }),
      );
      await sleep(getTypingDelay(character));
    }

    promptInput.dispatchEvent(new Event("change", { bubbles: true }));
    console.log(`[AutoFlow] Da nhap: ${prompt.substring(0, 30)}...`);
    return true;
  }

  const selection = window.getSelection();
  if (!selection) {
    return false;
  }

  const range = document.createRange();
  range.selectNodeContents(editor);
  selection.removeAllRanges();
  selection.addRange(range);

  editor.dispatchEvent(
    new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "deleteByCut",
      data: null,
    }),
  );
  document.execCommand("insertText", false, "");
  editor.dispatchEvent(new Event("input", { bubbles: true }));

  const ensureCaretAtEnd = (): void => {
    const targetNode =
      editor.querySelector("span[data-slate-string='true']") || editor;
    const endRange = document.createRange();

    let caretNode: Node = targetNode;
    if (targetNode.firstChild) {
      caretNode = targetNode.firstChild;
    }

    if (caretNode.nodeType === Node.TEXT_NODE) {
      const length = caretNode.textContent?.length || 0;
      endRange.setStart(caretNode, length);
    } else {
      const childCount = caretNode.childNodes.length;
      endRange.setStart(caretNode, childCount);
    }

    endRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(endRange);
  };

  ensureCaretAtEnd();

  for (const character of prompt) {
    editor.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: character,
      }),
    );
    editor.dispatchEvent(
      new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: character,
      }),
    );
    document.execCommand("insertText", false, character);
    editor.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: character,
      }),
    );
    editor.dispatchEvent(
      new KeyboardEvent("keyup", {
        bubbles: true,
        cancelable: true,
        key: character,
      }),
    );
    ensureCaretAtEnd();
    await sleep(getTypingDelay(character));
  }

  editor.dispatchEvent(new Event("change", { bubbles: true }));

  console.log(`[AutoFlow] Da nhap: ${prompt.substring(0, 30)}...`);
  return true;
}

export async function clickCreateButton(): Promise<void> {
  const sendButton = findSendButton();

  if (!sendButton) {
    await appendAutomationLog("Could not find send button.");
    throw new Error("Could not find send button.");
  }
  await appendAutomationLog("Found send button.");

  sendButton.click();
}

export async function safeClick(element: HTMLElement | null): Promise<boolean> {
  if (!element || !isVisible(element)) {
    return false;
  }

  element.scrollIntoView({ block: "center", inline: "nearest" });
  element.focus();

  element.click();
  await sleep(800);

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
  expectedName: string,
): Promise<void> {
  const openButton = findReferenceImageOpenButton();
  if (!openButton) {
    await appendAutomationLog("Reference image open button not found.");
    return;
  }

  for (let i = 0; i < 3; i += 1) {
    openButton.click();
    await sleep(3000);

    let dialogAfter = await waitForDialog(3000);
    if (dialogAfter) {
      const imageName = expectedName + ` - Image ${i + 1}`; // Try with incremental suffix if exact name doesn't work
      const item = findImgItemByAlt(imageName, dialogAfter);
      if (item) {
        await item.click();
        await appendAutomationLog(`Selected reference image: ${imageName}`);
      }
    } else {
      await appendAutomationLog(
        `Reference image dialog did not appear after clicking open button.`,
      );
    }
  }

  await sleep(3000);
}

export async function renameLatestGeneratedMedia(
  newName: string,
): Promise<void> {
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

  const renameButton = findButtonByText(["doi ten", "rename", "whiteboard"]);
  if (!renameButton) {
    return;
  }
  renameButton.click();
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
    saveButton.click();
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
    return progressValues.some((value) => value >= 100);
  }

  const statusTerms = ["dang tao", "dang xu ly", "generating", "processing"];

  // Strict mode: if no explicit percentage is present, do not consider done.
  if (statusTerms.some((term) => text.includes(term))) {
    return false;
  }

  return false;
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
      if (!existingIds.has(id)) {
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

    pollTimer = window.setInterval(checkNow, 400);
    checkNow();
  });
}

export async function waitForTileDoneById(
  tileId: string,
  waitMs: number,
  shouldStop: () => boolean,
): Promise<HTMLElement | null> {
  const getCompletedTile = (): HTMLElement | null => {
    const tile = getTileContainerById(tileId);
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
    const started = Date.now();
    const observerRoot = document.body;

    if (!observerRoot) {
      resolve(null);
      return;
    }

    let done = false;
    let pollTimer = 0;

    const finalize = (result: HTMLElement | null): void => {
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

      const tile = getCompletedTile();
      if (tile) {
        finalize(tile);
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

export async function waitForFirstRowItemDone(
  waitMs: number,
  shouldStop: () => boolean,
): Promise<HTMLElement | null> {
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
    const started = Date.now();
    const observerRoot = document.body;

    if (!observerRoot) {
      resolve(null);
      return;
    }

    let done = false;
    let pollTimer = 0;

    const finalize = (result: HTMLElement | null): void => {
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

      const elapsed = Date.now() - started;
      if (elapsed >= waitMs) {
        finalize(null);
        return;
      }

      const tile = getCompletedTile();
      if (tile) {
        finalize(tile);
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

export async function renameMediaItem(
  mediaContainer: HTMLElement,
  newName: string,
): Promise<boolean> {
  const trimmed = String(newName || "").trim();
  if (!trimmed) {
    return false;
  }

  const rect = mediaContainer.getBoundingClientRect();
  mediaContainer.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + Math.min(24, Math.max(6, rect.width / 2)),
      clientY: rect.top + Math.min(24, Math.max(6, rect.height / 2)),
      button: 2,
    }),
  );

  await sleep(250);

  const renameButton = findButtonByText(["doi ten", "rename", "Đổi tên"]);
  if (!renameButton) {
    return false;
  }

  renameButton.click();
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
    return false;
  }

  input.focus();
  input.value = trimmed;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));

  // press Enter
  input.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }),
  );
  input.dispatchEvent(
    new KeyboardEvent("keypress", { bubbles: true, key: "Enter" }),
  );
  input.dispatchEvent(
    new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }),
  );

  return true;
}

export async function downloadMediaItem(
  mediaContainer: HTMLElement,
): Promise<boolean> {
  const rect = mediaContainer.getBoundingClientRect();
  mediaContainer.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + Math.min(24, Math.max(6, rect.width / 2)),
      clientY: rect.top + Math.min(24, Math.max(6, rect.height / 2)),
      button: 2,
    }),
  );

  await sleep(300);

  const downloadButton = findButtonByText([
    "tải xuống",
    "download",
    "Tải xuống",
  ]);
  if (!downloadButton) {
    return false;
  }

  downloadButton.click();
  await sleep(400);

  const qualityButton = findButtonByText([
    "kích thước gốc",
    "original size",
    "Kích thước gốc",
  ]);
  if (!qualityButton) {
    return false;
  }

  qualityButton.click();
  await sleep(300);

  return true;
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
