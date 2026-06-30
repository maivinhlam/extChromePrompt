import { pauseBeforeStep } from '../automation/auto';
import { randomInt } from '../interactions';
import { appendAutomationLog, setAutomationStatus, sleepMilliseconds } from '../utils';

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
export async function nativeType(tabId: number, text: string, checkDuplicate: boolean): Promise<void> {
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

    await sleepMilliseconds(randomInt(1200, 1500)); // Wait for the text to be processed before sending Enter

    // Check for duplicate text occurrences on the page
    if (checkDuplicate && text && text.trim().length > 0) {
      const countResult = (await chrome.debugger.sendCommand(target, 'Runtime.evaluate', {
        expression: `(function() {
          const t = ${JSON.stringify(text)};
          const popup = document.querySelector('[role="dialog"][data-state="open"]');
          const body = popup ? popup.innerText : '';
          let count = 0, pos = 0;
          while ((pos = body.indexOf(t, pos)) !== -1) { count++; pos += t.length; }
          return count;
        })()`,
        returnByValue: true,
      })) as { result?: { value?: number } };

      const occurrenceCount = countResult?.result?.value ?? 0;

      if (occurrenceCount >= 3) {
        await appendAutomationLog(
          `[DuplicateText] "${text}" xuất hiện ${occurrenceCount} lần trên trang. Vui lòng đổi tên text để tiếp tục.`
        );
        await setAutomationStatus('Pause requested.');
        await chrome.tabs.sendMessage(tabId, {
          type: 'PAUSE_AUTOMATION',
          reason: `[DuplicateText] "${text}" xuất hiện ${occurrenceCount} lần. Vui lòng đổi tên text để tiếp tục.`,
        });
        if (attachedHere) {
          await chrome.debugger.detach(target);
        }

        await chrome.debugger.sendCommand(target, 'Runtime.evaluate', {
          expression: `(function() {
            if (document.getElementById('__ext_dup_modal__')) return;
            const t = ${JSON.stringify(text)}.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
            const overlay = document.createElement('div');
            overlay.id = '__ext_dup_modal__';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:sans-serif;';
            const box = document.createElement('div');
            box.style.cssText = 'background:#fff;border-radius:10px;padding:28px 36px;max-width:440px;width:90%;text-align:center;box-shadow:0 6px 32px rgba(0,0,0,0.25);';
            box.innerHTML = '<div style="font-size:36px;margin-bottom:10px;">⚠️</div>'
              + '<h3 style="margin:0 0 10px;color:#c62828;font-size:18px;">Phát hiện trùng lặp</h3>'
              + '<p style="margin:0 0 18px;color:#444;line-height:1.5;">Giá trị <strong style="color:#1565c0;">' + t + '</strong> xuất hiện <strong>${occurrenceCount}</strong> lần trên trang.<br/>Vui lòng đổi tên <em>text</em> để tiếp tục chạy.</p>'
              + '<button id="__ext_dup_ok__" style="background:#1976d2;color:#fff;border:none;padding:9px 28px;border-radius:5px;cursor:pointer;font-size:15px;">OK</button>';
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            document.getElementById('__ext_dup_ok__').onclick = () => overlay.remove();
          })()`,
        });
      } else {
        await sendEnterKey(target);
      }
    }

    if (!checkDuplicate) {
      await sendEnterKey(target);
    }
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
