import { STEP_DELAY_MS } from "./constants";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== "hidden" &&
    style.display !== "none"
  );
}

export async function sleepWithStop(
  ms: number,
  shouldStop: () => boolean,
): Promise<void> {
  const stepMs = 200;
  let elapsed = 0;

  while (elapsed < ms) {
    if (shouldStop()) {
      return;
    }
    await sleep(stepMs);
    elapsed += stepMs;
  }
}

export async function pauseBeforeStep(
  stepText: string,
  shouldStop: () => boolean,
  logFn: (msg: string) => Promise<void>,
): Promise<void> {
  await logFn(`${stepText} Running in ${STEP_DELAY_MS / 1000} seconds...`);
  await sleepWithStop(STEP_DELAY_MS, shouldStop);
}
