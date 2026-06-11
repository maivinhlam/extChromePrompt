import { DEFAULT_INTERVAL_MS, MAX_PENDING_TASKS } from '../config/automation-settings';
import { type AutomationConfig } from '../domain/automation-types';
import {
  type PromptStatus,
  PromptStatusPending,
  PromptStatusDone,
  PromptStatusFailed,
  PromptStatusInProgress,
} from '../domain/prompt-status';
import { CreateModeImage, CreateModeVideo } from '../domain/create-mode';
import { state } from '../state/automation-state';

import {
  fillPromptInput,
  selectReferenceImage,
  getTopRowTileIds,
  waitForNewTopRowTileId,
  waitForTileDoneById,
  downloadMediaItem,
  waitBlurForActiveTile,
  getImageNameFromMediaContainer,
  randomInt,
} from '../interactions';
import {
  parseSceneNumbers,
  formatSceneName,
  extractPromptPrefixName,
  extractImageNamesFromPrompt,
  sleepMilliseconds,
  loadAutomationState,
  saveAutomationState,
  clearAutomationState,
  appendAutomationLog,
  removePromptFromRunnerSettings,
} from '../utils';
import {
  getPromptWaitTime,
  waitForAvailableTaskSlot,
  waitForNextPromptCountdown,
  waitForPendingTasks,
  waitWhilePaused,
  pauseBeforeStep,
} from './auto';

function createInitialPromptStatuses(length: number): PromptStatus[] {
  return Array.from({ length }, () => PromptStatusPending);
}

type TileCompletionResult = Awaited<ReturnType<typeof waitForTileDoneById>>;
type CompletedTileResult = Extract<TileCompletionResult, { status: 'completed' }>;

function restorePromptStatuses(length: number, savedStatuses?: PromptStatus[]): PromptStatus[] {
  if (!Array.isArray(savedStatuses)) {
    return createInitialPromptStatuses(length);
  }

  return savedStatuses.slice(0, length).concat(createInitialPromptStatuses(Math.max(0, length - savedStatuses.length)));
}

async function persistAutomationProgress(currentIndex: number, promptStatuses: PromptStatus[]): Promise<void> {
  await saveAutomationState({
    running: true,
    mode: state.mode,
    promptCount: state.prompts.length,
    currentIndex,
    promptStatuses,
  });
}

async function queuePromptForRetry(
  promptToRetry: string,
  promptName: string,
  currentIndex: number,
  promptStatuses: PromptStatus[]
): Promise<void> {
  state.prompts.push(promptToRetry);
  promptStatuses.push(PromptStatusPending);

  await appendAutomationLog(
    `Generation failed for ${promptName}. Re-queued prompt at the end (${state.prompts.length}/${state.prompts.length}).`
  );

  await persistAutomationProgress(Math.min(currentIndex, state.prompts.length - 1), promptStatuses);
}

async function markPromptDone(
  promptToComplete: string,
  promptIndex: number,
  promptStatuses: PromptStatus[]
): Promise<void> {
  promptStatuses[promptIndex] = PromptStatusDone;
  await removePromptFromRunnerSettings(promptToComplete);
}

async function maybeSelectReferenceImages(prompt: string): Promise<boolean> {
  if (!state.enableReferenceImages) {
    return true;
  }

  const imageNames = extractImageNamesFromPrompt(prompt);
  if (!imageNames.length) {
    return true;
  }

  const matchedImageNames: string[] = [];
  for (const imageName of imageNames) {
    const newName = state.matchedImageNames[imageName]?.trim() || imageName.trim();
    if (newName) {
      matchedImageNames.push(newName);
      continue;
    }
  }

  if (state.mode === CreateModeImage) {
    if (!matchedImageNames.length) {
      return false;
    }
  }

  await selectReferenceImage(matchedImageNames);
  await sleepMilliseconds(randomInt(1000, 2000));
  return true;
}

async function handleVideoPromptCompletion(
  completedTile: HTMLElement,
  prompt: string,
  promptName: string,
  promptIndex: number,
  promptStatuses: PromptStatus[]
): Promise<void> {
  if (!state.enableAutoDownload) {
    await appendAutomationLog(`Auto-download disabled for '${promptName}'.`);
    await markPromptDone(prompt, promptIndex, promptStatuses);
    return;
  }

  await appendAutomationLog(`Downloading '${promptName}'...`);

  let downloaded = await downloadMediaItem(completedTile, promptName);
  if (downloaded) {
    await appendAutomationLog(`Downloaded '${promptName}' successfully.`);
    await markPromptDone(prompt, promptIndex, promptStatuses);
    return;
  } else {
    // retry 3 times with 5 seconds interval
    const maxRetries = 3;
    const retryIntervalMs = 15000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      await sleepMilliseconds(retryIntervalMs * attempt);
      downloaded = await downloadMediaItem(completedTile, promptName);
      if (downloaded) {
        await appendAutomationLog(`Downloaded '${promptName}' successfully.`);
        await markPromptDone(prompt, promptIndex, promptStatuses);
        return;
      }
    }
  }
  await appendAutomationLog(`Download skipped for '${promptName}': API request or menu flow failed.`);
  promptStatuses[promptIndex] = PromptStatusFailed;
}

async function handleImagePromptCompletion(
  completedTile: HTMLElement,
  prompt: string,
  promptName: string,
  promptIndex: number,
  promptStatuses: PromptStatus[]
): Promise<void> {
  const matchImageName = await getImageNameFromMediaContainer(completedTile, promptName);

  if (matchImageName) {
    await appendAutomationLog(`Get the name of '${promptName}' successfully.`);
    await markPromptDone(prompt, promptIndex, promptStatuses);
    return;
  }

  await appendAutomationLog(`Get the name of '${promptName}' failed: API request or menu flow failed.`);
  promptStatuses[promptIndex] = PromptStatusFailed;

  await queuePromptForRetry(prompt, promptName, promptIndex, promptStatuses);
}

async function handleCompletedTile(
  completedResult: CompletedTileResult,
  prompt: string,
  promptName: string,
  promptIndex: number,
  promptStatuses: PromptStatus[]
): Promise<void> {
  const completedTile = completedResult.tile;
  await waitBlurForActiveTile(completedTile, 20000);
  await sleepMilliseconds(3000);

  if (state.mode === CreateModeVideo) {
    await handleVideoPromptCompletion(completedTile, prompt, promptName, promptIndex, promptStatuses);
    return;
  }

  await handleImagePromptCompletion(completedTile, prompt, promptName, promptIndex, promptStatuses);
}

async function runPromptTask(
  prompt: string,
  promptName: string,
  promptIndex: number,
  knownTopRowTileIds: Set<string>,
  promptStatuses: PromptStatus[]
): Promise<void> {
  if (!(await waitWhilePaused(state))) {
    return;
  }

  const waitingTime = getPromptWaitTime(state);
  const newTileId = await waitForNewTopRowTileId(knownTopRowTileIds, waitingTime, () => state.stopRequested);
  if (!newTileId) {
    await appendAutomationLog(`Task skipped for '${promptName}': no new tile detected in time.`);
    return;
  }

  if (!(await waitWhilePaused(state))) {
    return;
  }

  await sleepMilliseconds(15000);

  const tileResult = await waitForTileDoneById(newTileId, waitingTime, () => state.stopRequested);

  if (tileResult.status === 'failed') {
    await queuePromptForRetry(prompt, promptName, promptIndex, promptStatuses);
    return;
  }

  if (tileResult.status !== 'completed') {
    await appendAutomationLog(`Task skipped for '${promptName}': tile did not reach 100% in time.`);
    return;
  }

  await handleCompletedTile(tileResult, prompt, promptName, promptIndex, promptStatuses);
}

export async function startAutomation(config: AutomationConfig): Promise<void> {
  if (state.running) {
    throw new Error('Automation is already running.');
  }

  if (!Array.isArray(config?.prompts) || !config.prompts.length) {
    throw new Error('No prompts provided.');
  }

  state.running = true;
  state.stopRequested = false;
  state.pauseRequested = false;
  state.prompts = config.prompts;
  state.mode = config.mode;
  state.intervalMs = Math.max(1000, Number(config.intervalMs || DEFAULT_INTERVAL_MS));
  state.enableReferenceImages = config.enableReferenceImages !== false;
  state.enableAutoDownload = config.enableAutoDownload !== false;

  let promptStatuses = createInitialPromptStatuses(state.prompts.length);
  let startIndex = 0;
  const pendingTasks = new Set<Promise<void>>();

  const savedState = await loadAutomationState();
  if (
    savedState &&
    savedState.running &&
    savedState.mode === state.mode &&
    savedState.promptCount === state.prompts.length
  ) {
    startIndex = Math.max(0, Math.min(Number(savedState.currentIndex || 0), state.prompts.length - 1));
    promptStatuses = restorePromptStatuses(state.prompts.length, savedState.promptStatuses);
  }

  try {
    await appendAutomationLog(`Automation started. Mode: ${state.mode}. Total prompts: ${state.prompts.length}.`);

    if (startIndex > 0) {
      await appendAutomationLog(`Resuming from prompt ${startIndex + 1}.`);
    }

    await persistAutomationProgress(startIndex, promptStatuses);

    await pauseBeforeStep(`Set mode and model to ${state.mode}.`, () => state.stopRequested, appendAutomationLog);

    let i = startIndex;
    let count = 10;
    while (i < state.prompts.length || pendingTasks.size > 0) {
      count--;
      if (count <= 0) {
        await sleepMilliseconds(randomInt(7000, 15000));
        count = 10;
      }
      if (i >= state.prompts.length) {
        await Promise.race(pendingTasks);
        continue;
      }

      const canContinue = await waitWhilePaused(state);
      if (!canContinue) {
        break;
      }

      const promptIndex = i;
      const prompt = state.prompts[promptIndex];
      const sceneNumbers = parseSceneNumbers(prompt, promptIndex + 1);
      const promptName = extractPromptPrefixName(prompt, formatSceneName(sceneNumbers.scene, ''));
      promptStatuses[i] = PromptStatusInProgress;

      await persistAutomationProgress(promptIndex, promptStatuses);

      if (state.stopRequested) {
        await appendAutomationLog('Stop requested. Exiting before next prompt.');
        break;
      }

      await appendAutomationLog(`Prompt ${promptIndex + 1}/${state.prompts.length}: SCENE ${sceneNumbers.scene}.`);

      const referenceImagesSelected = await maybeSelectReferenceImages(prompt);
      if (!referenceImagesSelected) {
        await appendAutomationLog(`Reference images is not complete generated for '${promptName}'. Rerun`);
        promptStatuses[promptIndex] = PromptStatusFailed;
        await persistAutomationProgress(promptIndex, promptStatuses);
        await queuePromptForRetry(prompt, promptName, promptIndex, promptStatuses);
        await waitForNextPromptCountdown(state, promptName);

        i += 1;
        if (i > 250) {
          break;
        }
        continue;
      }
      const knownTopRowTileIds = new Set(getTopRowTileIds());

      await fillPromptInput(prompt);

      const pendingTask = (async (): Promise<void> => {
        await runPromptTask(prompt, promptName, promptIndex, knownTopRowTileIds, promptStatuses);
      })().catch(async (error: unknown) => {
        await appendAutomationLog(`Task failed for '${promptName}': ${(error as Error).message}`);
      });

      pendingTasks.add(pendingTask);
      void pendingTask.finally(() => {
        pendingTasks.delete(pendingTask);
      });

      if (pendingTasks.size >= MAX_PENDING_TASKS) {
        await waitForAvailableTaskSlot(pendingTasks);
      }

      if (i >= 0 && i < state.prompts.length && !state.stopRequested) {
        await waitForNextPromptCountdown(state, promptName);
      }

      i += 1;
      if (i > 250) {
        break;
      }
    }

    await waitForPendingTasks(pendingTasks);

    await clearAutomationState();
    await appendAutomationLog('Automation completed.');
    window.alert('Automation completed.');
  } catch (error) {
    await appendAutomationLog(`Automation error: ${(error as Error).message}`);
    throw error;
  } finally {
    state.pauseRequested = false;
    state.running = false;
  }
}
