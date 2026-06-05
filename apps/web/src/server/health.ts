import type { AppState } from "./app-model"

export type HealthSnapshot = {
  readonly checkedAt: string
  readonly ok: true
  readonly runtime: {
    readonly dataFileConfigured: boolean
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

  return {
    checkedAt: checkedAt.toISOString(),
    ok: true,
    runtime: {
      dataFileConfigured: (GAPPATCH_DATA_FILE ?? "").trim().length > 0,
      nodeEnv: NODE_ENV ?? "development",
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

function countStoredItems<TItem>(itemsByOwner: ReadonlyMap<string, readonly TItem[]>): number {
  let count = 0
  for (const items of itemsByOwner.values()) {
    count += items.length
  }
  return count
}
