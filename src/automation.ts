import { state, TEST_MODE, MAX_PENDING_TASKS } from "./constants";
import type { AutomationConfig, PromptStatus } from "./types";
import {
  loadAutomationState,
  saveAutomationState,
  clearAutomationState,
  appendAutomationLog,
  setAutomationStatus,
  saveMatchedImageNames,
} from "./storage";
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
} from "./interactions";
import {
  parseSceneNumbers,
  formatSceneName,
  extractPromptPrefixName,
} from "./formatting";
import { pauseBeforeStep, sleepMilliseconds } from "./utils";
import { test } from "./test";

function createInitialPromptStatuses(length: number): PromptStatus[] {
  return Array.from({ length }, () => "pending");
}

async function waitWhilePaused(): Promise<boolean> {
  let loggedPause = false;

  while (state.pauseRequested) {
    if (state.stopRequested) {
      await appendAutomationLog("Stop requested.");
      return false;
    }

    if (!loggedPause) {
      await appendAutomationLog("Paused. Click Resume to continue.");
      loggedPause = true;
    }

    await sleepMilliseconds(200);
  }

  if (loggedPause) {
    await appendAutomationLog("Automation resumed.");
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
      await appendAutomationLog("Stop requested.");
      return;
    }

    await setAutomationStatus(
      `Current prompt: ${currentPrompt || "N/A"} | Start next prompt in ${secondsLeft} second${secondsLeft === 1 ? "" : "s"}...`,
    );

    const sleepMs =
      secondsLeft === 1 ? intervalMs - (totalSeconds - 1) * 1000 : 1000;
    await sleepMilliseconds(Math.max(1, sleepMs));
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

  // Initialize matchedImageNames for this session
  if (state.mode === "image") {
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
    const waitForAvailableTaskSlot = async (): Promise<void> => {
      if (pendingTasks.size < MAX_PENDING_TASKS) {
        return;
      }

      await appendAutomationLog(
        `Reached max pending tasks (${pendingTasks.size}/${MAX_PENDING_TASKS}). Waiting for one task to finish.`,
      );
      await Promise.race(pendingTasks);
    };

    const waitForPendingTasks = async (): Promise<void> => {
      if (!pendingTasks.size) {
        return;
      }

      const tasksToWait = [...pendingTasks];
      await appendAutomationLog(
        `Waiting for ${tasksToWait.length} task(s) to finish.`,
      );
      await Promise.allSettled(tasksToWait);
    };

    const queuePromptForRetry = async (
      promptToRetry: string,
      name: string,
    ): Promise<void> => {
      state.prompts.push(promptToRetry);
      promptStatuses.push("pending");
      endIndex++;

      await appendAutomationLog(
        `Generation failed for ${name}. Re-queued prompt at the end (${state.prompts.length}/${state.prompts.length}).`,
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

    let i = startIndex;
    let endIndex = state.prompts.length;
    while (i < endIndex) {
      const canContinue = await waitWhilePaused();
      if (!canContinue) {
        break;
      }

      activePromptIndex = i;
      const promptIndex = activePromptIndex;
      const prompt = state.prompts[promptIndex];
      const sceneNumbers = parseSceneNumbers(prompt, promptIndex + 1);
      const promptName = extractPromptPrefixName(
        prompt,
        formatSceneName(sceneNumbers.scene, ""),
      );
      promptStatuses[i] = "in_progress";

      await saveAutomationState({
        running: true,
        mode: state.mode,
        promptCount: state.prompts.length,
        currentIndex: promptIndex,
        promptStatuses,
      });

      if (state.stopRequested) {
        await appendAutomationLog(
          "Stop requested. Exiting before next prompt.",
        );
        break;
      }

      await appendAutomationLog(
        `Prompt ${promptIndex + 1}/${state.prompts.length}: SCENE ${sceneNumbers.scene}.`,
      );

      const knownTopRowTileIds = new Set(getTopRowTileIds());

      // 2. Tell the background script to start typing
      if (!(await waitWhilePaused())) {
        break;
      }

      const imageNames = extractImageNamesFromPrompt(prompt);
      if (state.enableReferenceImages && imageNames.length > 0) {
        await selectReferenceImage(imageNames);
        await sleepMilliseconds(randomInt(2000, 3000));
      } else if (!state.enableReferenceImages && imageNames.length > 0) {
        await appendAutomationLog(
          `Reference image selection disabled for SCENE ${sceneNumbers.scene}.`,
        );
      }

      await fillPromptInput(prompt);

      await saveAutomationState({
        running: true,
        mode: state.mode,
        promptCount: state.prompts.length,
        currentIndex: Math.min(promptIndex + 1, state.prompts.length - 1),
        promptStatuses,
      });

      let waitingTime = 60000;
      if (state.mode === "video") {
        waitingTime = await randomInt(150000, 180000);
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
            `Task skipped for '${promptName}': no new tile detected in time.`,
          );
          return;
        }

        const tileResult = await waitForTileDoneById(
          newTileId,
          waitingTime,
          () => state.stopRequested,
        );

        if (tileResult.status === "failed") {
          await queuePromptForRetry(prompt, promptName);
          endIndex++;
          return;
        }

        if (tileResult.status !== "completed") {
          await appendAutomationLog(
            `Task skipped for '${promptName}': tile did not reach 100% in time.`,
          );
          return;
        }

        const completedTile = tileResult.tile;

        if (!(await waitBlurForActiveTile(completedTile, 20000))) {
          return;
        }

        if (state.mode === "image") {
          await sleepMilliseconds(6000);
        } else if (state.mode === "video") {
          await sleepMilliseconds(10000);
        }

        if (state.mode === "video" && state.enableAutoDownload) {
          await appendAutomationLog(`Downloading '${promptName}'...`);
          const downloaded = await downloadMediaItem(completedTile, promptName);
          if (downloaded) {
            await appendAutomationLog(
              `Downloaded '${promptName}' successfully.`,
            );
            promptStatuses[promptIndex] = "done";
          } else {
            await appendAutomationLog(
              `Download skipped for '${promptName}': API request or menu flow failed.`,
            );
            promptStatuses[promptIndex] = "failed";
          }
        } else if (state.mode === "video") {
          await appendAutomationLog(
            `Auto-download disabled for '${promptName}'.`,
          );
          promptStatuses[promptIndex] = "done";
        }

        if (state.mode === "image") {
          const matchImageName = await getImageNameFromMediaContainer(
            completedTile,
            promptName,
          );

          if (matchImageName) {
            await appendAutomationLog(
              `Get the name of '${promptName}' successfully.`,
            );
            promptStatuses[promptIndex] = "done";
          } else {
            await appendAutomationLog(
              `Get the name of '${promptName}' failed: API request or menu flow failed.`,
            );
            promptStatuses[promptIndex] = "failed";
            await queuePromptForRetry(prompt, promptName);
            endIndex++;
            return;
          }
        }
      })().catch(async (error: unknown) => {
        await appendAutomationLog(
          `Task failed for '${promptName}': ${(error as Error).message}`,
        );
      });

      pendingTasks.add(pendingTask);
      void pendingTask.finally(() => {
        pendingTasks.delete(pendingTask);
      });

      if (pendingTasks.size >= MAX_PENDING_TASKS) {
        await waitForAvailableTaskSlot();
      }

      if (i > 0 && i < state.prompts.length && !state.stopRequested) {
        await waitForNextPromptCountdown(state.intervalMs, promptName);
      }

      await sleepMilliseconds(1000);
      i += 1;
    }

    await waitForPendingTasks();

    await sleepMilliseconds(11000);
    await clearAutomationState();
    await appendAutomationLog("Automation completed.");
    window.alert("Automation completed.");
  } catch (error) {
    await appendAutomationLog(`Automation error: ${(error as Error).message}`);
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
