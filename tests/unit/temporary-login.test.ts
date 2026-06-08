import { afterEach, describe, expect, it, vi } from "vitest"

import type { User } from "../../apps/web/src/server/app-model"
import { userForSession } from "../../apps/web/src/server/session-state"
import { createAppState, loginWithTemporaryUserId } from "../test-support/app-service-imports"

describe("temporary numeric login", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("uses the numeric login value as a reusable learner id", () => {
    const state = createAppState()

    const firstLogin = loginWithTemporaryUserId(state, {
      temporaryUserId: "0000",
      timezone: "Asia/Seoul",
    })
    const secondLogin = loginWithTemporaryUserId(state, {
      temporaryUserId: "0000",
      timezone: "Asia/Seoul",
    })

    expect(firstLogin.kind).toBe("ok")
    expect(secondLogin.kind).toBe("ok")
    if (firstLogin.kind !== "ok" || secondLogin.kind !== "ok") {
      throw new Error("expected temporary numeric login to succeed")
    }
    expect(firstLogin.user).toMatchObject({
      email: "0000@temporary.gappatch.local",
      id: "0000",
      role: "learner",
      timezone: "Asia/Seoul",
    })
    expect(secondLogin.user.id).toBe("0000")
    expect(state.usersByEmail.size).toBe(1)
    expect(state.sessionsById.size).toBe(2)
  })

  it("does not grant admin role from public numeric login values", () => {
    vi.stubEnv("GAPPATCH_ADMIN_TEMP_USER_IDS", "9000, 9001")
    const state = createAppState()

    const login = loginWithTemporaryUserId(state, {
      temporaryUserId: "9000",
      timezone: "Asia/Seoul",
    })

    expect(login.kind).toBe("ok")
    if (login.kind !== "ok") {
      throw new Error("expected temporary numeric login to succeed")
    }
    expect(login.user.id).toBe("9000")
    expect(login.user.role).toBe("learner")
  })

  it("resolves numeric sessions to the canonical temporary learner", () => {
    const state = createAppState()
    state.usersByEmail.set("legacy-admin@gappatch.app", {
      difficulty: "foundation",
      email: "legacy-admin@gappatch.app",
      id: "9000",
      role: "admin",
      selectedSubjects: ["computer-networking"],
      timezone: "Asia/Seoul",
    } satisfies User)

    const login = loginWithTemporaryUserId(state, {
      temporaryUserId: "9000",
      timezone: "Asia/Seoul",
    })

    expect(login.kind).toBe("ok")
    if (login.kind !== "ok") {
      throw new Error("expected temporary numeric login to succeed")
    }
    const sessionUser = userForSession(state, login.sessionId)
    expect(sessionUser).toMatchObject({
      email: "9000@temporary.gappatch.local",
      id: "9000",
      role: "learner",
    })
  })
})
