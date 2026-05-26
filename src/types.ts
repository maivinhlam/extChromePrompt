import type { CreateMode } from './enums/modeType';
import type { PromptStatus } from './enums/promeStatusType';

export type AutomationFeatures = {
  enableReferenceImages: boolean;
  enableAutoDownload: boolean;
};

export type AutomationConfig = {
  prompts?: string[];
  mode?: CreateMode;
  intervalMs?: number;
  enableReferenceImages?: boolean;
  enableAutoDownload?: boolean;
};

export type RunnerSettings = {
  intervalSeconds?: number;
  mode?: CreateMode;
  promptsText?: string;
  enableReferenceImages?: boolean;
  enableAutoDownload?: boolean;
  matchedImageNames?: Record<string, string>;
  injectPanelEnabled?: boolean;
};

export type AutomationStatePayload = {
  running: boolean;
  mode: CreateMode;
  promptCount: number;
  currentIndex: number;
  promptStatuses: PromptStatus[];
  updatedAt?: number;
};

export type AutomationState = {
  running: boolean;
  stopRequested: boolean;
  pauseRequested?: boolean;
  promptIndex: number;
  prompts: string[];
  matchedImageNames: Record<string, string>;
  mode: CreateMode;
  intervalMs: number;
  enableReferenceImages: boolean;
  enableAutoDownload: boolean;
};

export type SceneNumbers = {
  scene: number;
  item: number;
};

export type LogEntry = {
  timestamp: string;
  message: string;
};
