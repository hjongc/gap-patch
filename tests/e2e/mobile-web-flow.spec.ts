import { expect, test } from "@playwright/test"

type ManualGate = {
  readonly open: () => void
  readonly wait: Promise<void>
}

function createManualGate(): ManualGate {
  let openGate: (() => void) | null = null
  const wait = new Promise<void>((resolve) => {
    openGate = resolve
  })

  return {
    open: () => {
      openGate?.()
    },
    wait,
  }
}

test("mobile learner completes production personalized grading loop", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByLabel("임시 숫자 ID")).toHaveValue("")
  await page.getByLabel("임시 숫자 ID").fill("1001")
  await page.getByRole("button", { name: "시작하기" }).click()

  await expect(page.getByRole("heading", { name: "과목 선택" })).toBeVisible()
  await page.getByLabel("AI/ML Foundations").check()
  await page.getByLabel("Computer Networking").check()
  await page.getByRole("button", { name: "과목 저장" }).click()

  await expect(page.getByRole("heading", { name: "오늘의 문제" })).toBeVisible()
  await expect(page.getByText("검수 완료", { exact: true })).toHaveCount(0)
  await expect(page.getByText("기초", { exact: true })).toHaveCount(0)
  await expect(page.getByText("개념: TCP 계층 책임", { exact: true })).toHaveCount(0)
  await expect(page.getByText("foundation", { exact: true })).toHaveCount(0)
  await expect(
    page.getByRole("heading", { name: "TCP 재전송은 어느 계층의 책임일까?" }),
  ).toBeVisible()
  await expect(page.getByText("상황", { exact: true })).toBeVisible()
  await expect(page.getByText("디버깅 로그", { exact: true })).toBeVisible()
  await expect(page.getByText("출제 이유", { exact: true })).toBeVisible()
  const submissionGate = createManualGate()
  await page.route("**/api/submissions", async (route) => {
    await submissionGate.wait
    await route.continue()
  })
  await page.getByLabel("내 답안").fill("애플리케이션 계층이 TCP 재전송을 직접 맡습니다.")
  await page.getByRole("button", { name: "답안 제출" }).click()
  await expect(page.getByRole("button", { name: "채점 중..." })).toBeDisabled()
  await expect(page.getByText("답안을 채점하고 있어요")).toBeVisible()
  submissionGate.open()

  await expect(page.getByText("복습 필요", { exact: true })).toBeVisible()
  await expect(page.getByText("Needs review", { exact: true })).toHaveCount(0)
  await expect(page.getByText("networking.tcp.layer-ownership", { exact: true })).toHaveCount(0)
  await expect(page.getByText("빠진 개념")).toBeVisible()
  await expect(page.getByText("복습 개념")).toBeVisible()
  await expect(page.getByRole("button", { name: "어려움" })).toBeVisible()
  await page.getByRole("button", { name: "어려움" }).click()
  await expect(page.getByText("난이도 저장됨")).toBeVisible()
  await page.getByRole("link", { name: "기록" }).click()
  await expect(page.getByText("TCP 계층 책임", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("채점 기준", { exact: true })).toBeVisible()
  await expect(page.getByText("Needs review", { exact: true })).toHaveCount(0)
  await page.getByRole("link", { name: "복습" }).click()
  await expect(page.getByText("TCP 계층 책임", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("복습 필요", { exact: true })).toBeVisible()
  await expect(page.getByText("다음 복습", { exact: true })).toBeVisible()
})

test("numeric learners cannot access admin content operations", async ({ page }) => {
  await page.context().clearCookies()
  await page.goto("/login")
  await page.getByLabel("임시 숫자 ID").fill("9000")
  const loginResponse = page.waitForResponse(
    (response) => response.url().includes("/api/auth/beta-login") && response.status() === 200,
  )
  await page.getByRole("button", { name: "시작하기" }).click()
  await loginResponse
  await expect
    .poll(async () =>
      (await page.context().cookies()).some((cookie) => cookie.name === "gappatch_session"),
    )
    .toBe(true)
  await expect(page.getByRole("heading", { name: "과목 선택" })).toBeVisible()

  await page.goto("/admin/content")
  await expect(page.getByText("관리자 권한이 필요합니다.")).toBeVisible()

  await page.goto("/admin/health")
  await expect(page.getByText("관리자 권한이 필요합니다.")).toBeVisible()
})

test("production policy pages render real copy", async ({ page }) => {
  await page.goto("/privacy")
  await expect(page.getByText("외부 AI 채점")).toBeVisible()
  await expect(page.getByText("임시 숫자 ID")).toBeVisible()
  await expect(page.getByText("이메일")).toHaveCount(0)

  await page.goto("/support")
  await expect(page.getByText("support@gappatch.local")).toHaveCount(0)
  await expect(page.getByText("support@gappatch.app")).toBeVisible()

  await page.goto("/account/delete")
  await expect(page.getByRole("heading", { name: "계정 삭제" })).toBeVisible()
  await expect(page.getByRole("button", { name: "계정 삭제 요청" })).toBeDisabled()
})

test("learner can delete account data and revoke the session", async ({ page }, testInfo) => {
  const temporaryUserId = testInfo.project.name === "desktop-chromium" ? "3002" : "3001"

  await page.goto("/login")
  await page.getByLabel("임시 숫자 ID").fill(temporaryUserId)
  await page.getByRole("button", { name: "시작하기" }).click()

  await expect(page.getByRole("heading", { name: "과목 선택" })).toBeVisible()
  await page.getByRole("button", { name: "과목 저장" }).click()
  await expect(page.getByRole("heading", { name: "오늘의 문제" })).toBeVisible()

  await page.goto("/account/delete")
  await page.getByLabel("내 학습 기록 삭제에 동의합니다.").check()
  await page.getByRole("button", { name: "계정 삭제 요청" }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect
    .poll(async () =>
      (await page.context().cookies()).some((cookie) => cookie.name === "gappatch_session"),
    )
    .toBe(false)

  await page.goto("/today")
  await expect(page.getByText("오늘의 문제를 불러오지 못했습니다.")).toBeVisible()
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

  const publicHealth = await request.get("/api/health")
  expect(publicHealth.status()).toBe(200)
  expect(publicHealth.headers()["x-content-type-options"]).toBe("nosniff")
  expect(publicHealth.headers()["x-frame-options"]).toBe("DENY")

  for (const path of ["/privacy", "/support", "/account/delete"]) {
    const response = await request.get(path)
    expect(response.status()).toBe(200)
  }
})
