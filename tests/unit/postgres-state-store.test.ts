import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import type { AppState } from "../../apps/web/src/server/app-model"
import {
  loadAppStateFromPostgres,
  type PostgresStateDatabase,
  saveAppStateToPostgres,
} from "../../apps/web/src/server/postgres-state-store"
import { saveAppStateToFile } from "../../apps/web/src/server/state"
import { createAppState, loginWithInvite } from "../test-support/app-service-imports"

class FakePostgresStateDatabase implements PostgresStateDatabase {
  private readonly recordedStatements: string[] = []
  private snapshot: string | null = null

  get statements(): readonly string[] {
    return this.recordedStatements
  }

  async query(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<{ readonly rows: readonly { readonly snapshot?: string | null }[] }> {
    this.record(text)
    if (text.includes("SELECT snapshot")) {
      return {
        rows: this.snapshot === null ? [] : [{ snapshot: this.snapshot }],
      }
    }
    if (text.includes("INSERT INTO app_state_snapshots")) {
      const [, rawSnapshot] = values
      this.snapshot = typeof rawSnapshot === "string" ? rawSnapshot : null
      return { rows: [] }
    }
    return { rows: [] }
  }

  private record(text: string): void {
    const compact = text.replace(/\s+/g, " ").trim()
    this.recordedStatements.push(compact)
  }
}

describe("postgres-backed app state", () => {
  it("Given no snapshot When loading Then initializes schema and returns seeded state", async () => {
    const database = new FakePostgresStateDatabase()

    const state = await loadAppStateFromPostgres(database)

    expect(state.invites.size).toBeGreaterThan(0)
    expect(database.statements.some((statement) => statement.includes("CREATE TABLE"))).toBe(true)
    expect(database.statements.some((statement) => statement.includes("SELECT snapshot"))).toBe(
      true,
    )
  })

  it("Given a saved state When loading Then restores users from the database snapshot", async () => {
    const database = new FakePostgresStateDatabase()
    const state = createStateWithLearner()

    await saveAppStateToPostgres(state, database)
    const restored = await loadAppStateFromPostgres(database)

    expect(restored.usersByEmail.get("db-user@gappatch.app")?.timezone).toBe("Asia/Seoul")
  })

  it("Given an empty database and legacy file When loading Then imports the file snapshot", async () => {
    const directory = await mkdtemp(join(tmpdir(), "gappatch-postgres-migration-"))
    const stateFile = join(directory, "state.json")

    try {
      const database = new FakePostgresStateDatabase()
      const state = createStateWithLearner()
      await saveAppStateToFile(state, stateFile)

      const restored = await loadAppStateFromPostgres(database, { migrateFromFile: stateFile })

      expect(restored.usersByEmail.get("db-user@gappatch.app")?.timezone).toBe("Asia/Seoul")
      expect(database.statements.some((statement) => statement.includes("INSERT INTO"))).toBe(true)
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("Given an empty database and missing legacy file When loading Then rejects without writing", async () => {
    const database = new FakePostgresStateDatabase()

    await expect(
      loadAppStateFromPostgres(database, {
        migrateFromFile: "/tmp/gappatch-missing-state.json",
      }),
    ).rejects.toThrow("Legacy app state file is required")
    expect(database.statements.some((statement) => statement.includes("INSERT INTO"))).toBe(false)
  })
})

function createStateWithLearner(): AppState {
  const state = createAppState()
  const login = loginWithInvite(state, {
    email: "db-user@gappatch.app",
    inviteCode: "BETA-AI-0001",
    timezone: "Asia/Seoul",
  })

  if (login.kind !== "ok") {
    throw new Error("expected test learner login to succeed")
  }

  return state
}
