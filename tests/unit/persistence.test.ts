import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"

import { loadAppStateFromFile, saveAppStateToFile } from "../../apps/web/src/server/state"
import {
  createAppState,
  createDailyAssignment,
  getHistory,
  getReview,
  loginWithInvite,
  submitAnswer,
} from "../test-support/app-service-imports"

describe("file-backed app state", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("keeps learner history available after a server restart", async () => {
    const directory = await mkdtemp(join(tmpdir(), "gappatch-state-"))
    const stateFile = join(directory, "state.json")

    try {
      const state = createAppState()
      const login = loginWithInvite(state, {
        email: "persist@example.com",
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
        answer: "TCP retries are handled by the application layer.",
      })
      expect(submission.kind).toBe("ok")

      await saveAppStateToFile(state, stateFile)

      const restarted = await loadAppStateFromFile(stateFile)
      const history = getHistory(restarted, login.sessionId)

      expect(history.kind).toBe("ok")
      if (history.kind !== "ok") {
        throw new Error("expected persisted history to load")
      }
      expect(history.history[0]?.assignmentId).toBe(assignment.assignment.id)
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("migrates legacy invite strings and users to learner roles", async () => {
    const directory = await mkdtemp(join(tmpdir(), "gappatch-state-"))
    const stateFile = join(directory, "state.json")

    try {
      await writeFile(
        stateFile,
        `${JSON.stringify(
          {
            assignments: [],
            history: [],
            invites: ["LEGACY-BETA"],
            review: [],
            sessions: [],
            users: [
              {
                difficulty: "foundation",
                email: "legacy@gappatch.app",
                id: "user-legacy",
                selectedSubjects: ["computer-networking"],
                timezone: "Asia/Seoul",
              },
            ],
          },
          null,
          2,
        )}\n`,
      )

      const restarted = await loadAppStateFromFile(stateFile)
      const login = loginWithInvite(restarted, {
        email: "new@gappatch.app",
        inviteCode: "LEGACY-BETA",
        timezone: "Asia/Seoul",
      })

      expect(restarted.invites.get("LEGACY-BETA")).toEqual({
        code: "LEGACY-BETA",
        role: "learner",
      })
      expect(restarted.usersByEmail.get("legacy@gappatch.app")?.role).toBe("learner")
      expect(login.kind).toBe("ok")
      if (login.kind !== "ok") {
        throw new Error("expected migrated invite to work")
      }
      expect(login.user.role).toBe("learner")
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("does not preserve the public beta invite from persisted production state", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const directory = await mkdtemp(join(tmpdir(), "gappatch-state-"))
    const stateFile = join(directory, "state.json")

    try {
      await writeFile(
        stateFile,
        `${JSON.stringify(
          {
            assignments: [],
            history: [],
            invites: ["BETA-AI-0001"],
            review: [],
            sessions: [],
            users: [],
          },
          null,
          2,
        )}\n`,
      )

      const restarted = await loadAppStateFromFile(stateFile)
      const login = loginWithInvite(restarted, {
        email: "internet@gappatch.app",
        inviteCode: "BETA-AI-0001",
        timezone: "Asia/Seoul",
      })

      expect(restarted.invites.has("BETA-AI-0001")).toBe(false)
      expect(login).toEqual({ kind: "error", code: "invalid_invite", status: 401 })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("refreshes legacy persisted history and review display copy", async () => {
    const directory = await mkdtemp(join(tmpdir(), "gappatch-state-"))
    const stateFile = join(directory, "state.json")

    try {
      await writeFile(
        stateFile,
        `${JSON.stringify(
          {
            assignments: [],
            history: [
              [
                "user-legacy",
                [
                  {
                    assignmentId: "assignment-user-legacy-2026-06-05",
                    conceptId: "networking.tcp.layer-ownership",
                    conceptLabel: "TCP layer ownership",
                    feedback: {
                      confidence: 0.86,
                      label: "Needs review",
                      misconceptions: ["Application layer owns TCP retransmission behavior."],
                      missingConcepts: [
                        "Application-level retry policy is different from TCP segment retransmission.",
                      ],
                      reviewConcepts: ["networking.tcp.layer-ownership"],
                      score: 0.4,
                      strengths: [],
                      summary: "TCP retransmission is transport-layer behavior.",
                    },
                    problemVersionId:
                      "problem-networking-tcp-layer-ownership-debugging-foundation-v1",
                    rubricVersionId: "rubric-networking-tcp-layer-ownership-v1",
                    scenarioLabel: "Debugging log",
                    subjectId: "computer-networking",
                    title: "TCP layer ownership during retransmission",
                  },
                ],
              ],
            ],
            invites: ["LEGACY-BETA"],
            mastery: [
              {
                conceptId: "networking.tcp.layer-ownership",
                conceptLabel: "TCP layer ownership",
                lastMisconception: "Application layer owns TCP retransmission behavior.",
                lastScore: 0.4,
                nextReviewAt: "2026-06-07",
                stability: 0.4,
                userId: "user-legacy",
              },
            ],
            review: [
              [
                "user-legacy",
                [
                  {
                    conceptId: "networking.tcp.layer-ownership",
                    conceptLabel: "TCP layer ownership",
                    label: "Needs review",
                    lastScenarioLabel: "Debugging log",
                    nextReviewAt: "2026-06-07",
                    reason: "Application layer owns TCP retransmission behavior.",
                    subjectId: "computer-networking",
                    subjectLabel: "Computer Networking",
                  },
                ],
              ],
            ],
            sessions: [
              {
                expiresAt: "2099-01-01T00:00:00.000Z",
                id: "session-legacy",
                userId: "user-legacy",
              },
            ],
            users: [
              {
                difficulty: "foundation",
                email: "legacy@gappatch.app",
                id: "user-legacy",
                role: "learner",
                selectedSubjects: ["computer-networking"],
                timezone: "Asia/Seoul",
              },
            ],
          },
          null,
          2,
        )}\n`,
      )

      const restarted = await loadAppStateFromFile(stateFile)
      const history = getHistory(restarted, "session-legacy")
      const review = getReview(restarted, "session-legacy")

      expect(history.kind).toBe("ok")
      expect(review.kind).toBe("ok")
      if (history.kind !== "ok" || review.kind !== "ok") {
        throw new Error("expected migrated history and review to load")
      }
      expect(history.history[0]).toMatchObject({
        conceptLabel: "TCP 계층 책임",
        scenarioLabel: "디버깅 로그",
        title: "TCP 재전송은 어느 계층의 책임일까?",
      })
      expect(review.reviewItems[0]).toMatchObject({
        conceptLabel: "TCP 계층 책임",
        lastScenarioLabel: "디버깅 로그",
        reason: "TCP 재전송과 애플리케이션 재시도 정책을 다시 구분해 보세요.",
        subjectLabel: "네트워크",
      })
      expect(
        restarted.masteryByUserConceptKey.get("user-legacy:networking.tcp.layer-ownership"),
      ).toMatchObject({ conceptLabel: "TCP 계층 책임" })
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })
})
