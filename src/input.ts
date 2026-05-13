/**
 * Sends a native Enter key event to the target tab.
 */
async function sendEnterKey(target: chrome.debugger.Debuggee): Promise<void> {
  const enterOptions = {
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  };

  await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
    type: "keyDown",
    ...enterOptions,
  });

  await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
    type: "keyUp",
    ...enterOptions,
  });
}

/**
 * Clears the input field using a native Select All (Ctrl/Cmd + A) + Backspace sequence.
 */
export async function nativeClear(
  target: chrome.debugger.Debuggee,
): Promise<void> {
  // Determine the modifier: 2 for Control (Windows/Linux), 4 for Command (Mac)
  const isMac = /Mac/.test(navigator.platform);
  const modifier = isMac ? 4 : 2;

  // 1. Select All (Mod + A)
  const aKeyOptions = {
    modifiers: modifier,
    key: "a",
    windowsVirtualKeyCode: 65,
    nativeVirtualKeyCode: 65,
  };

  await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
    type: "keyDown",
    ...aKeyOptions,
  });

  await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
    type: "keyUp",
    ...aKeyOptions,
  });

  // 2. Press Backspace to delete selection
  const backspaceOptions = {
    key: "Backspace",
    windowsVirtualKeyCode: 8,
    nativeVirtualKeyCode: 8,
  };

  await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
    type: "keyDown",
    ...backspaceOptions,
  });

  await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
    type: "keyUp",
    ...backspaceOptions,
  });

  // Small delay to ensure the DOM updates the empty state
  await new Promise((resolve) => setTimeout(resolve, 100));
}

/**
 * Interface for the message sent to the background script.
 */
interface TypingRequest {
  action: "START_NATIVE_TYPING";
  text: string;
}

/**
 * Focuses on the target element and requests the background script to start typing.
 * @param selector - The CSS selector for the input/textarea.
 * @param promptText - The text string to be typed.
 */
function startAutoFill(selector: string, promptText: string): void {
  const inputField = document.querySelector(selector) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | null;

  if (!inputField) {
    console.error(`Automation Error: Element "${selector}" not found.`);
    return;
  }

  // CRITICAL: The debugger types into the currently focused element.
  inputField.focus();

  const message: TypingRequest = {
    action: "START_NATIVE_TYPING",
    text: promptText,
  };

  chrome.runtime.sendMessage(message, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Message failed:", chrome.runtime.lastError.message);
    } else {
      console.log("Native typing sequence started.");
    }
  });
}

/**
 * Types a string into the focused element using native hardware events.
 * Includes simulated human errors and variable typing rhythms.
 */
export async function nativeType(tabId: number, text: string): Promise<void> {
  // CONFIGURATION: Adjust this factor to speed up or slow down
  // < 1.0 is faster, 1.0 is normal, > 1.0 is slower
  const SPEED_FACTOR = 0.2;

  const target: chrome.debugger.Debuggee = { tabId };
  const typos = "qwertyuiopasdfghjklzxcvbnm";

  try {
    await chrome.debugger.attach(target, "1.3");

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // --- 1. SIMULATED TYPO ---
      if (Math.random() < 0.03 && char !== " " && char !== "\n") {
        const wrongChar = typos[Math.floor(Math.random() * typos.length)];
        await sendKey(target, wrongChar);

        await delay((100 + Math.random() * 100) * SPEED_FACTOR); // Adjusted delay
        await sendKey(target, "Backspace", 8);
        await delay((50 + Math.random() * 50) * SPEED_FACTOR); // Adjusted delay
      }

      // --- 2. TYPE ACTUAL CHARACTER ---
      await sendKey(target, char);

      // --- 3. DYNAMIC TYPING RHYTHM ---
      let waitTime = 20 + Math.random() * 40; // Base interval: 20-60ms

      if ([".", "!", "?"].includes(char)) {
        waitTime += 300 + Math.random() * 300; // Sentence pause
      } else if ([",", ";", ":"].includes(char)) {
        waitTime += 100 + Math.random() * 150; // Comma pause
      } else if (char === " ") {
        waitTime += 20 + Math.random() * 30; // Word gap
      }

      // Apply the Speed Factor to the final wait time
      await delay(waitTime * SPEED_FACTOR);
    }

    await sendEnterKey(target);
    await chrome.debugger.detach(target);
  } catch (err) {
    console.error("Native typing failed:", err);
    chrome.debugger.detach(target).catch(() => {});
  }
}
/**
 * Helper to dispatch a single key down/up sequence
 */
async function sendKey(
  target: chrome.debugger.Debuggee,
  char: string,
  keyCode?: number,
): Promise<void> {
  const isControlKey = char === "Backspace" || char === "Enter";

  const options: any = {
    type: "keyDown",
    key: char,
    // Use 'text' only for actual printable characters
    text: isControlKey ? undefined : char,
    unmodifiedText: isControlKey ? undefined : char,
  };

  if (keyCode) {
    options.windowsVirtualKeyCode = keyCode;
    options.nativeVirtualKeyCode = keyCode;
  }

  await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", options);
  await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
    ...options,
    type: "keyUp",
  });
}

/**
 * Helper to handle sleep/delays
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
