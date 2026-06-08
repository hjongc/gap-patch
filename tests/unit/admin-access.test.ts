import { afterEach, describe, expect, it, vi } from "vitest"

import { isAdminUser } from "../../apps/web/src/server/admin-access"
import type { User } from "../../apps/web/src/server/app-model"

const learner = {
  difficulty: "foundation",
  email: "learner@gappatch.app",
  id: "user-1",
  role: "learner",
  selectedSubjects: ["computer-networking"],
  timezone: "Asia/Seoul",
} satisfies User

describe("admin access", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("allows the seeded master role without an email allowlist", () => {
    const master = { ...learner, email: "master@gappatch.app", role: "admin" } satisfies User

    expect(isAdminUser(master)).toBe(true)
  })

  it("keeps the legacy admin email allowlist for migrations", () => {
    vi.stubEnv("GAPPATCH_ADMIN_EMAILS", "ops@gappatch.app")
    const allowlisted = { ...learner, email: "ops@gappatch.app" } satisfies User

    expect(isAdminUser(allowlisted)).toBe(true)
    expect(isAdminUser(learner)).toBe(false)
  })

  it("does not allow temporary numeric users through the admin email allowlist", () => {
    vi.stubEnv("GAPPATCH_ADMIN_EMAILS", "9000@temporary.gappatch.local")
    const temporary = {
      ...learner,
      email: "9000@temporary.gappatch.local",
      id: "9000",
    } satisfies User

    expect(isAdminUser(temporary)).toBe(false)
  })
})
