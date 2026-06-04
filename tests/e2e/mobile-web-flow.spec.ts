import { expect, test } from "@playwright/test"

test("mobile learner completes today's practice flow", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("Email").fill("ai@example.com")
  await page.getByLabel("Invite code").fill("BETA-AI-0001")
  await page.getByRole("button", { name: "Start practice" }).click()

  await expect(page.getByRole("heading", { name: "Choose subjects" })).toBeVisible()
  await page.getByLabel("AI/ML Foundations").check()
  await page.getByLabel("Computer Networking").check()
  await page.getByRole("button", { name: "Save subjects" }).click()

  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible()
  await expect(page.getByText("TCP retransmission ownership")).toBeVisible()
  await page.getByLabel("Your answer").fill("TCP retries are handled by the application layer.")
  await page.getByRole("button", { name: "Submit answer" }).click()

  await expect(page.getByText("Needs review")).toBeVisible()
  await page.getByRole("link", { name: "History" }).click()
  await expect(page.getByText("TCP retransmission ownership")).toBeVisible()
  await page.getByRole("link", { name: "Review" }).click()
  await expect(page.getByText("Computer Networking")).toBeVisible()
})

test("production policy pages render real copy", async ({ page }) => {
  await page.goto("/privacy")
  await expect(page.getByText("third-party AI grading")).toBeVisible()

  await page.goto("/support")
  await expect(page.getByText("support@gappatch.local")).toBeVisible()

  await page.goto("/account/delete")
  await expect(page.getByRole("heading", { name: "Account deletion" })).toBeVisible()
})
