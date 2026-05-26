import { DEFAULT_INTERVAL_MS } from '../config/automation-settings';
import { CreateModeImage } from '../domain/create-mode';
import type { AutomationState } from '../domain/automation-types';

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
