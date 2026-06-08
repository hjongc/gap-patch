import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import type {
  AccountRole,
  AppState,
  Assignment,
  HistoryItem,
  InviteCode,
  ReviewItem,
  Session,
  User,
  UserConceptMastery,
} from "./app-model"
import { subjectLabels } from "./app-model"
import { createAppState } from "./app-services"
import {
  applyProblemVersionToAssignment,
  approvedProblemsForSubjects,
  problemByConceptId,
  problemById,
} from "./problem-bank"
import { shouldKeepPersistedInvite } from "./seed-invites"

const globalForGapPatch = globalThis as typeof globalThis & {
  __gappatchState?: AppState
  __gappatchStateFile?: string
}

type PersistedInviteCode = string | InviteCode
type PersistedUser = Omit<User, "role"> & {
  readonly role?: AccountRole | undefined
}

type PersistedAppState = {
  readonly invites: readonly PersistedInviteCode[]
  readonly users: readonly PersistedUser[]
  readonly sessions: readonly Session[]
  readonly assignments: readonly Assignment[]
  readonly history?: readonly (readonly [string, readonly HistoryItem[]])[] | undefined
  readonly mastery?: readonly UserConceptMastery[]
  readonly review?: readonly (readonly [string, readonly ReviewItem[]])[] | undefined
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
    invites: [...state.invites.values()],
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
  for (const invite of persisted.invites) {
    const normalized = normalizeInvite(invite)
    if (shouldKeepPersistedInvite(normalized)) {
      state.invites.set(normalized.code, normalized)
    }
  }
  for (const user of persisted.users) {
    const normalized = normalizeUser(user)
    state.usersByEmail.set(normalized.email, normalized)
  }
  for (const session of persisted.sessions) {
    state.sessionsById.set(session.id, session)
  }
  for (const assignment of persisted.assignments) {
    const normalized = normalizeAssignment(assignment)
    state.assignmentsByKey.set(`${normalized.userId}:${normalized.localDate}`, normalized)
  }
  for (const [userId, history] of persisted.history ?? []) {
    state.historyByUserId.set(userId, history.map(normalizeHistoryItem))
  }
  for (const [userId, review] of persisted.review ?? []) {
    state.reviewByUserId.set(userId, review.map(normalizeReviewItem))
  }
  for (const mastery of persisted.mastery ?? []) {
    const normalized = normalizeMastery(mastery)
    state.masteryByUserConceptKey.set(`${normalized.userId}:${normalized.conceptId}`, normalized)
  }
  return state
}

function normalizeInvite(invite: PersistedInviteCode): InviteCode {
  if (typeof invite === "string") {
    return {
      code: invite,
      role: "learner",
    }
  }
  return invite
}

function normalizeUser(user: PersistedUser): User {
  return {
    ...user,
    role: user.role ?? "learner",
  }
}

function normalizeAssignment(assignment: Assignment): Assignment {
  const existingProblem = assignment.problemVersionId
    ? problemById(assignment.problemVersionId)
    : null
  const fallbackProblem = existingProblem ?? approvedProblemsForSubjects([assignment.subjectId])[0]
  if (!fallbackProblem) {
    return assignment
  }
  return applyProblemVersionToAssignment(assignment, fallbackProblem)
}

function normalizeHistoryItem(historyItem: HistoryItem): HistoryItem {
  const problem = problemById(historyItem.problemVersionId)
  if (!problem) {
    return historyItem
  }

  return {
    ...historyItem,
    conceptId: problem.conceptId,
    conceptLabel: problem.conceptLabel,
    rubricVersionId: problem.rubricVersionId,
    scenarioLabel: problem.scenarioLabel,
    subjectId: problem.subjectId,
    title: problem.title,
  }
}

function normalizeReviewItem(reviewItem: ReviewItem): ReviewItem {
  const problem = problemByConceptId(reviewItem.conceptId)
  if (!problem) {
    return reviewItem
  }

  return {
    ...reviewItem,
    conceptLabel: problem.conceptLabel,
    lastScenarioLabel: problem.scenarioLabel,
    reason: normalizeReviewReason(reviewItem.reason, problem.conceptId),
    subjectId: problem.subjectId,
    subjectLabel: subjectLabels[problem.subjectId],
  }
}

function normalizeMastery(mastery: UserConceptMastery): UserConceptMastery {
  const problem = problemByConceptId(mastery.conceptId)
  return problem ? { ...mastery, conceptLabel: problem.conceptLabel } : mastery
}

function normalizeReviewReason(reason: string, conceptId: Assignment["conceptId"]): string {
  const normalized = reason.toLowerCase()
  if (
    conceptId === "networking.tcp.layer-ownership" &&
    (normalized.includes("application layer") ||
      normalized.includes("tcp retransmission") ||
      normalized.includes("review this concept"))
  ) {
    return "TCP 재전송과 애플리케이션 재시도 정책을 다시 구분해 보세요."
  }

  if (normalized.includes("review this concept")) {
    return "다른 상황으로 이 개념을 다시 확인해 보세요."
  }

  return reason
}

function appStateFilePath(): string {
  const env = process.env as { readonly GAPPATCH_DATA_FILE?: string }
  return env.GAPPATCH_DATA_FILE ?? join(process.cwd(), ".gappatch-data/state.json")
}

function isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT"
}
