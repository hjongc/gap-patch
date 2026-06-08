import { describe, expect, it } from "vitest"

import { deleteAccount } from "../../apps/web/src/server/app-services"
import {
  createAppState,
  createDailyAssignment,
  getHistory,
  getReview,
  loginWithInvite,
  submitAnswer,
  updateDifficultyFeedback,
} from "../test-support/app-service-imports"

describe("account deletion", () => {
  it("removes learner data and revokes active sessions", () => {
    const state = createAppState()
    const login = loginWithInvite(state, {
      email: "delete-me@gappatch.app",
      inviteCode: "BETA-AI-0001",
      timezone: "Asia/Seoul",
    })

    expect(login.kind).toBe("ok")
    if (login.kind !== "ok") {
      throw new Error("expected beta login to succeed")
    }

    const assignment = createDailyAssignment(state, login.sessionId, "2026-06-08")
    expect(assignment.kind).toBe("ok")
    if (assignment.kind !== "ok") {
      throw new Error("expected assignment creation to succeed")
    }

    const submission = submitAnswer(state, login.sessionId, {
      answer: "애플리케이션 계층이 TCP 재전송을 직접 맡습니다.",
      assignmentId: assignment.assignment.id,
    })
    expect(submission.kind).toBe("ok")
    const difficulty = updateDifficultyFeedback(state, login.sessionId, {
      assignmentId: assignment.assignment.id,
      perceivedDifficulty: "hard",
    })
    expect(difficulty.kind).toBe("ok")

    const deletion = deleteAccount(state, login.sessionId)

    expect(deletion).toEqual({
      deleted: {
        assignments: 1,
        historyItems: 1,
        masteryRecords: 1,
        reviewItems: 1,
        sessions: 1,
      },
      kind: "ok",
    })
    expect(state.usersByEmail.has("delete-me@gappatch.app")).toBe(false)
    expect(getHistory(state, login.sessionId)).toEqual({
      code: "unauthorized",
      kind: "error",
      status: 401,
    })
    expect(getReview(state, login.sessionId)).toEqual({
      code: "unauthorized",
      kind: "error",
      status: 401,
    })
  })

  it("does not reuse user ids after deleting an account", () => {
    const state = createAppState()
    const firstLogin = loginWithInvite(state, {
      email: "first-delete@gappatch.app",
      inviteCode: "BETA-AI-0001",
      timezone: "Asia/Seoul",
    })
    expect(firstLogin.kind).toBe("ok")
    if (firstLogin.kind !== "ok") {
      throw new Error("expected first login to succeed")
    }

    const deletion = deleteAccount(state, firstLogin.sessionId)
    expect(deletion.kind).toBe("ok")

    const secondLogin = loginWithInvite(state, {
      email: "second-delete@gappatch.app",
      inviteCode: "BETA-AI-0001",
      timezone: "Asia/Seoul",
    })
    expect(secondLogin.kind).toBe("ok")
    if (secondLogin.kind !== "ok") {
      throw new Error("expected second login to succeed")
    }

    expect(secondLogin.user.id).not.toBe(firstLogin.user.id)
  })
})
