import { state } from "./constants";
import { startAutomation } from "./automation";
import { appendAutomationLog } from "./storage";

export function setupMessageListener(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "PING_FLOW_PROMPT_RUNNER") {
      sendResponse({ ok: true });
      return;
    }

    if (message?.type === "START_AUTOMATION") {
      startAutomation(message.config)
        .then(() => sendResponse({ ok: true }))
        .catch((error: Error) =>
          sendResponse({ ok: false, error: error.message }),
        );
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
}
