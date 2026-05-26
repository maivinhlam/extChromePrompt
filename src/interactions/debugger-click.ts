import { isVisible, sleepMilliseconds } from '../utils';
import { type DebuggerMouseButton, getElementClickPoint } from './shared';

async function debuggerClickAtPoint(x: number, y: number, button: DebuggerMouseButton = 'left'): Promise<boolean> {
  const response = await chrome.runtime
    .sendMessage({
      type: 'DEBUGGER_CLICK',
      x,
      y,
      button,
    })
    .catch(() => null);

  return !!response?.ok;
}

export async function debuggerClickElement(
  element: HTMLElement,
  button: DebuggerMouseButton = 'left'
): Promise<boolean> {
  if (!isVisible(element)) {
    return false;
  }

  element.scrollIntoView({ block: 'center', inline: 'nearest' });
  element.focus();
  await sleepMilliseconds(80);

  const { x, y } = getElementClickPoint(element);
  return debuggerClickAtPoint(x, y, button);
}

export async function safeClick(element: HTMLElement | null): Promise<boolean> {
  if (!element || !isVisible(element)) {
    return false;
  }

  const clicked = await debuggerClickElement(element);
  if (!clicked) {
    return false;
  }

  await sleepMilliseconds(80);
  return true;
}
