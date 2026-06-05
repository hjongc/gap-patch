import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: [["list"], ["html", { outputFolder: ".omo/evidence/playwright-report" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      "GAPPATCH_MASTER_EMAIL=master@gappatch.app GAPPATCH_MASTER_INVITE_CODE=MASTER-PATCH-0001 GAPPATCH_TEST_EMAIL=test@gappatch.app GAPPATCH_TEST_INVITE_CODE=TEST-PATCH-0001 GAPPATCH_DATA_FILE=.omo/evidence/playwright-state.json pnpm --filter @gappatch/web dev --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env["CI"],
    timeout: 120000,
  },
})
