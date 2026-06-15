import { state } from '../state/automation-state';
import { appendAutomationLog, saveMatchedImageNames, isVisible, sleepMilliseconds } from '../utils';
import { getElementClickPoint, randomInt, withPageInteractionLock } from './shared';

function dispatchHoverEvents(element: HTMLElement): void {
  const { x, y } = getElementClickPoint(element);
  const hoverEvents: Array<'pointerover' | 'pointerenter' | 'mouseover' | 'mouseenter' | 'pointermove' | 'mousemove'> =
    ['pointerover', 'pointerenter', 'mouseover', 'mouseenter', 'pointermove', 'mousemove'];

  for (const eventName of hoverEvents) {
    element.dispatchEvent(
      new MouseEvent(eventName, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        view: window,
      })
    );
  }
}

function getHoverCandidates(mediaContainer: HTMLElement): HTMLElement[] {
  const candidates = [
    mediaContainer,
    mediaContainer.querySelector('video'),
    mediaContainer.querySelector('img'),
    mediaContainer.parentElement,
    mediaContainer.previousElementSibling,
    mediaContainer.nextElementSibling,
  ].filter((element): element is HTMLElement => !!element && element instanceof HTMLElement && isVisible(element));

  return Array.from(new Set(candidates));
}

async function simulateHumanPresenceBeforeDownload(mediaContainer: HTMLElement): Promise<void> {
  mediaContainer.scrollIntoView({ block: 'center', inline: 'nearest' });
  await sleepMilliseconds(randomInt(180, 420));

  const scrollSteps = randomInt(1, 3);
  for (let index = 0; index < scrollSteps; index += 1) {
    const direction = Math.random() > 0.5 ? 1 : -1;
    window.scrollBy({
      top: direction * randomInt(40, 180),
      behavior: 'smooth',
    });
    await sleepMilliseconds(randomInt(220, 520));
  }

  mediaContainer.scrollIntoView({ block: 'center', inline: 'nearest' });
  await sleepMilliseconds(randomInt(160, 320));

  const hoverCandidates = getHoverCandidates(mediaContainer);
  const hoverCount = Math.min(hoverCandidates.length, randomInt(2, 4));

  for (let index = 0; index < hoverCount; index += 1) {
    const candidate = hoverCandidates[index];
    candidate.focus?.();
    dispatchHoverEvents(candidate);
    await sleepMilliseconds(randomInt(450, 1100));
  }

  await sleepMilliseconds(randomInt(450, 1100));
}

function resolveLabsMediaUrl(url: string): string | null {
  const trimmed = String(url || '').trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed, 'https://labs.google').toString();
  } catch {
    return null;
  }
}

type FlowWorkflowIdentity = {
  workflowId: string;
  projectId: string;
};

function extractFlowWorkflowIdentity(mediaContainer: HTMLElement): FlowWorkflowIdentity | null {
  const workflowLink = mediaContainer.querySelector(
    "a[href*='/fx/'][href*='/tools/flow/project/'][href*='/edit/']"
  ) as HTMLAnchorElement | null;

  const href = workflowLink?.getAttribute('href') || workflowLink?.href || '';
  if (!href) {
    return null;
  }

  try {
    const parsedUrl = new URL(href, window.location.origin);
    const match = parsedUrl.pathname.match(/\/project\/([^/]+)\/edit\/([^/]+)/i);

    if (!match) {
      return null;
    }

    const [, projectId, workflowId] = match;
    if (!projectId || !workflowId) {
      return null;
    }

    return { projectId, workflowId };
  } catch {
    return null;
  }
}

async function patchFlowWorkflowDisplayName(identity: FlowWorkflowIdentity, displayName: string): Promise<boolean> {
  const response = await chrome.runtime
    .sendMessage({
      type: 'PATCH_FLOW_WORKFLOW_DISPLAY_NAME',
      workflowId: identity.workflowId,
      projectId: identity.projectId,
      displayName,
    })
    .catch(() => null);

  return !!response?.ok;
}

export function getDirectVideoDownloadUrl(mediaContainer: HTMLElement): string | null {
  const video = mediaContainer.querySelector('video') as HTMLVideoElement | null;
  if (!video) {
    return null;
  }

  return resolveLabsMediaUrl(video.currentSrc || video.getAttribute('src') || '');
}

/* eslint-disable no-control-regex */
function sanitizeDownloadBaseName(name: string): string {
  return String(name || '')
    .trim()
    .replace(/\.mp4$/i, '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function sanitizeFolderName(name: string): string {
  const regex = /Scene[_\s]+([^-]+)-/i;
  const match = name.match(regex);

  // Nếu khớp định dạng thì trả về nhóm số 1 (tên folder)
  return match ? match[1] : 'veo3_video';
}

function buildVideoDownloadFilename(renameTo: string): string {
  const baseName = sanitizeDownloadBaseName(renameTo) || 'video';

  const now = new Date();
  const format = (date: Date): string => {
    const parts = new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);

    return (
      `${parts.find((part) => part.type === 'year')?.value || ''}` +
      `${parts.find((part) => part.type === 'month')?.value || ''}` +
      `${parts.find((part) => part.type === 'day')?.value || ''}` +
      '_' +
      `${parts.find((part) => part.type === 'hour')?.value || ''}` +
      `${parts.find((part) => part.type === 'minute')?.value || ''}` +
      `${parts.find((part) => part.type === 'second')?.value || ''}`
    );
  };

  return `${baseName}_${format(now)}.mp4`;
}

async function requestDirectDownload(url: string, filename?: string): Promise<boolean> {
  const response = await chrome.runtime
    .sendMessage({
      type: 'DOWNLOAD_URL',
      url,
      filename,
    })
    .catch(() => null);

  return !!response?.ok;
}

export async function renameMediaItem(mediaContainer: HTMLElement, newName: string): Promise<boolean> {
  return withPageInteractionLock(async () => {
    await simulateHumanPresenceBeforeDownload(mediaContainer);

    const trimmed = String(newName || '').trim();
    if (!trimmed) {
      return false;
    }
    const identity = extractFlowWorkflowIdentity(mediaContainer);
    if (!identity) {
      return false;
    }

    return patchFlowWorkflowDisplayName(identity, trimmed);
  });
}

export async function downloadMediaItem(mediaContainer: HTMLElement, renameTo = 'video'): Promise<boolean> {
  return withPageInteractionLock(async () => {
    const videoUrl = getDirectVideoDownloadUrl(mediaContainer);
    if (videoUrl) {
      await simulateHumanPresenceBeforeDownload(mediaContainer);
      // get folder name from renameTo
      const folderName = sanitizeFolderName(renameTo) || 'veo3_video';

      const filename = `${folderName}/${buildVideoDownloadFilename(renameTo)}`;
      await appendAutomationLog(`Downloading video directly from ${videoUrl} as ${filename}`);
      return requestDirectDownload(videoUrl, filename);
    }

    return false;
  });
}

export async function getImageNameFromMediaContainer(mediaContainer: HTMLElement, imageName: string): Promise<boolean> {
  return withPageInteractionLock(async () => {
    if (!mediaContainer) {
      return false;
    }

    await sleepMilliseconds(500);
    await simulateHumanPresenceBeforeDownload(mediaContainer);
    await sleepMilliseconds(500);

    const text = mediaContainer.textContent || '';
    const match = text.match(/IMAGE\s*[:-]?\s*(.+)/i);

    if (!match || !match[1]) {
      console.log(`🚀 ~ {${imageName}} getImageNameFromMediaContainer ~ text:`, text);
      return false;
    }

    const name = match[1].trim();
    state.matchedImageNames[imageName] = name;
    await saveMatchedImageNames(state.matchedImageNames);
    await appendAutomationLog(`Stored image name match: ${imageName} -> ${name}`);
    return true;
  });
}
