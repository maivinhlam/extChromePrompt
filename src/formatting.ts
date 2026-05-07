import type { SceneNumbers } from "./types";

export function parseSceneNumbers(
  prompt: string,
  fallback: number,
): SceneNumbers {
  const text = String(prompt || "").trim();
  const fromPrompt = text.match(/scene\s*(\d+)/i);
  const scene = fromPrompt ? Number(fromPrompt[1]) : fallback;
  return {
    scene,
    item: scene,
  };
}

export function formatSceneName(
  sceneNumber: number,
  typeLabel: string,
  itemNumber?: number,
): string {
  void itemNumber;
  return `SCENE ${sceneNumber}` + (typeLabel === "" ? "" : ` - ${typeLabel} `);
}

export function extractPromptPrefixName(
  prompt: string,
  fallback: string,
): string {
  const text = String(prompt || "").trim();
  const beforeColon = text.split(":", 1)[0]?.trim() || "";
  const normalized = beforeColon.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return fallback;
  }

  return normalized.slice(0, 20);
}

export function setInputValue(node: HTMLElement, value: string): void {
  node.focus();
  const nextValue = String(value ?? "");

  if (node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement) {
    node.value = nextValue;
    node.select();
    node.dispatchEvent(new Event("beforeinput", { bubbles: true }));
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  const slateStrings = Array.from(
    node.querySelectorAll("span[data-slate-string='true']"),
  ) as HTMLElement[];

  if (slateStrings.length) {
    const range = document.createRange();
    const sel = window.getSelection();
    if (!sel) {
      return;
    }

    range.selectNodeContents(node);
    sel.removeAllRanges();
    sel.addRange(range);

    node.dispatchEvent(
      new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "deleteContentBackward",
        data: null,
      }),
    );

    slateStrings[0].textContent = nextValue;
    for (let i = 1; i < slateStrings.length; i += 1) {
      slateStrings[i].textContent = "";
    }

    node.dispatchEvent(
      new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: nextValue,
      }),
    );
    node.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        data: nextValue,
        inputType: "insertText",
      }),
    );
    node.dispatchEvent(new Event("change", { bubbles: true }));

    const endRange = document.createRange();
    endRange.setStart(slateStrings[0].firstChild || slateStrings[0], 0);
    endRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(endRange);

    return;
  }

  node.textContent = nextValue;
  node.dispatchEvent(
    new InputEvent("beforeinput", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: nextValue,
    }),
  );
  node.dispatchEvent(
    new InputEvent("input", { bubbles: true, data: nextValue }),
  );
  node.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Loại bỏ phần "TênTrướcDauHaiCham:" ở đầu và "IMAGES: ..." cùng mọi nội dung phía sau.
 * Trả về phần mô tả chính giữa đã được trim và loại bỏ các dấu '|' thừa.
 */
export function cleanPromptText(input: string): string {
  if (typeof input !== "string") return "";

  // 1) Xóa phần tên ở đầu tới dấu ":" đầu tiên (ví dụ "Image 22.1:")
  const afterColon = input.replace(/^[^:]+:\s*/u, "");

  // 2) Xóa phần "IMAGES:" và mọi thứ phía sau (cho phép nhiều dòng), không phân biệt hoa thường
  const beforeImages = afterColon.replace(/\s*IMAGES:\s*[\s\S]*$/i, "");

  // 3) Loại bỏ các dấu '|' thừa ở đầu/cuối và trim khoảng trắng
  const cleaned = beforeImages.replace(/^\s*\|+|\|+\s*$/g, "").trim();

  return cleaned;
}
