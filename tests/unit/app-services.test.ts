import { describe, expect, it } from "vitest"

import {
  createAppState,
  createDailyAssignment,
  getHistory,
  localDateForTimezone,
  loginWithInvite,
  submitAnswer,
  updateSubjectSelection,
} from "../test-support/app-service-imports"

describe("mobile web app services", () => {
  it("logs in with a beta invite and stores subject selections", () => {
    const state = createAppState()

    const login = loginWithInvite(state, {
      email: "ai@example.com",
      inviteCode: "BETA-AI-0001",
      timezone: "Asia/Seoul",
    })
    expect(login.kind).toBe("ok")

    if (login.kind !== "ok") {
      throw new Error("expected beta login to succeed")
    }

    const setup = updateSubjectSelection(state, login.sessionId, {
      subjects: ["ai-ml-foundations", "computer-networking"],
      difficulty: "foundation",
    })
    expect(setup.kind).toBe("ok")
    if (setup.kind !== "ok") {
      throw new Error("expected subject setup to succeed")
    }
    expect(setup.subjects).toEqual(["ai-ml-foundations", "computer-networking"])
  })

  it("rejects invalid invites with a typed error", () => {
    const state = createAppState()

    const login = loginWithInvite(state, {
      email: "ai@example.com",
      inviteCode: "NOPE",
      timezone: "Asia/Seoul",
    })

    expect(login).toEqual({ kind: "error", code: "invalid_invite", status: 401 })
  })

  it("uses opaque session ids and rejects forged predictable sessions", () => {
    const state = createAppState()
    const login = loginWithInvite(state, {
      email: "ai@example.com",
      inviteCode: "BETA-AI-0001",
      timezone: "Asia/Seoul",
    })

    if (login.kind !== "ok") {
      throw new Error("expected beta login to succeed")
    }

    expect(login.sessionId).not.toBe("session-1")
    expect(login.sessionId.length).toBeGreaterThanOrEqual(40)
    expect(getHistory(state, "session-1")).toEqual({
      kind: "error",
      code: "unauthorized",
      status: 401,
    })
  })

  it("returns one idempotent daily assignment per local day", () => {
    const state = createAppState()
    const login = loginWithInvite(state, {
      email: "ai@example.com",
      inviteCode: "BETA-AI-0001",
      timezone: "Asia/Seoul",
    })

    if (login.kind !== "ok") {
      throw new Error("expected beta login to succeed")
    }

    const first = createDailyAssignment(state, login.sessionId, "2026-06-04")
    const second = createDailyAssignment(state, login.sessionId, "2026-06-04")

    expect(first.kind).toBe("ok")
    expect(second.kind).toBe("ok")
    if (first.kind !== "ok" || second.kind !== "ok") {
      throw new Error("expected assignment creation to succeed")
    }
    expect(second.assignment.id).toBe(first.assignment.id)
  })

  it("computes local dates from the user's timezone", () => {
    const instant = new Date("2026-06-04T15:30:00.000Z")

    expect(localDateForTimezone("Asia/Seoul", instant)).toBe("2026-06-05")
    expect(localDateForTimezone("America/Los_Angeles", instant)).toBe("2026-06-04")
  })

  it("grades a submitted answer and creates history plus review state", () => {
    const state = createAppState()
    const login = loginWithInvite(state, {
      email: "ai@example.com",
      inviteCode: "BETA-AI-0001",
      timezone: "Asia/Seoul",
    })

    if (login.kind !== "ok") {
      throw new Error("expected beta login to succeed")
    }

    const assignment = createDailyAssignment(state, login.sessionId, "2026-06-04")
    if (assignment.kind !== "ok") {
      throw new Error("expected assignment creation to succeed")
    }

    const submission = submitAnswer(state, login.sessionId, {
      assignmentId: assignment.assignment.id,
      answer: "I think TCP retries are handled by the application.",
    })

    expect(submission.kind).toBe("ok")
    if (submission.kind !== "ok") {
      throw new Error("expected submission to succeed")
    }
    expect(submission.feedback.score).toBeLessThan(1)
    expect(submission.history).toHaveLength(1)
    expect(submission.reviewItems[0]?.label).toBe("Needs review")
  })

  it("rejects malformed submissions with a typed error", () => {
    const state = createAppState()

    const submission = submitAnswer(state, "missing-session", {
      assignmentId: "",
      answer: "",
    })

    expect(submission).toEqual({ kind: "error", code: "invalid_submission", status: 400 })
  })
})
