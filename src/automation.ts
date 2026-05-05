import { state } from "./constants";
import type { AutomationStatePayload, PromptMode, PromptStatus } from "./types";
import {
  loadAutomationState,
  saveAutomationState,
  clearAutomationState,
  appendAutomationLog,
} from "./storage";
import {
  fillPromptInput,
  clickCreateButton,
  selectModelAndModeTab,
  selectReferenceImage,
  getTopRowTileIds,
  waitForNewTopRowTileId,
  waitForTileDoneById,
  renameMediaItem,
  downloadMediaItem,
} from "./interactions";
import {
  parseSceneNumbers,
  formatSceneName,
  extractPromptPrefixName,
} from "./formatting";
import { pauseBeforeStep } from "./utils";

function createInitialPromptStatuses(length: number): PromptStatus[] {
  return Array.from({ length }, () => "pending");
}

export async function startAutomation(config: {
  prompts?: string[];
  mode?: PromptMode;
  intervalMs?: number;
}): Promise<void> {
  if (state.running) {
    throw new Error("Automation is already running.");
  }

  if (!Array.isArray(config?.prompts) || !config.prompts.length) {
    throw new Error("No prompts provided.");
  }

  state.running = true;
  state.stopRequested = false;
  state.prompts = config.prompts;
  state.mode = config.mode === "video" ? "video" : "image";
  state.intervalMs = Math.max(1000, Number(config.intervalMs || 15000));

  let promptStatuses = createInitialPromptStatuses(state.prompts.length);
  let startIndex = 0;
  const pendingRenameTasks: Promise<void>[] = [];

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

    // TODO
    //  await selectModelAndModeTab(state.mode);

    for (let i = startIndex; i < state.prompts.length; i += 1) {
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
        break;
      }

      await appendAutomationLog(
        `Prompt ${i + 1}/${state.prompts.length}: SCENE ${numbers.scene}.`,
      );

      const knownTopRowTileIds = new Set(getTopRowTileIds());

      await pauseBeforeStep(
        "Fill prompt input.",
        () => state.stopRequested,
        appendAutomationLog,
      );
      await fillPromptInput(prompt);

      if (state.mode === "video") {
        const expectedImageName = formatSceneName(numbers.scene, "");

        await pauseBeforeStep(
          `Select reference image for the ${expectedImageName}.`,
          () => state.stopRequested,
          appendAutomationLog,
        );
        await selectReferenceImage(expectedImageName);
      }

      promptStatuses[i] = "done";
      await saveAutomationState({
        running: true,
        mode: state.mode,
        promptCount: state.prompts.length,
        currentIndex: Math.min(i + 1, state.prompts.length - 1),
        promptStatuses,
      });

      // eslint-disable-next-line no-unreachable
      await pauseBeforeStep(
        "Click Create.",
        () => state.stopRequested,
        appendAutomationLog,
      );
      await clickCreateButton();
      await appendAutomationLog(
        "Prompt sent. Moving to next prompt immediately.",
      );

      const renameTo = extractPromptPrefixName(
        prompt,
        formatSceneName(numbers.scene, ""),
      );

      const renameTask = (async (): Promise<void> => {
        const newTileId = await waitForNewTopRowTileId(
          knownTopRowTileIds,
          Math.max(15000, state.intervalMs * 2),
          () => state.stopRequested,
        );

        if (!newTileId) {
          await appendAutomationLog(
            `Rename skipped for '${renameTo}': no new tile detected in time.`,
          );
          return;
        }

        await appendAutomationLog(
          `Detected new tile for '${renameTo}' (${newTileId}). Waiting for 100%.`,
        );

        const completedTile = await waitForTileDoneById(
          newTileId,
          Math.max(30000, state.intervalMs * 6),
          () => state.stopRequested,
        );

        if (!completedTile) {
          await appendAutomationLog(
            `Rename skipped for '${renameTo}': tile did not reach 100% in time.`,
          );
          return;
        }

        const renamed = await renameMediaItem(completedTile, renameTo);
        if (renamed && state.mode === "video") {
          await appendAutomationLog(`Renamed '${renameTo}' successfully.`);

          await appendAutomationLog(`Downloading '${renameTo}'...`);
          const downloaded = await downloadMediaItem(completedTile);
          if (downloaded) {
            await appendAutomationLog(`Downloaded '${renameTo}' successfully.`);
          } else {
            await appendAutomationLog(
              `Download skipped for '${renameTo}': could not open download menu.`,
            );
          }
        } else {
          await appendAutomationLog(
            `Rename skipped for '${renameTo}': could not open Rename dialog.`,
          );
        }
      })().catch(async (error: unknown) => {
        await appendAutomationLog(
          `Rename task failed for '${renameTo}': ${(error as Error).message}`,
        );
      });

      pendingRenameTasks.push(renameTask);
    }

    if (pendingRenameTasks.length) {
      await appendAutomationLog(
        `Waiting for ${pendingRenameTasks.length} rename task(s) to finish.`,
      );
      await Promise.allSettled(pendingRenameTasks);
    }

    await clearAutomationState();
    await appendAutomationLog("Automation completed.");
  } catch (error) {
    await appendAutomationLog(`Automation error: ${(error as Error).message}`);
    throw error;
  } finally {
    state.running = false;
  }
}
