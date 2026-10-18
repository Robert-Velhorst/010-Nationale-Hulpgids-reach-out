import { defineConfig, devices } from "playwright/test";

const port = Number.parseInt(process.env.E2E_PORT || "3120", 10);
const baseURL = `http://127.0.0.1:${port}`;
const browserChannel =
  process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "true" ? "chrome" : undefined;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], channel: browserChannel },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], channel: browserChannel },
    },
  ],
  webServer: {
    command: "node dist/index.js",
    url: `${baseURL}/api/readiness`,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "production",
      LOCAL_DESKTOP_MODE: "1",
      LOCAL_DATA_DIR: ".e2e-local-data",
    },
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
