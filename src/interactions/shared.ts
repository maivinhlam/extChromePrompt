import { isVisible, sleepMilliseconds } from '../utils';

let pageInteractionLock: Promise<void> = Promise.resolve();

export type DebuggerMouseButton = 'left' | 'right' | 'middle';

export async function withPageInteractionLock<T>(action: () => Promise<T>): Promise<T> {
  const previousLock = pageInteractionLock;
  let releaseLock: (() => void) | null = null;

  pageInteractionLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  await previousLock;

  try {
    return await action();
  } finally {
    releaseLock?.();
  }
}

export async function waitForTransientUiToClose(timeoutMs: number): Promise<boolean> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const hasVisibleDialog = Array.from(document.querySelectorAll("div[role='dialog']")).some((dialog) =>
      isVisible(dialog as HTMLElement)
    );
    const menu = document.querySelector("[role='menu']") as HTMLElement | null;
    const hasVisibleMenu = !!menu && isVisible(menu);

    if (!hasVisibleDialog && !hasVisibleMenu) {
      return true;
    }

    await sleepMilliseconds(120);
  }

  return false;
}

export function getElementClickPoint(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + Math.max(1, Math.min(rect.width / 2, rect.width - 1)),
    y: rect.top + Math.max(1, Math.min(rect.height / 2, rect.height - 1)),
  };
}

export function randomInt(min: number, max: number): number {
  const lower = Math.ceil(Math.min(min, max));
  const upper = Math.floor(Math.max(min, max));
  return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}
