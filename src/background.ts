import { nativeClear, nativeType } from "./input";

export {};

type PendingDownload = {
  sceneName: string;
  mediaType: string;
};

type DebuggerTarget = {
  tabId: number;
};

type DebuggerMouseButton = "left" | "right" | "middle";

type DebuggerClickMessage = {
  type: "DEBUGGER_CLICK";
  x: number;
  y: number;
  button?: DebuggerMouseButton;
  clickCount?: number;
};

const pendingDownloads: PendingDownload[] = [];
const attachedDebuggerTabs = new Set<number>();

chrome.debugger.onDetach.addListener((source) => {
  if (typeof source.tabId === "number") {
    attachedDebuggerTabs.delete(source.tabId);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "FOCUS_SENDER_TAB") {
    void focusSenderTab(sender)
      .then(() => sendResponse({ ok: true }))
      .catch((error: Error) =>
        sendResponse({ ok: false, error: error.message }),
      );
    return true;
  }

  if (message?.type === "REGISTER_DOWNLOAD_NAME") {
    pendingDownloads.push({
      sceneName: message.sceneName || "scene",
      mediaType: message.mediaType || "media",
    });
    sendResponse({ ok: true, queueSize: pendingDownloads.length });
    return;
  }

  if (message?.type === "CLEAR_DOWNLOAD_QUEUE") {
    pendingDownloads.length = 0;
    sendResponse({ ok: true });
    return;
  }

  if (message?.type === "DEBUGGER_CLICK") {
    void dispatchDebuggerClick(sender, message as DebuggerClickMessage)
      .then(() => sendResponse({ ok: true }))
      .catch((error: Error) =>
        sendResponse({ ok: false, error: error.message }),
      );
    return true;
  }

  if (message?.action === "PERFORM_TYPE") {
    void handleTypingFlow(sender, message.text)
      .then(() => sendResponse({ ok: true }))
      .catch((error: Error) =>
        sendResponse({ ok: false, error: error.message }),
      );
    return true;
  }

  sendResponse({ ok: false, error: "Unknown message." });
});

async function dispatchDebuggerClick(
  sender: chrome.runtime.MessageSender,
  message: DebuggerClickMessage,
): Promise<void> {
  const tabId = sender.tab?.id;

  if (typeof tabId !== "number") {
    throw new Error("Could not resolve sender tab for debugger click.");
  }

  const x = Number(message.x);
  const y = Number(message.y);

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error("Invalid debugger click coordinates.");
  }

  const target: DebuggerTarget = { tabId };
  const button = normalizeMouseButton(message.button);
  const clickCount = Math.max(1, Number(message.clickCount || 1));
  const buttons = toMouseButtonsMask(button);

  await ensureDebuggerAttached(target);

  await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x,
    y,
    button: "none",
    buttons: 0,
    clickCount: 0,
  });

  await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button,
    buttons,
    clickCount,
  });

  await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button,
    buttons,
    clickCount,
  });
}

async function ensureDebuggerAttached(target: DebuggerTarget): Promise<void> {
  if (attachedDebuggerTabs.has(target.tabId)) {
    return;
  }

  try {
    await chrome.debugger.attach(target, "1.3");
    attachedDebuggerTabs.add(target.tabId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error || "Unknown error");

    if (message.includes("Another debugger is already attached")) {
      attachedDebuggerTabs.add(target.tabId);
      return;
    }

    throw error;
  }
}

function normalizeMouseButton(
  button?: DebuggerMouseButton,
): DebuggerMouseButton {
  if (button === "right" || button === "middle") {
    return button;
  }

  return "left";
}

function toMouseButtonsMask(button: DebuggerMouseButton): number {
  switch (button) {
    case "right":
      return 2;
    case "middle":
      return 4;
    default:
      return 1;
  }
}

async function focusSenderTab(
  sender: chrome.runtime.MessageSender,
): Promise<void> {
  const tabId = sender.tab?.id;
  const windowId = sender.tab?.windowId;

  if (typeof tabId !== "number" || typeof windowId !== "number") {
    throw new Error("Could not resolve sender tab.");
  }

  await chrome.windows.update(windowId, { focused: true });
  await chrome.tabs.update(tabId, { active: true });
}

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  if (!pendingDownloads.length) {
    suggest();
    return;
  }

  const payload = pendingDownloads.shift();
  if (!payload) {
    suggest();
    return;
  }

  const extension = detectFileExtension(item);
  const sceneSlug = toSceneSlug(payload.sceneName);
  const fileName = `${sceneSlug}_${payload.mediaType}_${Date.now()}.${extension}`;

  suggest({
    filename: fileName,
    conflictAction: "uniquify",
  });
});

function toSceneSlug(sceneName: string) {
  const clean = String(sceneName || "scene")
    .replace(/^\s+|\s+$/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);

  return clean || "scene";
}

function detectFileExtension(item: chrome.downloads.DownloadItem) {
  const filename = item.filename || "";
  const fromName = filename.split(".").pop();
  if (fromName && fromName.length <= 5 && fromName !== filename) {
    return fromName.toLowerCase();
  }

  try {
    const urlPath = new URL(item.url).pathname;
    const tail = urlPath.split(".").pop();
    if (tail && tail.length <= 5 && tail !== urlPath) {
      return tail.toLowerCase();
    }
  } catch {
    // no-op
  }

  return "bin";
}

/**
 * A wrapper to handle the clear + type sequence
 */
async function handleTypingFlow(
  sender: chrome.runtime.MessageSender,
  text: string,
): Promise<void> {
  const tabId = sender.tab?.id;

  if (typeof tabId !== "number") {
    throw new Error("Could not resolve sender tab for typing.");
  }
  const target = { tabId };

  try {
    await ensureDebuggerAttached(target);
    await nativeClear(target);

    await nativeType(tabId, text);

    console.log("Automation completed successfully.");
  } catch (error) {
    throw error;
  }
}
