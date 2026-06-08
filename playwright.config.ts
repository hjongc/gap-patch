import { defineConfig, devices } from "@playwright/test"

const e2ePort = 3100
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`
const e2eStateFile = `.omo/evidence/playwright-state-${process.pid}.json`

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: ".omo/evidence/playwright-report" }]],
  use: {
    baseURL: e2eBaseUrl,
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
    command: `GAPPATCH_MASTER_EMAIL=master@gappatch.app GAPPATCH_MASTER_INVITE_CODE=MASTER-PATCH-0001 GAPPATCH_TEST_EMAIL=test@gappatch.app GAPPATCH_TEST_INVITE_CODE=TEST-PATCH-0001 GAPPATCH_ALLOW_INSECURE_AUTH=true GAPPATCH_SECURE_COOKIES=false GAPPATCH_DATA_FILE=${e2eStateFile} pnpm --filter @gappatch/web start --hostname 127.0.0.1 --port ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: false,
    timeout: 120000,
  },
})
