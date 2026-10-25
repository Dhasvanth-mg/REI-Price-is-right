import { defineConfig } from "@playwright/test";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";
export default defineConfig({
  testDir: "./e2e",
  timeout: 90000,
  use: { baseURL, headless: true },
  webServer: {
    command: "npm.cmd run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium", channel: "msedge" } },
  ],
});
