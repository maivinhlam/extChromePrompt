import { state, TEST_MODE, MAX_PENDING_TASKS } from "./constants";
import type { AutomationConfig, PromptStatus } from "./types";
import {
  loadAutomationState,
  saveAutomationState,
  clearAutomationState,
  appendAutomationLog,
  setAutomationStatus,
} from "./storage";
import {
  fillPromptInput,
  selectModelAndModeTab,
  selectReferenceImage,
  getTopRowTileIds,
  waitForNewTopRowTileId,
  waitForTileDoneById,
  downloadMediaItem,
  waitBlurForActiveTile,
} from "./interactions";
import {
  parseSceneNumbers,
  formatSceneName,
  extractPromptPrefixName,
} from "./formatting";
import { pauseBeforeStep, sleep } from "./utils";
import { test } from "./test";

function createInitialPromptStatuses(length: number): PromptStatus[] {
  return Array.from({ length }, () => "pending");
}

async function waitWhilePaused(): Promise<boolean> {
  let loggedPause = false;

  while (state.pauseRequested) {
    if (state.stopRequested) {
      await setAutomationStatus("Stop requested.");
      return false;
    }

    if (!loggedPause) {
      await appendAutomationLog("Automation paused.");
      await setAutomationStatus("Paused. Click Resume to continue.");
      loggedPause = true;
    }

    await sleep(200);
  }

  if (loggedPause) {
    await appendAutomationLog("Automation resumed.");
    await setAutomationStatus("Automation resumed.");
  }

  return !state.stopRequested;
}

async function waitForNextPromptCountdown(
  intervalMs: number,
  currentPrompt?: string,
): Promise<void> {
  const totalSeconds = Math.max(1, Math.ceil(intervalMs / 1000));

  for (let secondsLeft = totalSeconds; secondsLeft >= 1; secondsLeft -= 1) {
    const canContinue = await waitWhilePaused();
    if (!canContinue) {
      return;
    }

    if (state.stopRequested) {
      await setAutomationStatus("Stop requested.");
      return;
    }

    await setAutomationStatus(
      `Current prompt: ${currentPrompt || "N/A"} | Start next prompt in ${secondsLeft} second${secondsLeft === 1 ? "" : "s"}...`,
    );

    const sleepMs =
      secondsLeft === 1 ? intervalMs - (totalSeconds - 1) * 1000 : 1000;
    await sleep(Math.max(1, sleepMs));
  }
}

export async function startAutomation(config: AutomationConfig): Promise<void> {
  if (state.running) {
    throw new Error("Automation is already running.");
  }

  if (!Array.isArray(config?.prompts) || !config.prompts.length) {
    throw new Error("No prompts provided.");
  }

  state.running = true;
  state.stopRequested = false;
  state.pauseRequested = false;
  state.prompts = config.prompts;
  state.mode = config.mode === "video" ? "video" : "image";
  state.intervalMs = Math.max(1000, Number(config.intervalMs || 15000));
  state.enableReferenceImages = config.enableReferenceImages !== false;
  state.enableAutoDownload = config.enableAutoDownload !== false;

  let promptStatuses = createInitialPromptStatuses(state.prompts.length);
  let startIndex = 0;
  let activePromptIndex = 0;
  const pendingTasks: Promise<void>[] = [];

  const savedState = await loadAutomationState();
  if (
    savedState &&
    savedState.running &&
    savedState.mode === state.mode &&
    savedState.promptCount === state.prompts.length
  ) {
    startIndex = Math.max(
      0,
      Math.min(Number(savedState.currentIndex || 0), state.prompts.length - 1),
    );
    if (Array.isArray(savedState.promptStatuses)) {
      promptStatuses = savedState.promptStatuses
        .slice(0, state.prompts.length)
        .concat(
          createInitialPromptStatuses(
            Math.max(
              0,
              state.prompts.length - savedState.promptStatuses.length,
            ),
          ),
        );
    }
  }

  try {
    const waitForPendingTasks = async (): Promise<void> => {
      if (!pendingTasks.length) {
        return;
      }

      const tasksToWait = pendingTasks.splice(0, pendingTasks.length);
      await appendAutomationLog(
        `Waiting for ${tasksToWait.length} task(s) to finish.`,
      );
      await setAutomationStatus(
        `Waiting for ${tasksToWait.length} task(s) to finish.`,
      );
      await Promise.allSettled(tasksToWait);
    };

    const queuePromptForRetry = async (
      promptToRetry: string,
    ): Promise<void> => {
      state.prompts.push(promptToRetry);
      promptStatuses.push("pending");

      await appendAutomationLog(
        `Generation failed. Re-queued prompt at the end (${state.prompts.length}/${state.prompts.length}).`,
      );
      await setAutomationStatus(
        `Generation failed. Re-queued prompt at the end (${state.prompts.length}/${state.prompts.length}).`,
      );

      await saveAutomationState({
        running: true,
        mode: state.mode,
        promptCount: state.prompts.length,
        currentIndex: Math.min(activePromptIndex, state.prompts.length - 1),
        promptStatuses,
      });
    };

    await appendAutomationLog(
      `Automation started. Mode: ${state.mode}. Total prompts: ${state.prompts.length}.`,
    );
    await setAutomationStatus(
      `Started. Total prompts: ${state.prompts.length}`,
    );

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

    await pauseBeforeStep(
      `Set mode and model to ${state.mode}.`,
      () => state.stopRequested,
      appendAutomationLog,
    );

    if (!TEST_MODE) {
      // await selectModelAndModeTab(state.mode);
    }

    if (TEST_MODE) {
      test(pendingTasks).catch(async (error: unknown) => {
        await appendAutomationLog(
          `Test function error: ${(error as Error).message}`,
        );
      });
      return;
    }

    for (let i = startIndex; i < state.prompts.length; ) {
      const canContinue = await waitWhilePaused();
      if (!canContinue) {
        break;
      }

      activePromptIndex = i;
      const prompt = state.prompts[i];
      const numbers = parseSceneNumbers(prompt, i + 1);

      promptStatuses[i] = "in_progress";
      await saveAutomationState({
        running: true,
        mode: state.mode,
        promptCount: state.prompts.length,
        currentIndex: i,
        promptStatuses,
      });

      if (state.stopRequested) {
        await appendAutomationLog(
          "Stop requested. Exiting before next prompt.",
        );
        await setAutomationStatus("Stop requested.");
        break;
      }

      await appendAutomationLog(
        `Prompt ${i + 1}/${state.prompts.length}: SCENE ${numbers.scene}.`,
      );

      const knownTopRowTileIds = new Set(getTopRowTileIds());

      if (!(await waitWhilePaused())) {
        break;
      }

      await pauseBeforeStep(
        "Fill prompt input.",
        () => state.stopRequested,
        appendAutomationLog,
      );

      // 2. Tell the background script to start typing
      if (!(await waitWhilePaused())) {
        break;
      }

      await fillPromptInput(prompt);

      const imageNames = extractImageNamesFromPrompt(prompt);
      if (state.enableReferenceImages && imageNames.length > 0) {
        await selectReferenceImage(imageNames);
      } else if (!state.enableReferenceImages && imageNames.length > 0) {
        await appendAutomationLog(
          `Reference image selection disabled for SCENE ${numbers.scene}.`,
        );
      }

      promptStatuses[i] = "done";
      await saveAutomationState({
        running: true,
        mode: state.mode,
        promptCount: state.prompts.length,
        currentIndex: Math.min(i + 1, state.prompts.length - 1),
        promptStatuses,
      });

      const sceneName = extractPromptPrefixName(
        prompt,
        formatSceneName(numbers.scene, ""),
      );

      let waitingTime = 60000;
      if (state.mode === "video") {
        waitingTime = 180000;
      }

      const pendingTask = (async (): Promise<void> => {
        if (!(await waitWhilePaused())) {
          return;
        }

        const newTileId = await waitForNewTopRowTileId(
          knownTopRowTileIds,
          waitingTime,
          () => state.stopRequested,
        );

        if (!newTileId) {
          await appendAutomationLog(
            `Task skipped for '${sceneName}': no new tile detected in time.`,
          );
          return;
        }

        await appendAutomationLog(
          `Detected new tile for '${sceneName}' (${newTileId}). Waiting for 100%.`,
        );

        const tileResult = await waitForTileDoneById(
          newTileId,
          waitingTime,
          () => state.stopRequested,
        );

        if (tileResult.status === "failed") {
          await queuePromptForRetry(prompt);
          return;
        }

        if (tileResult.status !== "completed") {
          await appendAutomationLog(
            `Task skipped for '${sceneName}': tile did not reach 100% in time.`,
          );
          return;
        }

        const completedTile = tileResult.tile;

        if (!(await waitBlurForActiveTile(completedTile, 20000))) {
          return;
        }

        if (!(await waitWhilePaused())) {
          return;
        }

        if (state.mode === "video" && state.enableAutoDownload) {
          await appendAutomationLog(`Downloading '${sceneName}'...`);
          const downloaded = await downloadMediaItem(completedTile, sceneName);
          if (downloaded) {
            await appendAutomationLog(
              `Downloaded '${sceneName}' successfully.`,
            );
          } else {
            await appendAutomationLog(
              `Download skipped for '${sceneName}': API request or menu flow failed.`,
            );
          }
        } else if (state.mode === "video") {
          await appendAutomationLog(
            `Auto-download disabled for '${sceneName}'.`,
          );
        }
      })().catch(async (error: unknown) => {
        await appendAutomationLog(
          `Task failed for '${sceneName}': ${(error as Error).message}`,
        );
      });

      pendingTasks.push(pendingTask);
      i += 1;

      if (pendingTasks.length >= MAX_PENDING_TASKS) {
        await waitForPendingTasks();
      }

      if (i > 0 && i < state.prompts.length && !state.stopRequested) {
        await waitForNextPromptCountdown(state.intervalMs, sceneName);
      }
    }

    await waitForPendingTasks();

    await clearAutomationState();
    await appendAutomationLog("Automation completed.");
    await setAutomationStatus("Automation completed.");
    window.alert("Automation completed.");
  } catch (error) {
    await appendAutomationLog(`Automation error: ${(error as Error).message}`);
    await setAutomationStatus((error as Error).message || "Automation error.");
    throw error;
  } finally {
    state.pauseRequested = false;
    state.running = false;
  }
}

function extractImageNamesFromPrompt(prompt: string): string[] {
  const imageNamesMatch = prompt.match(/IMAGES:\s*(.+?)(?:\s*\||\s*$)/i);

  // Lấy chuỗi tên ảnh (hoặc null nếu không khớp)
  const imageNames = imageNamesMatch ? imageNamesMatch[1].trim() : null;
  const imageArray = imageNames
    ? imageNames
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return imageArray;
}
