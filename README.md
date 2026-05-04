# Flow Prompt Runner (Chrome Extension)

This extension helps automate prompts in Google Labs Flow.

## Features

- Popup UI with one-line prompts (one prompt per line).
- Input to set seconds between each prompt send.
- Checkboxes to auto-save image and video.
- Auto download filename rename using the prompt scene name (for example `SCENE 1: ...`).
- Start button to send prompts and click send automatically.
- Retry behavior by clicking retry/regenerate buttons if failures appear.

## Install in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder.

## How to use

1. Open Google Labs Flow in a tab (`https://labs.google/`).
2. Click the extension icon.
3. Add prompt lines in the textarea, each line one prompt.
4. Set interval seconds.
5. Toggle save image/video options.
6. Click **Start**.

## Notes

- The Flow page DOM can change over time. If Google updates labels or layout, selector updates in `content.js` may be needed.
- This extension currently targets `labs.google` pages.
