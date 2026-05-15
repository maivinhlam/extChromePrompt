import { nativeClear, nativeType } from "./input";

export {};

type PendingDownload = {
  sceneName: string;
  mediaType: string;
};

type PendingDirectDownload = {
  filename: string;
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

type FlowWorkflowRenameMessage = {
  type: "PATCH_FLOW_WORKFLOW_DISPLAY_NAME";
  workflowId: string;
  projectId: string;
  displayName: string;
};

type CapturedRequestHeaders = Record<string, string>;

const pendingDownloads: PendingDownload[] = [];
const pendingDirectDownloads: PendingDirectDownload[] = [];
const attachedDebuggerTabs = new Set<number>();
const latestFlowApiHeadersByTab = new Map<number, CapturedRequestHeaders>();

const FLOW_WORKFLOWS_API_URL_PATTERN =
  "https://aisandbox-pa.googleapis.com/v1/flowWorkflows/*";
const FLOW_RENAME_API_BASE_URL =
  "https://aisandbox-pa.googleapis.com/v1/flowWorkflows";
const FORWARDED_FLOW_HEADER_NAMES = new Set([
  "accept",
  "authorization",
  "content-type",
  "x-browser-channel",
  "x-browser-copyright",
  "x-browser-validation",
  "x-browser-year",
  "x-client-data",
]);

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (typeof details.tabId !== "number" || details.tabId < 0) {
      return;
    }

    const headers = normalizeCapturedFlowHeaders(details.requestHeaders);
    if (!Object.keys(headers).length) {
      return;
    }

    latestFlowApiHeadersByTab.set(details.tabId, headers);
  },
  { urls: [FLOW_WORKFLOWS_API_URL_PATTERN] },
  ["requestHeaders", "extraHeaders"],
);

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

  if (message?.type === "DOWNLOAD_URL") {
    const filename =
      typeof message.filename === "string" && message.filename.trim()
        ? message.filename.trim()
        : undefined;

    const pendingDirectDownload = filename ? { filename } : null;
    if (pendingDirectDownload) {
      pendingDirectDownloads.push(pendingDirectDownload);
    }

    void chrome.downloads
      .download({
        url: message.url,
        filename,
        conflictAction: "uniquify",
      })
      .then((downloadId) => sendResponse({ ok: true, downloadId }))
      .catch((error: Error) => {
        if (pendingDirectDownload) {
          const pendingIndex = pendingDirectDownloads.indexOf(
            pendingDirectDownload,
          );
          if (pendingIndex >= 0) {
            pendingDirectDownloads.splice(pendingIndex, 1);
          }
        }

        sendResponse({ ok: false, error: error.message });
      });
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

  if (message?.type === "GET_FLOW_REQUEST_HEADERS") {
    const tabId = sender.tab?.id;
    const headers =
      typeof tabId === "number" ? latestFlowApiHeadersByTab.get(tabId) : null;

    sendResponse({
      ok: !!headers,
      headers: headers || null,
    });
    return;
  }

  if (message?.type === "PATCH_FLOW_WORKFLOW_DISPLAY_NAME") {
    console.log("🚀 ~ message:", message);
    void patchFlowWorkflowDisplayName(
      sender,
      message as FlowWorkflowRenameMessage,
    )
      .then((renamed) => sendResponse({ ok: renamed }))
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
  const pendingDirectDownload = pendingDirectDownloads.shift();
  if (pendingDirectDownload) {
    suggest({
      filename: pendingDirectDownload.filename,
      conflictAction: "uniquify",
    });
    return;
  }

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

function normalizeCapturedFlowHeaders(
  requestHeaders?: chrome.webRequest.HttpHeader[],
): CapturedRequestHeaders {
  if (!Array.isArray(requestHeaders)) {
    return {};
  }

  const headers: CapturedRequestHeaders = {};

  for (const header of requestHeaders) {
    const name = String(header?.name || "")
      .trim()
      .toLowerCase();
    const value = String(header?.value || "").trim();

    if (!name || !value || !FORWARDED_FLOW_HEADER_NAMES.has(name)) {
      continue;
    }

    headers[name] = value;
  }

  return headers;
}

async function patchFlowWorkflowDisplayName(
  sender: chrome.runtime.MessageSender,
  message: FlowWorkflowRenameMessage,
): Promise<boolean> {
  const tabId = sender.tab?.id;
  if (typeof tabId !== "number") {
    return false;
  }

  const workflowId = String(message.workflowId || "").trim();
  const projectId = String(message.projectId || "").trim();
  const displayName = String(message.displayName || "").trim();
  if (!workflowId || !projectId || !displayName) {
    return false;
  }

  const capturedHeaders = latestFlowApiHeadersByTab.get(tabId);
  if (!capturedHeaders) {
    return false;
  }

  const response = await fetch(
    `${FLOW_RENAME_API_BASE_URL}/${encodeURIComponent(workflowId)}`,
    {
      method: "PATCH",
      headers: {
        accept: "*/*",
        "content-type": "text/plain;charset=UTF-8",
        ...capturedHeaders,
      },
      credentials: "include",
      body: JSON.stringify({
        workflow: {
          name: workflowId,
          projectId,
          metadata: {
            displayName,
          },
        },
        updateMask: "metadata.displayName",
      }),
    },
  ).catch(() => null);

  console.log("🚀 ~ patchFlowWorkflowDisplayName ~ response:", response);
  return !!response?.ok;
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
