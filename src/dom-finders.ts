import { isVisible, sleepMilliseconds } from "./utils";

export function findPromptInput(): HTMLElement | null {
  const preferredSlateEditors = Array.from(
    document.querySelectorAll(
      "[role='textbox'][contenteditable='true'][data-slate-editor='true']",
    ),
  ) as HTMLElement[];

  const placeholderMatchedEditor = preferredSlateEditors.find((editor) => {
    if (!isVisible(editor)) {
      return false;
    }

    const placeholder =
      editor
        .querySelector("[data-slate-placeholder='true']")
        ?.textContent?.trim()
        .toLowerCase() || "";

    return placeholder.includes("bạn muốn tạo gì?");
  });
  if (placeholderMatchedEditor) {
    return placeholderMatchedEditor;
  }

  const selectors = [
    "[role='textbox'][contenteditable='true'][data-slate-editor='true'][aria-multiline='true']",
    "[role='textbox'][contenteditable='true'][data-slate-editor='true']",
    "div[contenteditable='true'][data-slate-editor='true']",
    "textarea",
    "textarea[placeholder*='Prompt' i]",
    "textarea[placeholder*='Describe' i]",
    "div[data-slate-editor='true']",
    "[role='textbox'][data-slate-editor='true']",
  ];

  for (const selector of selectors) {
    const candidates = Array.from(document.querySelectorAll(selector));
    const visible = candidates.find((el) => isVisible(el as HTMLElement));
    if (visible) {
      return visible as HTMLElement;
    }
  }

  return null;
}

export function findSendButton(): HTMLElement | null {
  const buttons = Array.from(
    document.querySelectorAll("button, [role='button']"),
  );

  return (
    (buttons as HTMLElement[]).find((button) => {
      const text = (button.textContent || "").toLowerCase();
      const label = (button.getAttribute("aria-label") || "").toLowerCase();
      const combined = `${text} ${label}`;
      return isVisible(button) && /arrow_forward/.test(combined);
    }) || null
  );
}

export function findModelButton(): HTMLElement | null {
  const buttons = Array.from(
    document.querySelectorAll("button[aria-haspopup='menu']"),
  ) as HTMLElement[];

  const primary = buttons.find((button) => {
    if (!isVisible(button)) {
      return false;
    }

    const text = (button.textContent || "").toLowerCase();
    return (
      text.includes("nano banana") ||
      text.includes("video") ||
      text.includes("crop_16_9")
    );
  });
  if (primary) {
    return primary;
  }

  return buttons.find(isVisible) || null;
}

export function findVideoReferencesTab(): HTMLElement | null {
  const tabs = Array.from(
    document.querySelectorAll("button[role='tab']"),
  ) as HTMLElement[];
  return (
    tabs.find((tab) => {
      if (!isVisible(tab)) {
        return false;
      }

      const text = (tab.textContent || "").toLowerCase();
      const controls = (tab.getAttribute("aria-controls") || "").toLowerCase();
      const id = (tab.id || "").toLowerCase();
      return (
        text.includes("Thành phần") ||
        controls.includes("video_references") ||
        id.includes("video_references")
      );
    }) || null
  );
}

export function findVideoModelDropdownButton(): HTMLElement | null {
  const buttons = Array.from(
    document.querySelectorAll("button[aria-haspopup='menu']"),
  ) as HTMLElement[];

  const exact = buttons.find((button) => {
    if (!isVisible(button)) {
      return false;
    }

    const text = (button.textContent || "").toLowerCase();
    return text.includes("veo 3.1 - lite") && text.includes("lower priority");
  });
  if (exact) {
    return exact;
  }

  return (
    buttons.find((button) => {
      if (!isVisible(button)) {
        return false;
      }

      const text = (button.textContent || "").toLowerCase();
      return text.includes("veo") || text.includes("video model");
    }) || null
  );
}

export function findReferenceImageOpenButton(): HTMLElement | null {
  const buttons = Array.from(
    document.querySelectorAll("button"),
  ) as HTMLElement[];
  return (
    buttons.find((button) => {
      if (!isVisible(button)) {
        return false;
      }

      const hasDialog = button.getAttribute("aria-haspopup") === "dialog";
      if (!hasDialog) {
        return false;
      }

      const text =
        `${button.textContent || ""} ${button.getAttribute("aria-label") || ""}`.toLowerCase();
      return /add_2|them|add|chon/.test(text);
    }) || null
  );
}

export async function waitForDialog(
  timeoutMs: number,
): Promise<HTMLElement | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const dialogs = Array.from(
      document.querySelectorAll("div[role='dialog']"),
    ) as HTMLElement[];

    const dialog = dialogs.find(isVisible) || null;
    if (dialog && isVisible(dialog)) {
      return dialog;
    }
    await sleepMilliseconds(120);
  }
  return null;
}

export async function waitForMenu(
  timeoutMs: number,
): Promise<HTMLElement | null> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const menu = document.querySelector("[role='menu']") as HTMLElement | null;
    if (menu && isVisible(menu)) {
      return menu;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return null;
}

export function findImgItemByAlt(
  text: string,
  root: ParentNode = document,
): HTMLElement | null {
  const candidates = Array.from(
    root.querySelectorAll(`img[alt='${text}']`),
  ) as HTMLElement[];

  for (const el of candidates) {
    if (!isVisible(el)) {
      continue;
    }

    const content = (el.textContent || "").trim().toLowerCase();
    const alt = (el.getAttribute("alt") || "").trim().toLowerCase();
    const label = (el.getAttribute("aria-label") || "").trim().toLowerCase();
    const title = (el.getAttribute("title") || "").trim().toLowerCase();
    const combined = `${content} ${alt} ${label} ${title}`;
    if (!combined.includes(text.toLowerCase())) {
      continue;
    }

    if (el.matches("button, [role='button'], [data-index], li, div")) {
      return el;
    }

    const clickableParent = el.closest(
      "button, [role='button'], [data-index], li, div",
    ) as HTMLElement | null;
    if (clickableParent && isVisible(clickableParent)) {
      return clickableParent;
    }
  }

  return null;
}

export function findReferenceImageSearchInput(
  root: ParentNode = document,
): HTMLInputElement | HTMLTextAreaElement | null {
  const candidates = Array.from(
    root.querySelectorAll(
      "#quick-search-input, input[placeholder='Tìm kiếm các thành phần'], input[type='text'], textarea",
    ),
  ) as Array<HTMLInputElement | HTMLTextAreaElement>;

  return candidates.find(isVisible) || null;
}

export function findButtonByText(
  terms: string[],
  root: ParentNode = document,
): HTMLElement | null {
  const buttons = Array.from(
    root.querySelectorAll("button, [role='button'], [role='menuitem']"),
  ) as HTMLElement[];
  return (
    buttons.find((button) => {
      if (!isVisible(button)) {
        return false;
      }

      const text =
        `${button.textContent || ""} ${button.getAttribute("aria-label") || ""}`.toLowerCase();
      return terms.some((term) => text.includes(String(term).toLowerCase()));
    }) || null
  );
}
