import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { loadAppStateFromFile } from "../../apps/web/src/server/state"

describe("persisted app state compatibility", () => {
  it("loads minimal legacy snapshots with missing derived collections", async () => {
    const directory = await mkdtemp(join(tmpdir(), "gappatch-legacy-state-"))
    const stateFile = join(directory, "state.json")

    try {
      await writeFile(
        stateFile,
        `${JSON.stringify({
          assignments: [],
          invites: ["LEGACY-BETA"],
          sessions: [],
          users: [],
        })}\n`,
      )

      const state = await loadAppStateFromFile(stateFile)

      expect(state.invites.get("LEGACY-BETA")).toEqual({
        code: "LEGACY-BETA",
        role: "learner",
      })
      expect(state.historyByUserId.size).toBe(0)
      expect(state.reviewByUserId.size).toBe(0)
      expect(state.masteryByUserConceptKey.size).toBe(0)
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })
})
