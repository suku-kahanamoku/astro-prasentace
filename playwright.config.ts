import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  workers: 2,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:4331",
    browserName: "chromium",
    launchOptions: { channel: "chrome" },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "corepack pnpm exec astro dev --config astro.test.config.mjs --host 127.0.0.1 --port 4331 --ignore-lock",
    url: "http://127.0.0.1:4331",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
