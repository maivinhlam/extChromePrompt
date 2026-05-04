export type PromptStatus = "pending" | "in_progress" | "done";
export type PromptMode = "image" | "video";

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
  prompts: string[];
  mode: PromptMode;
  intervalMs: number;
};

export type SceneNumbers = {
  scene: number;
  item: number;
};

export type LogEntry = {
  timestamp: number;
  message: string;
};
