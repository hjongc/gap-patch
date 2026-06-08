import { afterEach, describe, expect, it, vi } from "vitest"

import { createAppState, loginWithInvite } from "../test-support/app-service-imports"

describe("invite-scoped account roles", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("updates an existing persisted account to the role granted by a scoped invite", () => {
    vi.stubEnv("GAPPATCH_MASTER_EMAIL", "master@gappatch.app")
    vi.stubEnv("GAPPATCH_MASTER_INVITE_CODE", "MASTER-PATCH-0001")
    const state = createAppState()
    state.usersByEmail.set("master@gappatch.app", {
      difficulty: "foundation",
      email: "master@gappatch.app",
      id: "user-master",
      role: "learner",
      selectedSubjects: ["computer-networking"],
      timezone: "Asia/Seoul",
    })

    const login = loginWithInvite(state, {
      email: "master@gappatch.app",
      inviteCode: "MASTER-PATCH-0001",
      timezone: "Asia/Seoul",
    })

    expect(login.kind).toBe("ok")
    if (login.kind !== "ok") {
      throw new Error("expected master login to succeed")
    }
    expect(login.user.role).toBe("admin")
    expect(state.usersByEmail.get("master@gappatch.app")?.role).toBe("admin")
  })
})
