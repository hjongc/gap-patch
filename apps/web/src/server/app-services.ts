import { randomBytes } from "node:crypto"
import { subjectIds } from "@gappatch/domain"
import type {
  AppState,
  Assignment,
  AssignmentResult,
  Feedback,
  HistoryItem,
  HistoryResult,
  LoginInput,
  LoginResult,
  ReviewItem,
  ReviewResult,
  SubjectSelectionInput,
  SubjectSelectionResult,
  SubmissionInput,
  SubmissionResult,
  User,
} from "./app-model"
import { subjectLabels } from "./app-model"

const sessionTtlMs = 1000 * 60 * 60 * 24 * 30

export function createAppState(): AppState {
  return {
    invites: new Set(["BETA-AI-0001"]),
    usersByEmail: new Map(),
    sessionsById: new Map(),
    assignmentsByKey: new Map(),
    historyByUserId: new Map(),
    reviewByUserId: new Map(),
  }
}

export function loginWithInvite(state: AppState, input: LoginInput): LoginResult {
  if (!state.invites.has(input.inviteCode)) {
    return { kind: "error", code: "invalid_invite", status: 401 }
  }

  const existing = state.usersByEmail.get(input.email)
  const user =
    existing ??
    ({
      id: `user-${state.usersByEmail.size + 1}`,
      email: input.email,
      timezone: input.timezone,
      selectedSubjects: subjectIds,
      difficulty: "foundation",
    } satisfies User)
  const currentUser = existing ? { ...user, timezone: input.timezone } : user

  state.usersByEmail.set(input.email, currentUser)

  const sessionId = createSessionId()
  state.sessionsById.set(sessionId, {
    id: sessionId,
    userId: currentUser.id,
    expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(),
  })

  return { kind: "ok", sessionId, user: currentUser }
}

export function createSessionId(): string {
  return `sess_${randomBytes(32).toString("base64url")}`
}

export function updateSubjectSelection(
  state: AppState,
  sessionId: string,
  input: SubjectSelectionInput,
): SubjectSelectionResult {
  const user = userForSession(state, sessionId)
  if (!user) {
    return { kind: "error", code: "unauthorized", status: 401 }
  }

  const updated = { ...user, selectedSubjects: input.subjects, difficulty: input.difficulty }
  state.usersByEmail.set(user.email, updated)
  return { kind: "ok", subjects: updated.selectedSubjects, difficulty: updated.difficulty }
}

export function createDailyAssignment(
  state: AppState,
  sessionId: string,
  localDate: string,
): AssignmentResult {
  const user = userForSession(state, sessionId)
  if (!user) {
    return { kind: "error", code: "unauthorized", status: 401 }
  }

  const key = `${user.id}:${localDate}`
  const existing = state.assignmentsByKey.get(key)
  if (existing) {
    return { kind: "ok", assignment: existing }
  }

  const subjectId = user.selectedSubjects.includes("computer-networking")
    ? "computer-networking"
    : (user.selectedSubjects[0] ?? "computer-networking")
  const assignment = {
    id: `assignment-${user.id}-${localDate}`,
    userId: user.id,
    localDate,
    subjectId,
    title: "TCP retransmission ownership",
    prompt: "When packet loss occurs, which layer is primarily responsible for TCP retransmission?",
  } satisfies Assignment

  state.assignmentsByKey.set(key, assignment)
  return { kind: "ok", assignment }
}

export function localDateForSession(
  state: AppState,
  sessionId: string,
  now = new Date(),
): string | null {
  const user = userForSession(state, sessionId)
  return user ? localDateForTimezone(user.timezone, now) : null
}

export function localDateForTimezone(timezone: string, now = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: timezone,
    year: "numeric",
  })
  const parts = formatter.formatToParts(now)
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value

  if (!year || !month || !day) {
    throw new Error(`Could not compute local date for timezone ${timezone}`)
  }
  return `${year}-${month}-${day}`
}

export function submitAnswer(
  state: AppState,
  sessionId: string,
  input: SubmissionInput,
): SubmissionResult {
  const user = userForSession(state, sessionId)
  if (!user || input.assignmentId.length === 0 || input.answer.trim().length === 0) {
    return { kind: "error", code: "invalid_submission", status: 400 }
  }

  const assignment = assignmentForUser(state, user.id, input.assignmentId)
  if (!assignment) {
    return { kind: "error", code: "invalid_submission", status: 400 }
  }

  const answer = input.answer.toLowerCase()
  const isStrong = answer.includes("transport") && answer.includes("tcp")
  const feedback = {
    score: isStrong && !answer.includes("application layer") ? 1 : 0.4,
    label: isStrong && !answer.includes("application layer") ? "Stable" : "Needs review",
    summary: "TCP retransmission is handled by TCP at the transport layer; review layer ownership.",
  } satisfies Feedback

  const history = [
    ...(state.historyByUserId.get(user.id) ?? []),
    {
      assignmentId: assignment.id,
      title: assignment.title,
      subjectId: assignment.subjectId,
      feedback,
    },
  ] satisfies readonly HistoryItem[]

  const reviewItems = [
    {
      subjectId: assignment.subjectId,
      subjectLabel: subjectLabels[assignment.subjectId],
      label: feedback.label,
      reason: feedback.summary,
    },
  ] satisfies readonly ReviewItem[]

  state.historyByUserId.set(user.id, history)
  state.reviewByUserId.set(user.id, reviewItems)
  return { kind: "ok", feedback, history, reviewItems }
}

export function getHistory(state: AppState, sessionId: string): HistoryResult {
  const user = userForSession(state, sessionId)
  if (!user) {
    return { kind: "error", code: "unauthorized", status: 401 }
  }

  return { kind: "ok", history: state.historyByUserId.get(user.id) ?? [] }
}

export function getReview(state: AppState, sessionId: string): ReviewResult {
  const user = userForSession(state, sessionId)
  if (!user) {
    return { kind: "error", code: "unauthorized", status: 401 }
  }

  return { kind: "ok", reviewItems: state.reviewByUserId.get(user.id) ?? [] }
}

function userForSession(state: AppState, sessionId: string): User | null {
  const session = state.sessionsById.get(sessionId)
  if (!session) {
    return null
  }
  const expiresAt = Date.parse(session.expiresAt)
  if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
    state.sessionsById.delete(sessionId)
    return null
  }

  for (const user of state.usersByEmail.values()) {
    if (user.id === session.userId) {
      return user
    }
  }
  return null
}

function assignmentForUser(
  state: AppState,
  userId: string,
  assignmentId: string,
): Assignment | null {
  for (const assignment of state.assignmentsByKey.values()) {
    if (assignment.userId === userId && assignment.id === assignmentId) {
      return assignment
    }
  }
  return null
}
