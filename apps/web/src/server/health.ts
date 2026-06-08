import type { AppState } from "./app-model"

export type HealthReadinessCheck = {
  readonly detail: string
  readonly key: "data_file" | "database" | "grading_provider"
  readonly status: "fail" | "pass"
}

export type HealthSnapshot = {
  readonly checkedAt: string
  readonly ok: true
  readonly readiness: {
    readonly checks: readonly HealthReadinessCheck[]
    readonly ready: boolean
  }
  readonly runtime: {
    readonly databaseConfigured: boolean
    readonly dataFileConfigured: boolean
    readonly gradingProvider: "azure-openai" | "deterministic"
    readonly nodeEnv: string
    readonly stateBackend: "file" | "postgres"
  }
  readonly service: "gappatch-web"
  readonly state: {
    readonly assignments: number
    readonly historyItems: number
    readonly invites: number
    readonly masteryRecords: number
    readonly reviewItems: number
    readonly sessions: number
    readonly users: number
  }
}

export type HealthSnapshotOptions = {
  readonly databaseConnection?: "fail" | "pass" | "unchecked" | undefined
}

export type PublicHealthSnapshot = {
  readonly checkedAt: string
  readonly ok: boolean
  readonly service: "gappatch-web"
}

export function getPublicHealthSnapshot(checkedAt = new Date(), ok = true): PublicHealthSnapshot {
  return {
    checkedAt: checkedAt.toISOString(),
    ok,
    service: "gappatch-web",
  }
}

export function getHealthSnapshot(
  state: AppState,
  checkedAt = new Date(),
  options: HealthSnapshotOptions = {},
): HealthSnapshot {
  const { DATABASE_URL, GAPPATCH_DATA_FILE, NODE_ENV } = process.env
  const nodeEnv = NODE_ENV ?? "development"
  const databaseConfigured = (DATABASE_URL ?? "").trim().length > 0
  const dataFileConfigured = (GAPPATCH_DATA_FILE ?? "").trim().length > 0
  const gradingProvider = configuredGradingProvider()
  const stateBackend = databaseConfigured ? "postgres" : "file"
  const checks = [
    stateBackend === "postgres"
      ? databaseReadinessCheck(databaseConfigured, options.databaseConnection ?? "unchecked")
      : dataFileReadinessCheck(nodeEnv, dataFileConfigured),
    gradingProviderReadinessCheck(gradingProvider),
  ] satisfies readonly HealthReadinessCheck[]

  return {
    checkedAt: checkedAt.toISOString(),
    ok: true,
    readiness: {
      checks,
      ready: checks.every((check) => check.status === "pass"),
    },
    runtime: {
      databaseConfigured,
      dataFileConfigured,
      gradingProvider,
      nodeEnv,
      stateBackend,
    },
    service: "gappatch-web",
    state: {
      assignments: state.assignmentsByKey.size,
      historyItems: countStoredItems(state.historyByUserId),
      invites: state.invites.size,
      masteryRecords: state.masteryByUserConceptKey.size,
      reviewItems: countStoredItems(state.reviewByUserId),
      sessions: state.sessionsById.size,
      users: state.usersByEmail.size,
    },
  }
}

function configuredGradingProvider(): "azure-openai" | "deterministic" {
  const { GAPPATCH_GRADING_PROVIDER: rawProvider } = process.env
  return rawProvider?.trim() === "azure-openai" ? "azure-openai" : "deterministic"
}

function databaseReadinessCheck(
  databaseConfigured: boolean,
  databaseConnection: NonNullable<HealthSnapshotOptions["databaseConnection"]>,
): HealthReadinessCheck {
  if (!databaseConfigured) {
    return {
      detail: "Set DATABASE_URL before running Postgres-backed production traffic.",
      key: "database",
      status: "fail",
    }
  }
  if (databaseConnection === "fail") {
    return {
      detail: "Postgres connection check failed.",
      key: "database",
      status: "fail",
    }
  }
  if (databaseConnection === "pass") {
    return {
      detail: "Postgres connection check passed.",
      key: "database",
      status: "pass",
    }
  }
  return {
    detail: "DATABASE_URL is configured.",
    key: "database",
    status: "pass",
  }
}

function dataFileReadinessCheck(
  nodeEnv: string,
  dataFileConfigured: boolean,
): HealthReadinessCheck {
  if (nodeEnv === "production" && !dataFileConfigured) {
    return {
      detail: "Set GAPPATCH_DATA_FILE before running production traffic.",
      key: "data_file",
      status: "fail",
    }
  }

  return {
    detail: dataFileConfigured
      ? "GAPPATCH_DATA_FILE is configured."
      : "Using the development fallback data file.",
    key: "data_file",
    status: "pass",
  }
}

function gradingProviderReadinessCheck(
  gradingProvider: HealthSnapshot["runtime"]["gradingProvider"],
): HealthReadinessCheck {
  return {
    detail:
      gradingProvider === "azure-openai"
        ? "Azure OpenAI grading is configured."
        : "Deterministic grading is active.",
    key: "grading_provider",
    status: "pass",
  }
}

function countStoredItems<TItem>(itemsByOwner: ReadonlyMap<string, readonly TItem[]>): number {
  let count = 0
  for (const items of itemsByOwner.values()) {
    count += items.length
  }
  return count
}
