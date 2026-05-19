import { STEP_DELAY_MS } from './constants';

export function sleepMilliseconds(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function isVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
}

export async function sleepWithStop(ms: number, shouldStop: () => boolean): Promise<void> {
  const stepMs = 200;
  let elapsed = 0;

  while (elapsed < ms) {
    if (shouldStop()) {
      return;
    }
    await sleepMilliseconds(stepMs);
    elapsed += stepMs;
  }
}

export async function pauseBeforeStep(
  stepText: string,
  shouldStop: () => boolean,
  logFn: (msg: string) => Promise<void>
): Promise<void> {
  await logFn(`${stepText} Running in ${STEP_DELAY_MS / 1000} seconds...`);
  await sleepWithStop(STEP_DELAY_MS, shouldStop);
}

export function formatTimestamp(ts: number): string {
  const now = new Date(ts);

  // Lấy các thành phần riêng để format tuỳ chỉnh
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const custom = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  return custom;
}

export function extractImageNamesFromPrompt(prompt: string): string[] {
  const imageNamesMatch = prompt.match(/IMAGES:\s*(.+?)(?:\s*\||\s*$)/i);

  // Lấy chuỗi tên ảnh (hoặc null nếu không khớp)
  const imageNames = imageNamesMatch ? imageNamesMatch[1].trim() : null;
  const imageArray = imageNames
    ? imageNames
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return imageArray;
}
