export {};

type PendingDownload = {
  sceneName: string;
  mediaType: string;
};

const pendingDownloads: PendingDownload[] = [];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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

  sendResponse({ ok: false, error: "Unknown message." });
});

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
