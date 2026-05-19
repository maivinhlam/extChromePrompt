import { state, TEST_MODE, MAX_PENDING_TASKS } from './constants';
import type { AutomationConfig, PromptStatus } from './types';
import {
  loadAutomationState,
  saveAutomationState,
  clearAutomationState,
  appendAutomationLog,
  setAutomationStatus,
  saveMatchedImageNames,
} from './storage';
import {
  fillPromptInput,
  selectModelAndModeTab,
  selectReferenceImage,
  getTopRowTileIds,
  waitForNewTopRowTileId,
  waitForTileDoneById,
  downloadMediaItem,
  renameMediaItem,
  waitBlurForActiveTile,
  getImageNameFromMediaContainer,
  randomInt,
} from './interactions';
import { parseSceneNumbers, formatSceneName, extractPromptPrefixName } from './formatting';
import { extractImageNamesFromPrompt, pauseBeforeStep, sleepMilliseconds } from './utils';
import { test } from './test';

function createInitialPromptStatuses(length: number): PromptStatus[] {
  return Array.from({ length }, () => 'pending');
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
  state.mode = config.mode === 'video' ? 'video' : 'image';
  state.intervalMs = Math.max(1000, Number(config.intervalMs || 15000));
  state.enableReferenceImages = config.enableReferenceImages !== false;
  state.enableAutoDownload = config.enableAutoDownload !== false;

  // Initialize matchedImageNames for this session
  if (state.mode === 'image') {
    state.matchedImageNames = {};
    await saveMatchedImageNames(state.matchedImageNames);
  }

  let promptStatuses = createInitialPromptStatuses(state.prompts.length);
  let startIndex = 0;
  let activePromptIndex = 0;
  const pendingTasks = new Set<Promise<void>>();

  const savedState = await loadAutomationState();
  if (
    savedState &&
    savedState.running &&
    savedState.mode === state.mode &&
    savedState.promptCount === state.prompts.length
  ) {
    startIndex = Math.max(0, Math.min(Number(savedState.currentIndex || 0), state.prompts.length - 1));
    if (Array.isArray(savedState.promptStatuses)) {
      promptStatuses = savedState.promptStatuses
        .slice(0, state.prompts.length)
        .concat(createInitialPromptStatuses(Math.max(0, state.prompts.length - savedState.promptStatuses.length)));
    }
  }

  try {
    const waitForAvailableTaskSlot = async (): Promise<void> => {
      if (pendingTasks.size < MAX_PENDING_TASKS) {
        return;
      }

      await appendAutomationLog(
        `Reached max pending tasks (${pendingTasks.size}/${MAX_PENDING_TASKS}). Waiting for one task to finish.`
      );
      await Promise.race(pendingTasks);
    };

    const waitForPendingTasks = async (): Promise<void> => {
      if (!pendingTasks.size) {
        return;
      }

      const tasksToWait = [...pendingTasks];
      await appendAutomationLog(`Waiting for ${tasksToWait.length} task(s) to finish.`);
      await Promise.allSettled(tasksToWait);
    };

    const queuePromptForRetry = async (promptToRetry: string, name: string): Promise<void> => {
      state.prompts.push(promptToRetry);
      promptStatuses.push('pending');

      await appendAutomationLog(
        `Generation failed for ${name}. Re-queued prompt at the end (${state.prompts.length}/${state.prompts.length}).`
      );

      await saveAutomationState({
        running: true,
        mode: state.mode,
        promptCount: state.prompts.length,
        currentIndex: Math.min(activePromptIndex, state.prompts.length - 1),
        promptStatuses,
      });
    };

    await appendAutomationLog(`Automation started. Mode: ${state.mode}. Total prompts: ${state.prompts.length}.`);

    if (startIndex > 0) {
      await appendAutomationLog(`Resuming from prompt ${startIndex + 1}.`);
    }

    await saveAutomationState({
      running: true,
      mode: state.mode,
      promptCount: state.prompts.length,
      currentIndex: startIndex,
      promptStatuses,
    });

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

      activePromptIndex = i;
      const promptIndex = activePromptIndex;
      const prompt = state.prompts[promptIndex];
      const sceneNumbers = parseSceneNumbers(prompt, promptIndex + 1);
      const promptName = extractPromptPrefixName(prompt, formatSceneName(sceneNumbers.scene, ''));
      promptStatuses[i] = 'in_progress';

      await saveAutomationState({
        running: true,
        mode: state.mode,
        promptCount: state.prompts.length,
        currentIndex: promptIndex,
        promptStatuses,
      });

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
      if (state.enableReferenceImages) {
        const imageNames = extractImageNamesFromPrompt(prompt);
        if (imageNames.length > 0) {
          await selectReferenceImage(imageNames);
          await sleepMilliseconds(randomInt(1000, 2000));
        }
      }
      const knownTopRowTileIds = new Set(getTopRowTileIds());

      // ===================== Step 2: fill prompt input
      await fillPromptInput(prompt);

      // ===================== Step 3: wait for new tile
      const pendingTask = (async (): Promise<void> => {
        if (!(await waitWhilePaused())) {
          return;
        }

        let waitingTime = 60000;
        if (state.mode === 'video') {
          waitingTime = await randomInt(150000, 180000);
        }

        // Wait for a new item to appear in the top row, which indicates that the generation has started
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
          await queuePromptForRetry(prompt, promptName);
          return;
        }

        if (tileResult.status !== 'completed') {
          await appendAutomationLog(`Task skipped for '${promptName}': tile did not reach 100% in time.`);
          return;
        }

        const completedTile = tileResult.tile;
        await waitBlurForActiveTile(completedTile, 20000);
        await sleepMilliseconds(1000);

        if (state.enableAutoDownload && state.mode === 'video') {
          await appendAutomationLog(`Downloading '${promptName}'...`);

          const downloaded = await downloadMediaItem(completedTile, promptName);
          if (downloaded) {
            await appendAutomationLog(`Downloaded '${promptName}' successfully.`);
            promptStatuses[promptIndex] = 'done';
          } else {
            await appendAutomationLog(`Download skipped for '${promptName}': API request or menu flow failed.`);
            promptStatuses[promptIndex] = 'failed';
          }
        } else if (state.mode === 'video') {
          await appendAutomationLog(`Auto-download disabled for '${promptName}'.`);
          promptStatuses[promptIndex] = 'done';
        }

        if (state.mode === 'image') {
          const matchImageName = await getImageNameFromMediaContainer(completedTile, promptName);

          if (matchImageName) {
            await appendAutomationLog(`Get the name of '${promptName}' successfully.`);
            promptStatuses[promptIndex] = 'done';
          } else {
            await appendAutomationLog(`Get the name of '${promptName}' failed: API request or menu flow failed.`);
            promptStatuses[promptIndex] = 'failed';

            // put the prompt back to the end of the queue for retry, since we might have hit the rate limit or a fluke failure in the interactions
            await queuePromptForRetry(prompt, promptName);
            return;
          }
        }
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
        await waitForAvailableTaskSlot();
      }

      if (i > 0 && i < state.prompts.length && !state.stopRequested) {
        await waitForNextPromptCountdown(state.intervalMs, promptName);
      }

      i += 1;
    }

    await waitForPendingTasks();

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
