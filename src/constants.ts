import type { AutomationState } from "./types";

export const LOG_STORAGE_KEY = "flowPromptRunnerLogs";
export const AUTOMATION_STATE_KEY = "flowPromptAutomationState";
export const STEP_DELAY_MS = 1000;
export const MAX_LOG_ITEMS = 300;
export const TEST_MODE = false;

export const state: AutomationState = {
  running: false,
  stopRequested: false,
  prompts: [],
  mode: "image",
  intervalMs: 15000,
};
