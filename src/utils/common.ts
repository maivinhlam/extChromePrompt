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

export function formatTimestamp(ts: number): string {
  const now = new Date(ts);

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export function extractImageNamesFromPrompt(prompt: string): string[] {
  const imageNamesMatch = prompt.match(/IMAGES:\s*(.+?)(?:\s*\||\s*$)/i);
  const imageNames = imageNamesMatch ? imageNamesMatch[1].trim() : null;

  return imageNames
    ? imageNames
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
}
