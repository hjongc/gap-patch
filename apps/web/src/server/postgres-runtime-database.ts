import { Pool, type PoolConfig } from "pg"

import type { PostgresQueryResult, PostgresStateDatabase } from "./postgres-state-store"

const defaultPoolMax = 5
const defaultIdleTimeoutMs = 30_000
const defaultConnectionTimeoutMs = 5_000

const globalForGapPatchPostgres = globalThis as typeof globalThis & {
  __gappatchPostgresPool?: Pool
  __gappatchPostgresUrl?: string
}

export function getPostgresStateDatabase(): PostgresStateDatabase {
  const databaseUrl = requireDatabaseUrl()
  const pool = getPostgresPool(databaseUrl)
  return {
    async query(text, values = []): Promise<PostgresQueryResult> {
      const result = await pool.query(text, [...values])
      return { rows: result.rows }
    },
  }
}

export async function checkPostgresConnection(): Promise<boolean> {
  const databaseUrl = requireDatabaseUrl()
  const pool = getPostgresPool(databaseUrl)
  try {
    await pool.query("SELECT 1")
    return true
  } catch (caught) {
    if (caught instanceof Error) {
      return false
    }
    throw caught
  }
}

export function createPostgresPoolConfig(databaseUrl: string): PoolConfig {
  return {
    connectionString: databaseUrl,
    connectionTimeoutMillis: defaultConnectionTimeoutMs,
    idleTimeoutMillis: defaultIdleTimeoutMs,
    max: defaultPoolMax,
  }
}

function getPostgresPool(databaseUrl: string): Pool {
  const existing = globalForGapPatchPostgres.__gappatchPostgresPool
  if (existing && globalForGapPatchPostgres.__gappatchPostgresUrl === databaseUrl) {
    return existing
  }

  const pool = new Pool(createPostgresPoolConfig(databaseUrl))
  globalForGapPatchPostgres.__gappatchPostgresPool = pool
  globalForGapPatchPostgres.__gappatchPostgresUrl = databaseUrl
  return pool
}

function requireDatabaseUrl(): string {
  const { DATABASE_URL } = process.env
  const databaseUrl = DATABASE_URL?.trim()
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Postgres-backed state")
  }
  return databaseUrl
}
