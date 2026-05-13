import {
  LOG_STORAGE_KEY,
  AUTOMATION_STATE_KEY,
  MAX_LOG_ITEMS,
} from "./constants";
import type { AutomationStatePayload, LogEntry } from "./types";

export async function loadAutomationState(): Promise<AutomationStatePayload | null> {
  try {
    const data = await chrome.storage.local.get(AUTOMATION_STATE_KEY);
    return (data[AUTOMATION_STATE_KEY] as AutomationStatePayload) || null;
  } catch {
    return null;
  }
}

export async function saveAutomationState(
  payload: AutomationStatePayload,
): Promise<void> {
  try {
    await chrome.storage.local.set({
      [AUTOMATION_STATE_KEY]: {
        ...payload,
        updatedAt: Date.now(),
      },
    });
  } catch {
    // no-op
  }
}

export async function clearAutomationState(): Promise<void> {
  try {
    await chrome.storage.local.remove(AUTOMATION_STATE_KEY);
  } catch {
    // no-op
  }
}

export async function appendAutomationLog(message: string): Promise<void> {
  const entry: LogEntry = {
    timestamp: Date.now(),
    message: String(message || ""),
  };
  console.log("🚀 ~ appendAutomationLog ~ : ", entry.message);

  try {
    const data = await chrome.storage.local.get(LOG_STORAGE_KEY);
    const logs = Array.isArray(data[LOG_STORAGE_KEY])
      ? (data[LOG_STORAGE_KEY] as LogEntry[])
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
