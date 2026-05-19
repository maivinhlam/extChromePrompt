import {
  LOG_STORAGE_KEY,
  AUTOMATION_STATE_KEY,
  STATUS_STORAGE_KEY,
  MAX_LOG_ITEMS,
} from "./constants";
import type { AutomationStatePayload, LogEntry } from "./types";
import { formatTimestamp } from "./utils";

const RUNNER_SETTINGS_KEY = "flowPromptRunnerSettings";

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

export async function loadAutomationStatus(): Promise<string> {
  try {
    const data = await chrome.storage.local.get(STATUS_STORAGE_KEY);
    return typeof data[STATUS_STORAGE_KEY] === "string"
      ? (data[STATUS_STORAGE_KEY] as string)
      : "Ready.";
  } catch {
    return "Ready.";
  }
}

export async function setAutomationStatus(message: string): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STATUS_STORAGE_KEY]: String(message || "Ready."),
    });
  } catch {
    // no-op
  }
}

export async function appendAutomationLog(message: string): Promise<void> {
  const entry: LogEntry = {
    timestamp: formatTimestamp(Date.now()),
    message: String(message || ""),
  };
  await setAutomationStatus(entry.message);
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

export async function saveMatchedImageNames(
  matchedImageNames: Record<string, string>,
): Promise<void> {
  try {
    const data = await chrome.storage.local.get(RUNNER_SETTINGS_KEY);
    const existing =
      (data[RUNNER_SETTINGS_KEY] as Record<string, unknown> | undefined) || {};

    await chrome.storage.local.set({
      [RUNNER_SETTINGS_KEY]: {
        ...existing,
        matchedImageNames: { ...matchedImageNames },
      },
    });
  } catch {
    // no-op
  }
}
