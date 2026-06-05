import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import type {
  AppState,
  Assignment,
  HistoryItem,
  ReviewItem,
  Session,
  User,
  UserConceptMastery,
} from "./app-model"
import { createAppState } from "./app-services"
import { approvedProblemsForSubjects, problemById } from "./problem-bank"

const globalForGapPatch = globalThis as typeof globalThis & {
  __gappatchState?: AppState
  __gappatchStateFile?: string
}

type PersistedAppState = {
  readonly invites: readonly string[]
  readonly users: readonly User[]
  readonly sessions: readonly Session[]
  readonly assignments: readonly Assignment[]
  readonly history: readonly (readonly [string, readonly HistoryItem[]])[]
  readonly review: readonly (readonly [string, readonly ReviewItem[]])[]
  readonly mastery?: readonly UserConceptMastery[]
}

export async function getAppState(): Promise<AppState> {
  const filePath = appStateFilePath()
  const existing = globalForGapPatch.__gappatchState
  if (existing && globalForGapPatch.__gappatchStateFile === filePath) {
    return existing
  }

  const state = await loadAppStateFromFile(filePath)
  globalForGapPatch.__gappatchState = state
  globalForGapPatch.__gappatchStateFile = filePath
  return state
}

export async function persistAppState(state: AppState): Promise<void> {
  await saveAppStateToFile(state, appStateFilePath())
}

export async function loadAppStateFromFile(filePath: string): Promise<AppState> {
  try {
    const raw = await readFile(filePath, "utf8")
    return hydrateAppState(JSON.parse(raw) as PersistedAppState)
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return createAppState()
    }
    throw error
  }
}

export async function saveAppStateToFile(state: AppState, filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(serializeAppState(state), null, 2)}\n`)
}

export function serializeAppState(state: AppState): PersistedAppState {
  return {
    invites: [...state.invites],
    users: [...state.usersByEmail.values()],
    sessions: [...state.sessionsById.values()],
    assignments: [...state.assignmentsByKey.values()],
    history: [...state.historyByUserId.entries()],
    mastery: [...state.masteryByUserConceptKey.values()],
    review: [...state.reviewByUserId.entries()],
  }
}

export function hydrateAppState(persisted: PersistedAppState): AppState {
  const state = createAppState()
  state.invites.clear()
  for (const invite of persisted.invites) {
    state.invites.add(invite)
  }
  for (const user of persisted.users) {
    state.usersByEmail.set(user.email, user)
  }
  for (const session of persisted.sessions) {
    state.sessionsById.set(session.id, session)
  }
  for (const assignment of persisted.assignments) {
    const normalized = normalizeAssignment(assignment)
    state.assignmentsByKey.set(`${normalized.userId}:${normalized.localDate}`, normalized)
  }
  for (const [userId, history] of persisted.history) {
    state.historyByUserId.set(userId, history)
  }
  for (const [userId, review] of persisted.review) {
    state.reviewByUserId.set(userId, review)
  }
  for (const mastery of persisted.mastery ?? []) {
    state.masteryByUserConceptKey.set(`${mastery.userId}:${mastery.conceptId}`, mastery)
  }
  return state
}

function normalizeAssignment(assignment: Assignment): Assignment {
  const existingProblem = assignment.problemVersionId
    ? problemById(assignment.problemVersionId)
    : null
  const fallbackProblem = existingProblem ?? approvedProblemsForSubjects([assignment.subjectId])[0]
  if (!fallbackProblem) {
    return assignment
  }
  if (existingProblem) {
    return assignment
  }

  return {
    ...assignment,
    answerGuidance: fallbackProblem.answerGuidance,
    assignmentReason: fallbackProblem.assignmentReason,
    conceptId: fallbackProblem.conceptId,
    conceptLabel: fallbackProblem.conceptLabel,
    estimatedDifficulty: fallbackProblem.difficulty,
    generationSource: fallbackProblem.generationSource,
    problemVersionId: fallbackProblem.id,
    prompt: fallbackProblem.prompt,
    realtimeGenerated: false,
    rubricVersionId: fallbackProblem.rubricVersionId,
    scenarioFrame: fallbackProblem.scenarioFrame,
    scenarioLabel: fallbackProblem.scenarioLabel,
    subjectId: fallbackProblem.subjectId,
    title: fallbackProblem.title,
  }
}

function appStateFilePath(): string {
  const env = process.env as { readonly GAPPATCH_DATA_FILE?: string }
  return env.GAPPATCH_DATA_FILE ?? join(process.cwd(), ".gappatch-data/state.json")
}

function isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT"
}
