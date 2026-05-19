import { isVisible } from './utils';

export function countMainMediaItems(): number {
  return getMainMediaContainers().length;
}

export function getLatestMainMediaContainer(): HTMLElement | null {
  const items = getMainMediaContainers();
  return items.length ? items[items.length - 1] : null;
}

export function getMainMediaContainers(): HTMLElement[] {
  const mediaNodes = Array.from(document.querySelectorAll('img, video')) as HTMLElement[];
  const containers: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  for (const media of mediaNodes) {
    if (!isMainMediaCandidate(media)) {
      continue;
    }

    const container = findMediaContainer(media);
    if (!container) {
      continue;
    }

    if (!seen.has(container)) {
      seen.add(container);
      containers.push(container);
    }
  }

  return containers;
}

function isMainMediaCandidate(media: HTMLElement): boolean {
  if (!isVisible(media)) {
    return false;
  }

  if (media.closest("[role='dialog']")) {
    return false;
  }

  const rect = media.getBoundingClientRect();
  if (media.tagName.toLowerCase() === 'img') {
    return rect.width >= 96 && rect.height >= 96;
  }

  if (media.tagName.toLowerCase() === 'video') {
    return rect.width >= 120 && rect.height >= 80;
  }

  return false;
}

function findMediaContainer(media: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = media;
  for (let depth = 0; depth < 8; depth += 1) {
    if (!node) {
      break;
    }

    const rect = node.getBoundingClientRect();
    if (rect.width >= 120 && rect.height >= 90) {
      return node;
    }

    node = node.parentElement;
  }

  return media.parentElement;
}
