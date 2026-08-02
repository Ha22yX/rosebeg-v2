import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },
  retries: 0,
  testDir: "./tests/e2e",
  timeout: 120_000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "Asia/Shanghai",
  },
  workers: 1,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm.cmd run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
  },
});
