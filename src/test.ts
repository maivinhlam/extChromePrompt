import { state } from "./constants";
import { extractPromptPrefixName, formatSceneName } from "./formatting";
import {
  downloadMediaItem,
  getTopRowTileIds,
  renameMediaItem,
  waitForNewTopRowTileId,
  waitForTileDoneById,
} from "./interactions";
import { appendAutomationLog } from "./storage";
import { sleep } from "./utils";

export async function test(pendingRenameTasks: Promise<void>[]) {
  const knownTopRowTileIds = new Set(getTopRowTileIds());
  let renameTo = extractPromptPrefixName(
    "Scene 1 - Image 1",
    formatSceneName(1, ""),
  );
  if (state.mode === "video") {
    renameTo = extractPromptPrefixName("Scene 1", formatSceneName(1, ""));
  }
  let waitingTime = 600;
  if (state.mode === "video") {
    waitingTime = Math.max(120000, state.intervalMs * 4);
  }
  const renameTask = (async (): Promise<void> => {
    const newTileId = await waitForNewTopRowTileId(
      knownTopRowTileIds,
      Math.max(waitingTime, state.intervalMs * 2),
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

    const tileResult = await waitForTileDoneById(
      newTileId,
      Math.max(waitingTime, state.intervalMs * 6),
      () => state.stopRequested,
    );

    if (tileResult.status !== "completed") {
      await appendAutomationLog(
        `Rename skipped for '${renameTo}': tile did not reach 100% in time.`,
      );
      return;
    }

    const completedTile = tileResult.tile;

    // waiting an additional short time to ensure the tile is fully ready for interactions
    await sleep(1000);

    await appendAutomationLog(`Renamed '${renameTo}' successfully.`);

    if (state.mode === "video") {
      await appendAutomationLog(`Downloading '${renameTo}'...`);
      const downloaded = await downloadMediaItem(completedTile, "Scene 1");
      if (downloaded) {
        await appendAutomationLog(`Downloaded '${renameTo}' successfully.`);
      } else {
        await appendAutomationLog(
          `Download skipped for '${renameTo}': API request or menu flow failed.`,
        );
      }
    }
  })().catch(async (error: unknown) => {
    await appendAutomationLog(
      `Rename task failed for '${renameTo}': ${(error as Error).message}`,
    );
  });

  pendingRenameTasks.push(renameTask);

  if (pendingRenameTasks.length) {
    await appendAutomationLog(
      `Waiting for ${pendingRenameTasks.length} rename task(s) to finish.`,
    );
    await Promise.allSettled(pendingRenameTasks);
  }
}
