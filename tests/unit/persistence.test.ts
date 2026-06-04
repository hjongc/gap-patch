import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { loadAppStateFromFile, saveAppStateToFile } from "../../apps/web/src/server/state"
import {
  createAppState,
  createDailyAssignment,
  getHistory,
  loginWithInvite,
  submitAnswer,
} from "../test-support/app-service-imports"

describe("file-backed app state", () => {
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
})
