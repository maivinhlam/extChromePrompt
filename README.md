# Flow Prompt Runner (Chrome Extension)

This extension automates prompt running in Google Labs Flow with two modes:

- Create image
- Create video

## Features

- Prompt list runner (one line = one prompt).
- Select mode from popup: image or video.
- Auto-click model selector and mode tab.
- Image mode:
  - Fills prompt, clicks create.
  - Renames generated asset as `SCENE %d - Image %d`.
- Video mode:
  - Fills prompt.
  - Opens reference-image picker.
  - Selects image with matching name `SCENE %d - Image %d`.
  - Clicks create.
  - Renames generated asset as `SCENE %d - Video %d`.

## Install in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder.

## How to use

1. Open Google Labs Flow (`https://labs.google/`).
2. Open extension popup.
3. Choose mode.
4. Paste prompt list (one prompt per line).
5. Set interval seconds.
6. Click **Start**.

## Prompt naming rule

- If prompt contains `SCENE <number>`, that number is used.
- If not, line index is used.
- Generated names:
  - Image mode: `SCENE N - Image N`
  - Video mode: `SCENE N - Video N`

## Notes

- The Flow DOM is dynamic. Selectors are text-based and may need updates if Google changes the UI.
- Best results come from prompts starting with `SCENE N:` format.
