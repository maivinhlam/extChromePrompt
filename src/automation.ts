import { state, MAX_PENDING_TASKS, DEFAULT_INTERVAL_MS } from './constants';
import { type AutomationConfig } from './types';
import {
  type PromptStatus,
  PromptStatusPending,
  PromptStatusDone,
  PromptStatusFailed,
  PromptStatusInProgress,
} from './enums/promeStatusType';
import { CreateModeVideo } from './enums/modeType';
import {
  loadAutomationState,
  saveAutomationState,
  clearAutomationState,
  appendAutomationLog,
  setAutomationStatus,
  removePromptFromRunnerSettings,
} from './storage';
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
} from './interactions';
import { parseSceneNumbers, formatSceneName, extractPromptPrefixName } from './formatting';
import { extractImageNamesFromPrompt, pauseBeforeStep, sleepMilliseconds } from './utils';

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

async function waitForAvailableTaskSlot(pendingTasks: Set<Promise<void>>): Promise<void> {
  if (pendingTasks.size < MAX_PENDING_TASKS) {
    return;
  }

  await appendAutomationLog(
    `Reached max pending tasks (${pendingTasks.size}/${MAX_PENDING_TASKS}). Waiting for one task to finish.`
  );
  await Promise.race(pendingTasks);
}

async function waitForPendingTasks(pendingTasks: Set<Promise<void>>): Promise<void> {
  if (!pendingTasks.size) {
    return;
  }

  const tasksToWait = [...pendingTasks];
  await appendAutomationLog(`Waiting for ${tasksToWait.length} task(s) to finish.`);
  await Promise.allSettled(tasksToWait);
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

async function maybeSelectReferenceImages(prompt: string): Promise<void> {
  if (!state.enableReferenceImages) {
    return;
  }

  const imageNames = extractImageNamesFromPrompt(prompt);
  if (!imageNames.length) {
    return;
  }

  await selectReferenceImage(imageNames);
  await sleepMilliseconds(randomInt(1000, 2000));
}

function getPromptWaitTime(): number {
  if (state.mode === CreateModeVideo) {
    return randomInt(150000, 180000);
  }

  return 60000;
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

  const downloaded = await downloadMediaItem(completedTile, promptName);
  if (downloaded) {
    await appendAutomationLog(`Downloaded '${promptName}' successfully.`);
    await markPromptDone(prompt, promptIndex, promptStatuses);
    return;
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
  if (!(await waitWhilePaused())) {
    return;
  }

  const waitingTime = getPromptWaitTime();
  const newTileId = await waitForNewTopRowTileId(knownTopRowTileIds, waitingTime, () => state.stopRequested);
  if (!newTileId) {
    await appendAutomationLog(`Task skipped for '${promptName}': no new tile detected in time.`);
    return;
  }

  if (!(await waitWhilePaused())) {
    return;
  }

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
    while (i < state.prompts.length || pendingTasks.size > 0) {
      if (i >= state.prompts.length) {
        await Promise.race(pendingTasks);
        continue;
      }

      const canContinue = await waitWhilePaused();
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

      // waiting when press pause
      if (!(await waitWhilePaused())) {
        break;
      }

      // ===================== Step 1: select reference image if needed
      await maybeSelectReferenceImages(prompt);
      const knownTopRowTileIds = new Set(getTopRowTileIds());

      // ===================== Step 2: fill prompt input
      await fillPromptInput(prompt);

      // ===================== Step 3: wait for new tile
      const pendingTask = (async (): Promise<void> => {
        await runPromptTask(prompt, promptName, promptIndex, knownTopRowTileIds, promptStatuses);
      })().catch(async (error: unknown) => {
        await appendAutomationLog(`Task failed for '${promptName}': ${(error as Error).message}`);
      });

      // Add the pending task to the set and ensure it's removed when done
      pendingTasks.add(pendingTask);
      void pendingTask.finally(() => {
        pendingTasks.delete(pendingTask);
      });

      // Waiting for available task slot if we have reached the max pending tasks limit before starting the next prompt
      if (pendingTasks.size >= MAX_PENDING_TASKS) {
        await waitForAvailableTaskSlot(pendingTasks);
      }

      if (i >= 0 && i < state.prompts.length && !state.stopRequested) {
        await waitForNextPromptCountdown(state.intervalMs, promptName);
      }

      i += 1;
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

async function waitWhilePaused(): Promise<boolean> {
  let loggedPause = false;

  while (state.pauseRequested) {
    if (state.stopRequested) {
      await appendAutomationLog('Stop requested.');
      return false;
    }

    if (!loggedPause) {
      await appendAutomationLog('Paused. Click Resume to continue.');
      loggedPause = true;
    }

    await sleepMilliseconds(200);
  }

  if (loggedPause) {
    await appendAutomationLog('Automation resumed.');
  }

  return !state.stopRequested;
}

async function waitForNextPromptCountdown(intervalMs: number, currentPrompt?: string): Promise<void> {
  const totalSeconds = Math.max(1, Math.ceil(intervalMs / 1000));

  for (let secondsLeft = totalSeconds; secondsLeft >= 1; secondsLeft -= 1) {
    const canContinue = await waitWhilePaused();
    if (!canContinue) {
      return;
    }

    if (state.stopRequested) {
      await appendAutomationLog('Stop requested.');
      return;
    }

    await setAutomationStatus(
      `Current prompt: ${currentPrompt || 'N/A'} | Start next prompt in ${secondsLeft} second${secondsLeft === 1 ? '' : 's'}...`
    );

    const sleepMs = secondsLeft === 1 ? intervalMs - (totalSeconds - 1) * 1000 : 1000;
    await sleepMilliseconds(Math.max(1, sleepMs));
  }
}
