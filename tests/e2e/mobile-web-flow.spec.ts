import { expect, test } from "@playwright/test"

test("mobile learner completes production personalized grading loop", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByLabel("Email")).toHaveValue("")
  await expect(page.getByLabel("Invite code")).toHaveValue("")
  await page.getByLabel("Email").fill("ai@example.com")
  await page.getByLabel("Invite code").fill("BETA-AI-0001")
  await page.getByRole("button", { name: "Start practice" }).click()

  await expect(page.getByRole("heading", { name: "Choose subjects" })).toBeVisible()
  await page.getByLabel("AI/ML Foundations").check()
  await page.getByLabel("Computer Networking").check()
  await page.getByRole("button", { name: "Save subjects" }).click()

  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible()
  await expect(page.getByText("Approved pool")).toBeVisible()
  await expect(page.getByText("Concept", { exact: true })).toBeVisible()
  await expect(page.getByText("TCP layer ownership", { exact: true })).toBeVisible()
  await expect(page.getByText("Scenario", { exact: true })).toBeVisible()
  await expect(page.getByText("Debugging log", { exact: true })).toBeVisible()
  await expect(page.getByText("Why this problem", { exact: true })).toBeVisible()
  await page.getByLabel("Your answer").fill("TCP retries are handled by the application layer.")
  await page.getByRole("button", { name: "Submit answer" }).click()

  await expect(page.getByText(/Partial|Needs review/)).toBeVisible()
  await expect(page.getByText("Missing concept")).toBeVisible()
  await expect(page.getByText("Review concept")).toBeVisible()
  await expect(page.getByRole("button", { name: "Hard" })).toBeVisible()
  await page.getByRole("button", { name: "Hard" }).click()
  await expect(page.getByText("Difficulty saved")).toBeVisible()
  await page.getByRole("link", { name: "History" }).click()
  await expect(page.getByText("TCP layer ownership", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("Rubric", { exact: true })).toBeVisible()
  await page.getByRole("link", { name: "Review" }).click()
  await expect(page.getByText("TCP layer ownership", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("Next review", { exact: true })).toBeVisible()
})

test("admin content page exposes production content operations", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("Email").fill("ai@example.com")
  await page.getByLabel("Invite code").fill("BETA-AI-0001")
  await page.getByRole("button", { name: "Start practice" }).click()

  await page.goto("/admin/content")

  await expect(page.getByRole("heading", { name: "Admin Content Operations" })).toBeVisible()
  await expect(page.getByText("Content coverage", { exact: true })).toBeVisible()
  await expect(page.getByText("Generation policy", { exact: true })).toBeVisible()
  await expect(page.getByText("No realtime per-user generation", { exact: true })).toBeVisible()
  await expect(page.getByText("Problem versions", { exact: true })).toBeVisible()
  await expect(page.getByText("Review queue readiness", { exact: true })).toBeVisible()
})

test("production policy pages render real copy", async ({ page }) => {
  await page.goto("/privacy")
  await expect(page.getByText("third-party AI grading")).toBeVisible()

  await page.goto("/support")
  await expect(page.getByText("support@gappatch.local")).toHaveCount(0)
  await expect(page.getByText("support@gappatch.app")).toBeVisible()

  await page.goto("/account/delete")
  await expect(page.getByRole("heading", { name: "Account deletion" })).toBeVisible()
})

test("production readiness endpoints expose safe public and admin surfaces", async ({
  request,
}) => {
  const unauthorizedToday = await request.get("/api/daily/today")
  expect(unauthorizedToday.status()).toBe(401)
  await expect(unauthorizedToday.json()).resolves.toMatchObject({
    error: { code: "unauthorized" },
    ok: false,
  })

  const coverage = await request.get("/api/admin/content/coverage")
  expect(coverage.status()).toBe(401)
  await expect(coverage.json()).resolves.toMatchObject({
    error: { code: "unauthorized" },
    ok: false,
  })

  for (const path of ["/privacy", "/support", "/account/delete"]) {
    const response = await request.get(path)
    expect(response.status()).toBe(200)
  }
})
