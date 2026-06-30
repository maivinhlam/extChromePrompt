import {
  findPromptInput,
  findModelButton,
  findVideoReferencesTab,
  findVideoModelDropdownButton,
  findReferenceImageOpenButton,
  findButtonByText,
  waitForDialog,
  waitForMenu,
} from '../dom/dom-finders';
import { CreateModeVideo, type CreateMode } from '../domain/create-mode';
import { cleanPromptText, appendAutomationLog, sleepMilliseconds } from '../utils';
import { randomInt, waitForTransientUiToClose, withPageInteractionLock } from './shared';

export async function fillPromptInput(prompt: string): Promise<boolean> {
  return withPageInteractionLock(async () => {
    const newPrompt = cleanPromptText(prompt);

    const promptInput = findPromptInput();
    if (!promptInput) {
      throw new Error('Could not find Flow prompt input.');
    }

    const editor = (promptInput.closest('[data-slate-editor="true"]') || promptInput) as HTMLElement | null;
    if (!editor) {
      console.error('Khong tim thay khung nhap prompt!');
      return false;
    }

    editor.focus();

    const response = await chrome.runtime.sendMessage({
      action: 'PERFORM_TYPE',
      text: newPrompt,
      checkDuplicate: false,
    });
    if (response?.status === 'completed') {
      console.log('This specific typing task is DONE!');
    }
    return true;
  });
}

export async function clickAndWaitForMenu(
  button: HTMLElement,
  maxRetries: number,
  timeoutPerTryMs: number
): Promise<boolean> {
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    await button.click();
    const menuShown = await waitForMenu(timeoutPerTryMs);
    if (menuShown) {
      return true;
    }
    await sleepMilliseconds(160);
  }

  return false;
}

export async function selectModelAndModeTab(mode: CreateMode): Promise<void> {
  await appendAutomationLog(`Selecting ${mode} tab.`);

  const modelButton = findModelButton(mode);
  if (modelButton) {
    const menuOpened = await clickAndWaitForMenu(modelButton, 3, 3000);
    if (!menuOpened) {
      await appendAutomationLog('Model menu did not appear after clicking model button.');
      return;
    }

    const menuShown = await waitForMenu(3000);
    if (!menuShown) {
      await appendAutomationLog('Model menu did not appear after clicking model button.');
      return;
    }

    if (mode === CreateModeVideo) {
      const videoOption = findButtonByText(['video'], menuShown);
      if (videoOption) {
        await videoOption.click();
        await appendAutomationLog('Selected Video option from model menu.');
      } else {
        await appendAutomationLog('Video option not found in model menu.');
      }

      await configureVideoModeModel();
      await sleepMilliseconds(300);
      await videoOption.click();
    } else {
      const imageOption = findButtonByText(['Hình ảnh'], menuShown);
      if (imageOption) {
        await imageOption.click();
        await sleepMilliseconds(200);
        await appendAutomationLog('Selected Hinh anh option from model menu.');
      } else {
        await appendAutomationLog('Hinh anh option not found in model menu.');
      }
    }
  }
}

export async function configureVideoModeModel(): Promise<void> {
  await appendAutomationLog('Click Thanh phan tab.');
  const referencesTab = findVideoReferencesTab();
  if (referencesTab) {
    await referencesTab.click();
    await sleepMilliseconds(250);
    await appendAutomationLog('"Thanh phan" tab selected.');
  } else {
    await appendAutomationLog('Thanh phan tab not found.');
    return;
  }

  await appendAutomationLog('Open video model dropdown.');
  const modelDropdown = findVideoModelDropdownButton();
  if (!modelDropdown) {
    await appendAutomationLog('Video model dropdown not found.');
    return;
  }

  await modelDropdown.click();
  await sleepMilliseconds(220);

  await appendAutomationLog('Choose Veo 3.1 - Lite [Lower Priority].');
  const veoLiteOption = findButtonByText(['veo 3.1 - lite [lower priority]', 'veo 3.1 - lite']);
  if (veoLiteOption) {
    await veoLiteOption.click();
    await sleepMilliseconds(240);
    await appendAutomationLog('Video model set to Veo 3.1 - Lite [Lower Priority].');
  } else {
    await appendAutomationLog('Veo 3.1 - Lite option not found.');
  }
}

export async function selectReferenceImage(expectedNames: string[]): Promise<void> {
  await withPageInteractionLock(async () => {
    const openButton = findReferenceImageOpenButton();
    if (!openButton) {
      await appendAutomationLog('Reference image open button not found.');
      return;
    }

    for (let index = 0; index < expectedNames.length; index += 1) {
      await openButton.focus();
      await sleepMilliseconds(randomInt(100, 200));

      await openButton.click();
      await sleepMilliseconds(randomInt(400, 600));

      const dialogAfter = await waitForDialog(500);
      if (dialogAfter) {
        const matchImageName = expectedNames[index];

        await sleepMilliseconds(randomInt(200, 300));

        const response = await chrome.runtime.sendMessage({
          action: 'PERFORM_TYPE',
          text: matchImageName,
          checkDuplicate: true,
        });
        if (response?.status === 'completed') {
          console.log('This specific typing to matchImageName task is DONE!');
        }
        await waitForTransientUiToClose(300);
      } else {
        await appendAutomationLog('Reference image dialog did not appear after clicking open button.');
      }
    }

    await sleepMilliseconds(300);
  });
}
