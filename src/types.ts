export type PromptStatus = 'pending' | 'in_progress' | 'done' | 'failed';
export type PromptMode = 'image' | 'video';

export type AutomationFeatures = {
  enableReferenceImages: boolean;
  enableAutoDownload: boolean;
};

export type AutomationConfig = {
  prompts?: string[];
  mode?: PromptMode;
  intervalMs?: number;
  enableReferenceImages?: boolean;
  enableAutoDownload?: boolean;
};

export type AutomationStatePayload = {
  running: boolean;
  mode: PromptMode;
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
  mode: PromptMode;
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
