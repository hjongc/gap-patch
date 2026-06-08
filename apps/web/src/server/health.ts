import type { AppState } from "./app-model"

export type HealthReadinessCheck = {
  readonly detail: string
  readonly key: "data_file" | "grading_provider"
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
    readonly dataFileConfigured: boolean
    readonly gradingProvider: "azure-openai" | "deterministic"
    readonly nodeEnv: string
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

export type PublicHealthSnapshot = {
  readonly checkedAt: string
  readonly ok: true
  readonly service: "gappatch-web"
}

export function getPublicHealthSnapshot(checkedAt = new Date()): PublicHealthSnapshot {
  return {
    checkedAt: checkedAt.toISOString(),
    ok: true,
    service: "gappatch-web",
  }
}

export function getHealthSnapshot(state: AppState, checkedAt = new Date()): HealthSnapshot {
  const { GAPPATCH_DATA_FILE, NODE_ENV } = process.env
  const nodeEnv = NODE_ENV ?? "development"
  const dataFileConfigured = (GAPPATCH_DATA_FILE ?? "").trim().length > 0
  const gradingProvider = configuredGradingProvider()
  const checks = [
    dataFileReadinessCheck(nodeEnv, dataFileConfigured),
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
      dataFileConfigured,
      gradingProvider,
      nodeEnv,
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
