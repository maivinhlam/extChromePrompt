import {
  RUNNER_SETTINGS_KEY,
  LOG_STORAGE_KEY,
  AUTOMATION_STATE_KEY,
  STATUS_STORAGE_KEY,
  MAX_LOG_ITEMS,
} from './constants';
import type { AutomationStatePayload, LogEntry, RunnerSettings } from './types';
import { formatTimestamp } from './utils';

export async function loadAutomationState(): Promise<AutomationStatePayload | null> {
  try {
    const data = await chrome.storage.local.get(AUTOMATION_STATE_KEY);
    return (data[AUTOMATION_STATE_KEY] as AutomationStatePayload) || null;
  } catch {
    return null;
  }
}

export async function saveAutomationState(payload: AutomationStatePayload): Promise<void> {
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
    return typeof data[STATUS_STORAGE_KEY] === 'string' ? (data[STATUS_STORAGE_KEY] as string) : 'Ready.';
  } catch {
    return 'Ready.';
  }
}

export async function setAutomationStatus(message: string): Promise<void> {
  try {
    await chrome.storage.local.set({
      [STATUS_STORAGE_KEY]: String(message || 'Ready.'),
    });
  } catch {
    // no-op
  }
}

export async function appendAutomationLog(message: string): Promise<void> {
  const entry: LogEntry = {
    timestamp: formatTimestamp(Date.now()),
    message: String(message || ''),
  };
  await setAutomationStatus(entry.message);
  try {
    const data = await chrome.storage.local.get(LOG_STORAGE_KEY);
    const logs = Array.isArray(data[LOG_STORAGE_KEY]) ? (data[LOG_STORAGE_KEY] as LogEntry[]) : [];
    logs.push(entry);

    if (logs.length > MAX_LOG_ITEMS) {
      logs.splice(0, logs.length - MAX_LOG_ITEMS);
    }

    await chrome.storage.local.set({ [LOG_STORAGE_KEY]: logs });
  } catch {
    // no-op
  }
}

export async function loadRunnerSettings(): Promise<RunnerSettings> {
  try {
    const data = await chrome.storage.local.get(RUNNER_SETTINGS_KEY);
    return ((data[RUNNER_SETTINGS_KEY] as RunnerSettings | undefined) || {}) as RunnerSettings;
  } catch {
    return {};
  }
}

export async function updateRunnerSettings(partialSettings: Partial<RunnerSettings>): Promise<RunnerSettings> {
  const existing = await loadRunnerSettings();
  const nextSettings: RunnerSettings = {
    ...existing,
    ...partialSettings,
  };

  try {
    await chrome.storage.local.set({
      [RUNNER_SETTINGS_KEY]: nextSettings,
    });
  } catch {
    // no-op
  }

  return nextSettings;
}

export async function saveMatchedImageNames(matchedImageNames: Record<string, string>): Promise<void> {
  try {
    await updateRunnerSettings({
      matchedImageNames: { ...matchedImageNames },
    });
  } catch {
    // no-op
  }
}

export async function removePromptFromRunnerSettings(prompt: string): Promise<boolean> {
  const normalizedPrompt = String(prompt || '').trim();
  if (!normalizedPrompt) {
    return false;
  }

  try {
    const existing = await loadRunnerSettings();
    const promptsText = typeof existing.promptsText === 'string' ? existing.promptsText : '';
    const promptLines = promptsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const promptIndex = promptLines.findIndex((line) => line === normalizedPrompt);

    if (promptIndex < 0) {
      return false;
    }

    promptLines.splice(promptIndex, 1);

    await updateRunnerSettings({
      promptsText: promptLines.join('\n'),
    });

    return true;
  } catch {
    return false;
  }
}
