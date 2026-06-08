import { access } from "node:fs/promises"

import type { AppState } from "./app-model"
import { createAppState } from "./app-services"
import {
  hydrateAppState,
  loadAppStateFromFile,
  type PersistedAppState,
  serializeAppState,
} from "./state"

export type PostgresStateRow = {
  readonly snapshot?: string | null
}

export type PostgresQueryResult = {
  readonly rows: readonly PostgresStateRow[]
}

export type PostgresStateDatabase = {
  query(text: string, values?: readonly unknown[]): Promise<PostgresQueryResult>
}

export type PostgresStateLoadOptions = {
  readonly migrateFromFile?: string | undefined
}

const appStateSnapshotId = "app"

export async function loadAppStateFromPostgres(
  database: PostgresStateDatabase,
  options: PostgresStateLoadOptions = {},
): Promise<AppState> {
  await ensurePostgresStateSchema(database)
  const result = await database.query(
    "SELECT snapshot::text AS snapshot FROM app_state_snapshots WHERE id = $1",
    [appStateSnapshotId],
  )
  const snapshot = result.rows[0]?.snapshot

  if (snapshot) {
    return hydrateAppState(JSON.parse(snapshot) as PersistedAppState)
  }
  if (options.migrateFromFile) {
    await requireLegacyStateFile(options.migrateFromFile)
    const migrated = await loadAppStateFromFile(options.migrateFromFile)
    await saveAppStateToPostgres(migrated, database)
    return migrated
  }
  return createAppState()
}

export async function saveAppStateToPostgres(
  state: AppState,
  database: PostgresStateDatabase,
): Promise<void> {
  await ensurePostgresStateSchema(database)
  await database.query(
    `
      INSERT INTO app_state_snapshots (id, snapshot, updated_at)
      VALUES ($1, $2::jsonb, now())
      ON CONFLICT (id)
      DO UPDATE SET snapshot = EXCLUDED.snapshot, updated_at = now()
    `,
    [appStateSnapshotId, JSON.stringify(serializeAppState(state))],
  )
}

async function ensurePostgresStateSchema(database: PostgresStateDatabase): Promise<void> {
  await database.query(`
    CREATE TABLE IF NOT EXISTS app_state_snapshots (
      id text PRIMARY KEY,
      snapshot jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
}

async function requireLegacyStateFile(filePath: string): Promise<void> {
  try {
    await access(filePath)
  } catch (caught) {
    if (isFileNotFoundError(caught)) {
      throw new Error(`Legacy app state file is required before Postgres migration: ${filePath}`)
    }
    throw caught
  }
}

function isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT"
}
