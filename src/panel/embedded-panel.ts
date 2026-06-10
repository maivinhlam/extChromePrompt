import { RUNNER_SETTINGS_KEY } from '../config/storage-keys';
import type { RunnerSettings } from '../domain/automation-types';
import { loadRunnerSettings } from '../utils';
import { CONTENT_PANEL_HTML_URL, PANEL_HOST_ID } from './constants';
import { mountEmbeddedPanel } from './controller';

let panelInjectionPromise: Promise<void> | null = null;

function setPanelHostVisible(visible: boolean): void {
  const host = document.getElementById(PANEL_HOST_ID) as HTMLDivElement | null;

  if (host) {
    host.style.display = visible ? '' : 'none';
    if (visible) {
      document.body.style.setProperty('width', '80%', 'important');
    } else {
      document.body.style.removeProperty('margin-right');
    }
  }
}

async function ensurePanelVisibility(): Promise<void> {
  const settings = await loadRunnerSettings();

  if (settings.injectPanelEnabled === false) {
    setPanelHostVisible(false);
    return;
  }

  if (!document.getElementById(PANEL_HOST_ID)) {
    if (!panelInjectionPromise) {
      panelInjectionPromise = injectPanel().finally(() => {
        panelInjectionPromise = null;
      });
    }

    await panelInjectionPromise;
  }

  const latestSettings = await loadRunnerSettings();
  setPanelHostVisible(latestSettings.injectPanelEnabled !== false);
}

function onRunnerSettingsChanged(changes: Record<string, chrome.storage.StorageChange>, areaName: string): void {
  if (areaName !== 'local' || !changes[RUNNER_SETTINGS_KEY]) {
    return;
  }

  const nextSettings = (changes[RUNNER_SETTINGS_KEY].newValue as RunnerSettings | undefined) || {};

  if (nextSettings.injectPanelEnabled === false) {
    setPanelHostVisible(false);
    return;
  }

  void ensurePanelVisibility();
}

async function injectPanel(): Promise<void> {
  if (document.getElementById(PANEL_HOST_ID)) {
    return;
  }

  const host = document.createElement('div');
  host.id = PANEL_HOST_ID;
  host.style.cssText = 'position: fixed; right: 0; top: 0; width: 20vw; height: 100vh; z-index: 2147483647;';

  const shadow = host.attachShadow({ mode: 'open' });

  try {
    const response = await fetch(CONTENT_PANEL_HTML_URL);
    if (!response.ok) {
      throw new Error(`Failed to load content panel HTML: ${response.status}`);
    }

    shadow.innerHTML = await response.text();
  } catch (error) {
    console.error('Failed to inject Flow Prompt Runner panel.', error);
    return;
  }

  document.body.appendChild(host);
  mountEmbeddedPanel(shadow);
}

export function initializeEmbeddedPanel(): void {
  chrome.storage.onChanged.addListener(onRunnerSettingsChanged);
  void ensurePanelVisibility();
}
