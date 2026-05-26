import { RUNNER_SETTINGS_KEY } from './config/storage-keys';
import { loadRunnerSettings, updateRunnerSettings } from './utils';
import type { RunnerSettings } from './domain/automation-types';

const toggleInput = document.getElementById('injectPanelToggle') as HTMLInputElement | null;

function isPanelEnabled(settings: RunnerSettings): boolean {
  return settings.injectPanelEnabled !== false;
}

function renderToggle(enabled: boolean): void {
  if (toggleInput) {
    toggleInput.checked = enabled;
  }
}

async function initializePopup(): Promise<void> {
  if (!toggleInput) {
    return;
  }

  renderToggle(isPanelEnabled(await loadRunnerSettings()));

  toggleInput.addEventListener('change', () => {
    const nextEnabled = toggleInput.checked;
    toggleInput.disabled = true;

    void updateRunnerSettings({ injectPanelEnabled: nextEnabled })
      .then(() => {
        renderToggle(nextEnabled);
      })
      .finally(() => {
        toggleInput.disabled = false;
      });
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes[RUNNER_SETTINGS_KEY]) {
      return;
    }

    const nextSettings = (changes[RUNNER_SETTINGS_KEY].newValue as RunnerSettings | undefined) || {};
    renderToggle(isPanelEnabled(nextSettings));
  });
}

void initializePopup();
