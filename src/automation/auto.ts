import { MAX_PENDING_TASKS, STEP_DELAY_MS } from '../config/automation-settings';
import { CreateModeVideo } from '../domain/create-mode';
import type { AutomationState } from '../domain/automation-types';
import { randomInt } from '../interactions';
import { appendAutomationLog, setAutomationStatus, sleepMilliseconds, sleepWithStop } from '../utils';

export async function waitForAvailableTaskSlot(pendingTasks: Set<Promise<void>>): Promise<void> {
  if (pendingTasks.size < MAX_PENDING_TASKS) {
    return;
  }

  await appendAutomationLog(
    `Reached max pending tasks (${pendingTasks.size}/${MAX_PENDING_TASKS}). Waiting for one task to finish.`
  );
  await Promise.race(pendingTasks);
}

export async function waitForPendingTasks(pendingTasks: Set<Promise<void>>): Promise<void> {
  if (!pendingTasks.size) {
    return;
  }

  const tasksToWait = [...pendingTasks];
  await appendAutomationLog(`Waiting for ${tasksToWait.length} task(s) to finish.`);
  await Promise.allSettled(tasksToWait);
}

export async function waitWhilePaused(state: AutomationState): Promise<boolean> {
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

export async function waitForNextPromptCountdown(state: AutomationState, currentPrompt?: string): Promise<void> {
  const totalSeconds = Math.max(1, Math.ceil(state.intervalMs / 1000));

  for (let secondsLeft = totalSeconds; secondsLeft >= 1; secondsLeft -= 1) {
    const canContinue = await waitWhilePaused(state);
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

    const sleepMs = secondsLeft === 1 ? state.intervalMs - (totalSeconds - 1) * 1000 : 1000;
    await sleepMilliseconds(Math.max(1, sleepMs));
  }
}

export function getPromptWaitTime(state: AutomationState): number {
  if (state.mode === CreateModeVideo) {
    return randomInt(150000, 180000);
  }

  return 60000;
}

export async function pauseBeforeStep(
  stepText: string,
  shouldStop: () => boolean,
  logFn: (msg: string) => Promise<void>
): Promise<void> {
  await logFn(`${stepText} Running in ${STEP_DELAY_MS / 1000} seconds...`);
  await sleepWithStop(STEP_DELAY_MS, shouldStop);
}
