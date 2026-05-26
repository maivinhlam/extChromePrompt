import { findModelButton } from '../dom/dom-finders';
import { startAutomation } from '../automation/runner';
import { LOG_STORAGE_KEY, RUNNER_SETTINGS_KEY, STATUS_STORAGE_KEY } from '../config/storage-keys';
import { CreateModeImage, CreateModeVideo, type CreateMode } from '../domain/create-mode';
import { type AutomationFeatures, type RunnerSettings } from '../domain/automation-types';
import { state } from '../state/automation-state';
import {
  appendAutomationLog,
  loadAutomationStatus,
  loadRunnerSettings,
  setAutomationStatus,
  updateRunnerSettings,
} from '../utils';
import { DEFAULT_PROMPTS_TEXT, PROMPT_PREVIEW_LENGTH } from './constants';

export function mountEmbeddedPanel(shadow: ShadowRoot): void {
  const wrapper = shadow.getElementById('wrapper') as HTMLDivElement | null;
  const dragHandle = shadow.getElementById('drag-handle') as HTMLDivElement | null;
  const panelWrap = shadow.getElementById('panel-wrap') as HTMLDivElement | null;
  const reopenBtn = shadow.getElementById('reopen-btn') as HTMLButtonElement | null;

  if (!wrapper || !dragHandle || !panelWrap || !reopenBtn) {
    console.error('Content panel HTML is missing required elements.');
    return;
  }

  let posTop = 72;
  let posRight = 16;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  dragHandle.addEventListener('mousedown', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.id === 'collapse-btn' || target.id === 'close-btn') {
      return;
    }
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!dragging) {
      return;
    }

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    posTop = Math.max(0, posTop + dy);
    posRight = Math.max(0, posRight - dx);

    wrapper.style.top = `${posTop}px`;
    wrapper.style.right = `${posRight}px`;
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
  });

  const collapseBtn = shadow.getElementById('collapse-btn') as HTMLButtonElement;
  const closeBtn = shadow.getElementById('close-btn') as HTMLButtonElement;
  const compactStatusEl = shadow.getElementById('compact-status-text') as HTMLElement | null;
  const intervalInput = shadow.getElementById('intervalSeconds') as HTMLInputElement;
  const modeImageInput = shadow.getElementById('modeImage') as HTMLInputElement;
  const modeVideoInput = shadow.getElementById('modeVideo') as HTMLInputElement;
  const enableReferenceImagesInput = shadow.getElementById('enableReferenceImages') as HTMLInputElement;
  const enableAutoDownloadInput = shadow.getElementById('enableAutoDownload') as HTMLInputElement;
  const promptsInput = shadow.getElementById('prompts') as HTMLTextAreaElement;
  const promptListEl = shadow.getElementById('promptList') as HTMLUListElement;
  const promptListEmptyEl = shadow.getElementById('promptListEmpty') as HTMLElement;
  const totalPromptsEl = shadow.getElementById('totalPrompts') as HTMLElement;
  const statusEl = shadow.getElementById('status') as HTMLElement;
  const clearPromptsBtn = shadow.getElementById('clearPromptsBtn') as HTMLButtonElement;
  const clearReferentBtn = shadow.getElementById('clearReferentBtn') as HTMLButtonElement;
  const importBtn = shadow.getElementById('importBtn') as HTMLButtonElement;
  const startBtn = shadow.getElementById('startBtn') as HTMLButtonElement;
  const pauseBtn = shadow.getElementById('pauseBtn') as HTMLButtonElement;
  const resumeBtn = shadow.getElementById('resumeBtn') as HTMLButtonElement;
  const stopBtn = shadow.getElementById('stopBtn') as HTMLButtonElement;
  const startContinueBtn = shadow.getElementById('startContinueBtn') as HTMLButtonElement;

  let collapsed = false;
  let expandedPromptIndex: number | null = null;

  panelWrap.style.height = '660px';

  const setCollapsedState = (nextCollapsed: boolean): void => {
    collapsed = nextCollapsed;

    if (collapsed) {
      panelWrap.classList.add('collapsed');
      collapseBtn.textContent = '+';
      collapseBtn.title = 'Mở rộng';
      return;
    }

    panelWrap.classList.remove('collapsed');
    collapseBtn.textContent = '−';
    collapseBtn.title = 'Thu gọn';
  };

  collapseBtn.addEventListener('click', () => {
    setCollapsedState(!collapsed);
  });

  closeBtn.addEventListener('click', () => {
    wrapper.style.display = 'none';
    reopenBtn.style.top = `${posTop}px`;
    reopenBtn.style.right = `${posRight}px`;
    reopenBtn.classList.add('visible');
  });

  reopenBtn.addEventListener('click', () => {
    wrapper.style.display = 'flex';
    reopenBtn.classList.remove('visible');
  });

  const getPromptLines = (): string[] =>
    promptsInput.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

  const truncatePrompt = (prompt: string): string => {
    if (prompt.length <= PROMPT_PREVIEW_LENGTH) {
      return prompt;
    }

    return `${prompt.slice(0, PROMPT_PREVIEW_LENGTH - 3)}...`;
  };

  const renderPromptList = (): void => {
    const prompts = getPromptLines();
    promptListEl.textContent = '';
    promptListEmptyEl.hidden = prompts.length > 0;

    const fragment = document.createDocumentFragment();

    prompts.forEach((prompt, index) => {
      const item = document.createElement('li');
      item.className = 'prompt-item';
      item.dataset.index = String(index);
      item.setAttribute('aria-expanded', String(expandedPromptIndex === index));
      if (expandedPromptIndex === index) {
        item.classList.add('is-expanded');
      }

      const text = document.createElement('span');
      text.className = 'prompt-item-text';
      text.textContent = expandedPromptIndex === index ? prompt : truncatePrompt(prompt);
      text.title = prompt;

      const actions = document.createElement('div');
      actions.className = 'prompt-item-actions';

      const rerunBtn = document.createElement('button');
      rerunBtn.type = 'button';
      rerunBtn.className = 'prompt-item-btn prompt-rerun-btn';
      rerunBtn.dataset.action = 'rerun';
      rerunBtn.dataset.index = String(index);
      rerunBtn.title = 'Chạy lại prompt này';
      rerunBtn.setAttribute('aria-label', 'Chạy lại prompt này');
      rerunBtn.textContent = '↻';

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'prompt-item-btn prompt-delete-btn';
      deleteBtn.dataset.action = 'delete';
      deleteBtn.dataset.index = String(index);
      deleteBtn.title = 'Xóa prompt này';
      deleteBtn.setAttribute('aria-label', 'Xóa prompt này');
      deleteBtn.textContent = '✕';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'prompt-item-btn prompt-copy-btn';
      copyBtn.dataset.action = 'copy';
      copyBtn.dataset.index = String(index);
      copyBtn.title = 'Sao chép prompt này';
      copyBtn.setAttribute('aria-label', 'Sao chép prompt này');
      copyBtn.textContent = '📋';

      actions.append(rerunBtn, deleteBtn, copyBtn);
      item.append(text, actions);
      fragment.appendChild(item);
    });

    promptListEl.appendChild(fragment);
  };

  const syncPromptLines = (prompts: string[]): void => {
    promptsInput.value = prompts.join('\n');
    promptsInput.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const updatePromptCount = (): void => {
    totalPromptsEl.textContent = String(getPromptLines().length);
  };

  const updateActionButtons = (): void => {
    const isRunning = !!state.running;
    const isPaused = !!state.pauseRequested;

    startBtn.hidden = isRunning;
    pauseBtn.hidden = !isRunning || isPaused;
    resumeBtn.hidden = !isRunning || !isPaused;
    stopBtn.hidden = !isRunning;
    startContinueBtn.hidden = isRunning;
  };

  const setStatus = (text: string, isError = false): void => {
    statusEl.textContent = text;
    statusEl.style.color = isError ? '#8a1d1d' : '#2f594a';
    if (compactStatusEl) {
      compactStatusEl.textContent = text;
      compactStatusEl.style.color = isError ? '#8a1d1d' : '#2f594a';
    }
  };

  const getIntervalSeconds = (): number => {
    const digitsOnly = intervalInput.value.replace(/\D+/g, '');
    const parsed = Number(digitsOnly);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
  };

  const getFeatureSettings = (): AutomationFeatures => ({
    enableReferenceImages: enableReferenceImagesInput.checked,
    enableAutoDownload: enableAutoDownloadInput.checked,
  });

  const persistSettings = async (): Promise<void> => {
    const updated: RunnerSettings = {
      intervalSeconds: getIntervalSeconds(),
      mode: modeVideoInput.checked ? CreateModeVideo : CreateModeImage,
      promptsText: promptsInput.value,
      ...getFeatureSettings(),
    };

    await updateRunnerSettings(updated);
  };

  const loadSettings = async (): Promise<void> => {
    const settings = await loadRunnerSettings();

    intervalInput.value = String(settings.intervalSeconds || 15);

    const mode: CreateMode = settings.mode;
    modeImageInput.checked = mode === CreateModeImage;
    modeVideoInput.checked = mode === CreateModeVideo;
    enableReferenceImagesInput.checked = settings.enableReferenceImages !== false;
    enableAutoDownloadInput.checked = settings.enableAutoDownload !== false;
    promptsInput.value = settings.promptsText || '';
    state.matchedImageNames = { ...(settings.matchedImageNames || {}) };
    updatePromptCount();
    renderPromptList();
  };

  const clearLogs = async (): Promise<void> => {
    await chrome.storage.local.set({ [LOG_STORAGE_KEY]: [] });
  };

  const startFromPanel = async (): Promise<void> => {
    if (state.running) {
      setStatus('Automation is already running.', true);
      updateActionButtons();
      return;
    }

    const prompts = getPromptLines();
    if (!prompts.length) {
      setStatus('Please add at least one prompt line.', true);
      return;
    }

    const selectedMode = modeVideoInput.checked ? CreateModeVideo : CreateModeImage;
    const modelButton = findModelButton(selectedMode);
    if (!modelButton) {
      setStatus('Could not find model selection button on the page.', true);
      window.alert('Vui lòng chọn đúng model (banana khi tạo ảnh và Video khi tạo video).');
      return;
    }
    console.log('🚀 ~ startFromPanel ~ modelButton:', modelButton);

    await clearLogs();
    state.pauseRequested = false;
    await setAutomationStatus(`Started. Total prompts: ${prompts.length}`);
    await persistSettings();

    setStatus(`Started. Total prompts: ${prompts.length}`);
    setCollapsedState(true);
    const automationRun = startAutomation({
      prompts,
      mode: selectedMode,
      intervalMs: getIntervalSeconds() * 1000,
      ...getFeatureSettings(),
    });

    updateActionButtons();

    void automationRun.catch((error: Error) => {
      state.running = false;
      state.pauseRequested = false;
      updateActionButtons();
      setStatus(error.message || 'Could not start automation.', true);
    });
  };

  const onPause = async (): Promise<void> => {
    if (!state.running) {
      setStatus('Automation is not running.', true);
      updateActionButtons();
      return;
    }

    state.pauseRequested = true;
    updateActionButtons();
    await appendAutomationLog('Pause requested from embedded panel.');
    await setAutomationStatus('Pause requested.');
    setStatus('Pause requested.');
  };

  const onResume = async (): Promise<void> => {
    if (!state.running) {
      setStatus('Automation is not running.', true);
      updateActionButtons();
      return;
    }

    state.pauseRequested = false;
    updateActionButtons();
    await appendAutomationLog('Resume requested from embedded panel.');
    await setAutomationStatus('Resume requested.');
    setStatus('Resume requested.');
  };

  const onStop = async (): Promise<void> => {
    state.stopRequested = true;
    state.pauseRequested = false;
    await appendAutomationLog('Stop requested from embedded panel.');
    await setAutomationStatus('Stop requested.');
    updateActionButtons();
    setStatus('Stop requested.');
  };

  const onClearPrompts = async (): Promise<void> => {
    const isDelete = confirm('Bạn có chắc chắn muốn xóa tất cả các prompt không?');
    if (isDelete) {
      syncPromptLines([]);
      setStatus('Cleared all prompts.');
      return;
    }

    setStatus('Đã hủy thao tác.');
  };

  const onClearReferent = async (): Promise<void> => {
    const isDelete = confirm('Bạn có chắc chắn muốn xóa tất cả các referent images không?');
    if (isDelete) {
      state.matchedImageNames = {};
      await updateRunnerSettings(state);
      setStatus('Cleared all referent images.');
      return;
    }

    setStatus('Đã hủy thao tác.');
  };

  const onImportPrompts = async (): Promise<void> => {
    const importedText = window.prompt('Please enter your prompt:', promptsInput.value || DEFAULT_PROMPTS_TEXT);

    if (importedText === null) {
      setStatus('Import canceled.');
      return;
    }

    const importedPrompts = importedText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (!importedPrompts.length) {
      setStatus('Nothing to import.', true);
      return;
    }

    syncPromptLines([...getPromptLines(), ...importedPrompts]);
    setStatus(`Imported ${importedPrompts.length} prompt${importedPrompts.length === 1 ? '' : 's'}.`);
  };

  const onStorageChanged = (changes: Record<string, chrome.storage.StorageChange>, areaName: string): void => {
    if (areaName !== 'local') {
      return;
    }

    if (changes[STATUS_STORAGE_KEY]) {
      const nextStatus =
        typeof changes[STATUS_STORAGE_KEY].newValue === 'string'
          ? (changes[STATUS_STORAGE_KEY].newValue as string)
          : 'Ready.';

      if (
        nextStatus === 'Automation completed.' ||
        nextStatus === 'Stop requested.' ||
        nextStatus.startsWith('Automation error')
      ) {
        state.running = false;
        state.pauseRequested = false;
        updateActionButtons();
      }

      setStatus(nextStatus);
    }

    if (changes[RUNNER_SETTINGS_KEY]) {
      const nextSettings = (changes[RUNNER_SETTINGS_KEY].newValue as RunnerSettings | undefined) || {};
      promptsInput.value = nextSettings.promptsText || '';
      state.matchedImageNames = { ...(nextSettings.matchedImageNames || {}) };
      updatePromptCount();
      renderPromptList();
    }
  };

  modeImageInput.addEventListener('change', () => {
    void persistSettings();
  });
  modeVideoInput.addEventListener('change', () => {
    void persistSettings();
  });
  enableReferenceImagesInput.addEventListener('change', () => {
    void persistSettings();
  });
  enableAutoDownloadInput.addEventListener('change', () => {
    void persistSettings();
  });
  promptsInput.addEventListener('input', () => {
    updatePromptCount();
    renderPromptList();
    void persistSettings();
  });

  promptListEl.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const actionBtn = target?.closest('button[data-action]') as HTMLButtonElement | null;

    if (!target) {
      return;
    }

    const itemEl = target.closest('.prompt-item') as HTMLLIElement | null;
    const index = Number((actionBtn || itemEl)?.dataset.index);
    const prompts = getPromptLines();
    if (!Number.isInteger(index) || index < 0 || index >= prompts.length) {
      return;
    }

    const selectedPrompt = prompts[index];
    if (!actionBtn && itemEl) {
      expandedPromptIndex = expandedPromptIndex === index ? null : index;
      renderPromptList();
      return;
    }

    if (actionBtn.dataset.action === 'delete') {
      prompts.splice(index, 1);
      if (expandedPromptIndex === index) {
        expandedPromptIndex = null;
      } else if (expandedPromptIndex !== null && expandedPromptIndex > index) {
        expandedPromptIndex -= 1;
      }
      syncPromptLines(prompts);
      setStatus(prompts.length ? `Deleted prompt ${index + 1}.` : 'Cleared all prompts.');
      return;
    }

    if (actionBtn.dataset.action === 'rerun') {
      syncPromptLines([...prompts, selectedPrompt]);
      setStatus(`Queued prompt ${index + 1} to run again.`);
    }

    if (actionBtn.dataset.action === 'copy') {
      void navigator.clipboard.writeText(selectedPrompt).then(() => {
        setStatus(`Copied prompt ${index + 1} to clipboard.`);
      });
    }
  });

  startBtn.addEventListener('click', () => {
    void startFromPanel();
  });
  pauseBtn.addEventListener('click', () => {
    void onPause();
  });
  resumeBtn.addEventListener('click', () => {
    void onResume();
  });
  startContinueBtn.addEventListener('click', () => {
    void startFromPanel();
  });
  stopBtn.addEventListener('click', () => {
    void onStop();
  });
  clearPromptsBtn.addEventListener('click', () => {
    void onClearPrompts();
  });
  clearReferentBtn.addEventListener('click', () => {
    void onClearReferent();
  });
  importBtn.addEventListener('click', () => {
    void onImportPrompts();
  });

  chrome.storage.onChanged.addListener(onStorageChanged);

  updateActionButtons();

  void Promise.all([
    loadSettings(),
    loadAutomationStatus().then((statusText) => {
      setStatus(statusText);
    }),
  ]);
}
