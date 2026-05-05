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

export async function fillPromptInput(prompt: string): Promise<boolean> {
  const promptInput = findPromptInput();
  if (!promptInput) {
    throw new Error("Could not find Flow prompt input.");
  }

  const editor = document.querySelector(
    'div[data-slate-editor="true"]',
  ) as HTMLElement | null;
  if (!editor) {
    console.error("Khong tim thay khung nhap prompt!");
    return false;
  }

  editor.focus();
  document.execCommand("selectAll", false);
  document.execCommand("delete", false);
  document.execCommand("insertText", false, prompt);

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
      const imageOption = findButtonByText(["hinh anh"]);
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
