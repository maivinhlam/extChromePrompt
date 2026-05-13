const manifest = {
  manifest_version: 3,
  name: "Flow Prompt Runner",
  version: "1.0.0",
  description:
    "Run prompt lines in Google Labs Flow with timed sending, retries, and auto download naming.",
  permissions: ["activeTab", "storage", "downloads", "tabs", "debugger"],
  host_permissions: ["https://labs.google/*", "https://*.labs.google/*"],
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  action: {
    default_popup: "popup.html",
    default_title: "Flow Prompt Runner",
    default_icon: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png",
    },
  },
  content_scripts: [
    {
      matches: ["https://labs.google/*", "https://*.labs.google/*"],
      js: ["src/content.ts"],
      run_at: "document_idle",
    },
  ],
} satisfies chrome.runtime.ManifestV3;

export default manifest;
