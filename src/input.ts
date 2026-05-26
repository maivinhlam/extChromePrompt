import { randomInt } from './interactions';
import { sleepMilliseconds } from './utils';

/**
 * Sends a native Enter key event to the target tab.
 */
async function sendEnterKey(target: chrome.debugger.Debuggee): Promise<void> {
  const enterOptions = {
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  };

  await chrome.debugger.sendCommand(target, 'Input.dispatchKeyEvent', {
    type: 'keyDown',
    ...enterOptions,
  });

  await chrome.debugger.sendCommand(target, 'Input.dispatchKeyEvent', {
    type: 'keyUp',
    ...enterOptions,
  });
}

/**
 * Clears the input field using a native Select All (Ctrl/Cmd + A) + Backspace sequence.
 */
export async function nativeClear(target: chrome.debugger.Debuggee): Promise<void> {
  // Determine the modifier: 2 for Control (Windows/Linux), 4 for Command (Mac)
  const isMac = /Mac/.test(navigator.platform);
  const modifier = isMac ? 4 : 2;

  // 1. Select All (Mod + A)
  const aKeyOptions = {
    modifiers: modifier,
    key: 'a',
    windowsVirtualKeyCode: 65,
    nativeVirtualKeyCode: 65,
  };

  await chrome.debugger.sendCommand(target, 'Input.dispatchKeyEvent', {
    type: 'keyDown',
    ...aKeyOptions,
  });

  await chrome.debugger.sendCommand(target, 'Input.dispatchKeyEvent', {
    type: 'keyUp',
    ...aKeyOptions,
  });

  // 2. Press Backspace to delete selection
  const backspaceOptions = {
    key: 'Backspace',
    windowsVirtualKeyCode: 8,
    nativeVirtualKeyCode: 8,
  };

  await chrome.debugger.sendCommand(target, 'Input.dispatchKeyEvent', {
    type: 'keyDown',
    ...backspaceOptions,
  });

  await chrome.debugger.sendCommand(target, 'Input.dispatchKeyEvent', {
    type: 'keyUp',
    ...backspaceOptions,
  });

  // Small delay to ensure the DOM updates the empty state
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Pastes a string into the focused element using the debugger protocol.
 */
export async function nativeType(tabId: number, text: string): Promise<void> {
  const target: chrome.debugger.Debuggee = { tabId };
  let attachedHere = false;

  try {
    try {
      await chrome.debugger.attach(target, '1.3');
      attachedHere = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || 'Unknown error');

      if (!message.includes('Another debugger is already attached')) {
        throw error;
      }
    }

    await chrome.debugger.sendCommand(target, 'Input.insertText', {
      text,
    });

    await sleepMilliseconds(randomInt(600, 1000)); // Wait for the text to be processed before sending Enter
    await sendEnterKey(target);
    if (attachedHere) {
      await chrome.debugger.detach(target);
    }
  } catch (err) {
    console.error('Native typing failed:', err);
    if (attachedHere) {
      chrome.debugger.detach(target).catch(() => {});
    }
  }
}
