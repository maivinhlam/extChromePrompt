import { CreateModeImage } from './enums/modeType';
import { type AutomationState } from './types';

export const LOG_STORAGE_KEY = 'flowPromptRunnerLogs';
export const AUTOMATION_STATE_KEY = 'flowPromptAutomationState';
export const STATUS_STORAGE_KEY = 'flowPromptRunnerStatus';
export const RUNNER_SETTINGS_KEY = 'flowPromptRunnerSettings';

export const STEP_DELAY_MS = 1000;
export const MAX_LOG_ITEMS = 300;
export const TEST_MODE = false;
export const SPEED_FACTOR = 0.5;
export const MAX_PENDING_TASKS = 10;
export const DEFAULT_INTERVAL_MS = 15000;

export const state: AutomationState = {
  running: false,
  stopRequested: false,
  pauseRequested: false,
  promptIndex: 0,
  prompts: [],
  matchedImageNames: {},
  mode: CreateModeImage,
  intervalMs: DEFAULT_INTERVAL_MS,
  enableReferenceImages: true,
  enableAutoDownload: true,
};
