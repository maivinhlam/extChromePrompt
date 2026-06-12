import { CreateModeVideo } from '../domain/create-mode';
import { state } from '../state/automation-state';
import { isVisible, sleepMilliseconds } from '../utils';
import { getDirectVideoDownloadUrl } from './media-actions';

type TileDoneResult =
  | { status: 'completed'; tile: HTMLElement }
  | { status: 'failed' }
  | { status: 'timeout' }
  | { status: 'stopped' };

function isTileGenerationComplete(root: HTMLElement): boolean {
  const text = (root.textContent || '').toLowerCase();
  const percentMatches = text.match(/\b(\d{1,3})\s*%\b/g) || [];
  const progressValues = percentMatches
    .map((entry) => Number(entry.replace(/[^0-9]/g, '')))
    .filter((value) => Number.isFinite(value));
  if (progressValues.length) {
    return progressValues.some((value) => value >= 99);
  }

  if (text === '') {
    return true;
  }

  if (state.mode === CreateModeVideo && text.includes('play_circle') && !hasProgressPercentage(text)) {
    return true;
  }
  const statusTerms = ['dang tao', 'dang xu ly', 'generating', 'processing'];

  if (statusTerms.some((term) => text.includes(term))) {
    return false;
  }

  return false;
}

function hasProgressPercentage(text: string): boolean {
  return /\d{1,3}\s*%/.test(text);
}

function getTileProgressValues(root: HTMLElement): number[] {
  const text = (root.textContent || '').toLowerCase();
  const percentMatches = text.match(/\b(\d{1,3})\s*%\b/g) || [];

  return percentMatches.map((entry) => Number(entry.replace(/[^0-9]/g, ''))).filter((value) => Number.isFinite(value));
}

function escapeSelectorValue(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }

  return value.replace(/['"\\]/g, '\\$&');
}

function getTileContainerById(tileId: string): HTMLElement | null {
  const escapedId = escapeSelectorValue(tileId);
  const nodes = Array.from(document.querySelectorAll(`[data-tile-id='${escapedId}']`)) as HTMLElement[];

  const visibleNode = nodes.find(isVisible) || nodes[0] || null;
  if (!visibleNode) {
    return null;
  }

  const container = visibleNode.closest('div[data-index][data-item-index], [data-tile-id]') as HTMLElement | null;
  return container || visibleNode;
}

export function getTopRowTileIds(): string[] {
  const tileIds: string[] = [];
  const seen = new Set<string>();

  const topRowItems = Array.from(document.querySelectorAll("div[data-index='0'][data-item-index]")) as HTMLElement[];

  for (const rowItem of topRowItems) {
    const tile = rowItem.querySelector('[data-tile-id]') as HTMLElement | null;
    const id = (tile?.getAttribute('data-tile-id') || '').trim();
    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);
    tileIds.push(id);
  }

  return tileIds;
}

export async function waitForNewTopRowTileId(
  existingIds: Set<string>,
  waitMs: number,
  shouldStop: () => boolean
): Promise<string | null> {
  const findNewTileId = (): string | null => {
    const latestIds = getTopRowTileIds();
    for (const id of latestIds) {
      if (!existingIds.has(id)) {
        return id;
      }
    }

    return null;
  };

  const immediate = findNewTileId();
  if (immediate) {
    return immediate;
  }

  return new Promise<string | null>((resolve) => {
    const started = Date.now();
    const observerRoot = document.body;

    if (!observerRoot) {
      resolve(null);
      return;
    }

    let done = false;
    let pollTimer = 0;

    const finalize = (result: string | null): void => {
      if (done) {
        return;
      }
      done = true;
      observer.disconnect();
      window.clearInterval(pollTimer);
      resolve(result);
    };

    const checkNow = (): void => {
      if (shouldStop()) {
        finalize(null);
        return;
      }

      if (Date.now() - started >= waitMs) {
        finalize(null);
        return;
      }

      const newId = findNewTileId();
      if (newId) {
        finalize(newId);
      }
    };

    const observer = new MutationObserver(() => {
      checkNow();
    });

    observer.observe(observerRoot, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-state', 'data-index'],
    });

    pollTimer = window.setInterval(checkNow, 500);
    checkNow();
  });
}

export async function waitForTileDoneById(
  tileId: string,
  waitMs: number,
  shouldStop: () => boolean
): Promise<TileDoneResult> {
  await sleepMilliseconds(2000);

  const started = Date.now();
  let waitingForProgressToMovePast99 = false;

  const getTileResult = (): Extract<TileDoneResult, { status: 'completed' | 'failed' }> | null => {
    const tile = getTileContainerById(tileId);
    if (!tile) {
      return null;
    }

    const progressValues = getTileProgressValues(tile);
    const hasExact99 = progressValues.some((value) => value === 99);

    if (hasExact99) {
      waitingForProgressToMovePast99 = true;
    } else if (waitingForProgressToMovePast99 && progressValues.length > 0) {
      waitingForProgressToMovePast99 = false;
    }

    if (waitingForProgressToMovePast99 && hasExact99) {
      return null;
    }

    if (isTileGenerationComplete(tile)) {
      const videoUrl = getDirectVideoDownloadUrl(tile);
      if (videoUrl) {
        return { status: 'completed', tile };
      } else {
        return null;
      }
    }

    const text = (tile.textContent || '').toLowerCase();
    if (text.includes('flow đang có lượng truy cập cao') || text.includes('we noticed some unusual activity')) {
      return { status: 'failed' };
    }

    if (
      (text.includes('không thành công') && !hasProgressPercentage(text)) ||
      text.includes('Không tạo được âm thanh')
    ) {
      return { status: 'failed' };
    }

    return null;
  };

  const immediate = getTileResult();
  if (immediate) {
    return immediate;
  }

  return new Promise<TileDoneResult>((resolve) => {
    const observerRoot = document.body;

    if (!observerRoot) {
      resolve({ status: 'timeout' });
      return;
    }

    let done = false;
    let pollTimer = 0;

    const finalize = (result: TileDoneResult): void => {
      if (done) {
        return;
      }
      done = true;
      observer.disconnect();
      window.clearInterval(pollTimer);
      resolve(result);
    };

    const checkNow = (): void => {
      if (done) {
        return;
      }

      if (shouldStop()) {
        finalize({ status: 'stopped' });
        return;
      }

      if (Date.now() - started >= waitMs) {
        finalize({ status: 'timeout' });
        return;
      }

      const tileResult = getTileResult();
      if (tileResult) {
        finalize(tileResult);
      }
    };

    const observer = new MutationObserver(() => {
      checkNow();
    });

    observer.observe(observerRoot, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-state', 'data-index'],
    });

    pollTimer = window.setInterval(checkNow, 1000);
    checkNow();
  });
}

export async function waitBlurForActiveTile(mediaContainer: HTMLElement, waitMs: number): Promise<boolean> {
  const started = Date.now();

  const isTileBlurred = (): boolean => {
    if (!mediaContainer.isConnected) {
      return false;
    }

    const opacityLayer = mediaContainer.querySelector("div[style*='--blur-amount']") as HTMLElement | null;
    if (!opacityLayer) {
      return false;
    }

    return opacityLayer.style.getPropertyValue('--blur-amount') === '0px';
  };

  if (!isTileBlurred()) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    const observerRoot = document.body;

    if (!observerRoot) {
      resolve(false);
      return;
    }

    let done = false;
    let pollTimer = 0;

    const finalize = (result: boolean): void => {
      if (done) {
        return;
      }
      done = true;
      observer.disconnect();
      window.clearInterval(pollTimer);
      resolve(result);
    };

    const checkNow = (): void => {
      if (done) {
        return;
      }

      if (!isTileBlurred()) {
        finalize(true);
        return;
      }

      if (Date.now() - started >= waitMs) {
        finalize(false);
      }
    };

    const observer = new MutationObserver(() => {
      checkNow();
    });

    observer.observe(observerRoot, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'data-state', 'data-index'],
    });

    pollTimer = window.setInterval(checkNow, 100);
    checkNow();
  });
}
