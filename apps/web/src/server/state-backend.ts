import { createHash } from "node:crypto"
import { join } from "node:path"

type StateBackendEnv = {
  readonly DATABASE_URL?: string | undefined
  readonly GAPPATCH_DATA_FILE?: string | undefined
}

export type StateBackendResolutionInput = {
  readonly cwd: string
  readonly env: StateBackendEnv
}

export type StateBackend =
  | {
      readonly filePath: string
      readonly kind: "file"
    }
  | {
      readonly cacheKey: string
      readonly kind: "postgres"
      readonly legacyFilePath?: string | undefined
    }

export function resolveStateBackend(input: StateBackendResolutionInput): StateBackend {
  const databaseUrl = input.env.DATABASE_URL?.trim()
  const dataFile = input.env.GAPPATCH_DATA_FILE?.trim()

  if (databaseUrl) {
    return {
      cacheKey: `postgres:${createHash("sha256").update(databaseUrl).digest("hex").slice(0, 16)}`,
      kind: "postgres",
      legacyFilePath: dataFile || undefined,
    }
  }

  return {
    filePath: dataFile || join(input.cwd, ".gappatch-data/state.json"),
    kind: "file",
  }
}
