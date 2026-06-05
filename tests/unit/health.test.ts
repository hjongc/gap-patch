import { afterEach, describe, expect, it, vi } from "vitest"
import { getHealthSnapshot, getPublicHealthSnapshot } from "../../apps/web/src/server/health"
import {
  createAppState,
  createDailyAssignment,
  loginWithInvite,
} from "../test-support/app-service-imports"

describe("health snapshot", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("reports the service and persisted state counts", () => {
    vi.stubEnv("GAPPATCH_DATA_FILE", "/var/lib/gappatch/state.json")
    vi.stubEnv("GAPPATCH_MASTER_EMAIL", "")
    vi.stubEnv("GAPPATCH_MASTER_INVITE_CODE", "")
    vi.stubEnv("GAPPATCH_TEST_EMAIL", "test@gappatch.app")
    vi.stubEnv("GAPPATCH_TEST_INVITE_CODE", "TEST-PATCH-0001")
    vi.stubEnv("NODE_ENV", "production")
    const state = createAppState()
    const login = loginWithInvite(state, {
      email: "test@gappatch.app",
      inviteCode: "TEST-PATCH-0001",
      timezone: "Asia/Seoul",
    })

    expect(login.kind).toBe("ok")
    if (login.kind !== "ok") {
      throw new Error("expected beta login to succeed")
    }

    const assignment = createDailyAssignment(state, login.sessionId, "2026-06-05")
    expect(assignment.kind).toBe("ok")

    const snapshot = getHealthSnapshot(state, new Date("2026-06-05T00:00:00.000Z"))

    expect(snapshot).toEqual({
      checkedAt: "2026-06-05T00:00:00.000Z",
      ok: true,
      runtime: {
        dataFileConfigured: true,
        nodeEnv: "production",
      },
      service: "gappatch-web",
      state: {
        assignments: 1,
        historyItems: 0,
        invites: 1,
        masteryRecords: 0,
        reviewItems: 0,
        sessions: 1,
        users: 1,
      },
    })
  })

  it("keeps the public health snapshot free of state counts", () => {
    const snapshot = getPublicHealthSnapshot(new Date("2026-06-05T00:00:00.000Z"))

    expect(snapshot).toEqual({
      checkedAt: "2026-06-05T00:00:00.000Z",
      ok: true,
      service: "gappatch-web",
    })
    expect("state" in snapshot).toBe(false)
  })
})
