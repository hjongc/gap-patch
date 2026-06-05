import { subjectIds } from "@gappatch/domain"
import type {
  AdminContentCoverageResult,
  AppState,
  Assignment,
  AssignmentResult,
  DifficultyFeedbackInput,
  DifficultyFeedbackResult,
  HistoryResult,
  LoginInput,
  LoginResult,
  ReviewResult,
  SubjectSelectionInput,
  SubjectSelectionResult,
  SubmissionInput,
  SubmissionResult,
  User,
} from "./app-model"
import { selectDailyProblem } from "./assignment-selection"
import { deterministicGradingProvider, type GradingProvider } from "./grading"
import { reviewItemsForUser, updateMastery } from "./mastery"
import {
  coverageSlots,
  generationPolicy,
  problemVersionSummaries,
  refreshAssignmentFromProblemBank,
} from "./problem-bank"
import { inviteMatchesEmail, seedInvites } from "./seed-invites"
import { assignmentForUser, createSessionId, userForSession } from "./session-state"
import { submitAnswerSync } from "./submission-service"

const sessionTtlMs = 1000 * 60 * 60 * 24 * 30

export function createAppState(): AppState {
  return {
    invites: seedInvites(),
    usersByEmail: new Map(),
    sessionsById: new Map(),
    assignmentsByKey: new Map(),
    historyByUserId: new Map(),
    reviewByUserId: new Map(),
    masteryByUserConceptKey: new Map(),
  }
}

export function loginWithInvite(state: AppState, input: LoginInput): LoginResult {
  const invite = state.invites.get(input.inviteCode)
  if (!invite || !inviteMatchesEmail(invite, input.email)) {
    return { kind: "error", code: "invalid_invite", status: 401 }
  }

  const existing = state.usersByEmail.get(input.email)
  const user =
    existing ??
    ({
      id: `user-${state.usersByEmail.size + 1}`,
      email: input.email,
      role: invite.role,
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
    const refreshed = refreshAssignmentFromProblemBank(existing)
    state.assignmentsByKey.set(key, refreshed)
    return { kind: "ok", assignment: refreshed }
  }

  const selectedProblem = selectDailyProblem(state, user)
  if (!selectedProblem) {
    return { kind: "error", code: "invalid_submission", status: 400 }
  }
  const assignment = {
    id: `assignment-${user.id}-${localDate}`,
    answerGuidance: selectedProblem.answerGuidance,
    assignmentReason: selectedProblem.assignmentReason,
    conceptId: selectedProblem.conceptId,
    conceptLabel: selectedProblem.conceptLabel,
    estimatedDifficulty: selectedProblem.difficulty,
    generationSource: selectedProblem.generationSource,
    localDate,
    problemVersionId: selectedProblem.id,
    prompt: selectedProblem.prompt,
    realtimeGenerated: false,
    rubricVersionId: selectedProblem.rubricVersionId,
    scenarioFrame: selectedProblem.scenarioFrame,
    scenarioLabel: selectedProblem.scenarioLabel,
    subjectId: selectedProblem.subjectId,
    title: selectedProblem.title,
    userId: user.id,
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
  gradingProvider: GradingProvider = deterministicGradingProvider,
  now = new Date(),
): SubmissionResult {
  return submitAnswerSync(state, sessionId, input, gradingProvider, now)
}

export function updateDifficultyFeedback(
  state: AppState,
  sessionId: string,
  input: DifficultyFeedbackInput,
): DifficultyFeedbackResult {
  const user = userForSession(state, sessionId)
  if (!user || input.assignmentId.length === 0) {
    return { kind: "error", code: "invalid_submission", status: 400 }
  }

  const assignment = assignmentForUser(state, user.id, input.assignmentId)
  const history = state.historyByUserId.get(user.id) ?? []
  const existingHistory = history.find((item) => item.assignmentId === input.assignmentId)
  if (!assignment || !existingHistory) {
    return { kind: "error", code: "invalid_submission", status: 400 }
  }

  const updatedHistory = history.map((item) =>
    item.assignmentId === input.assignmentId
      ? { ...item, perceivedDifficulty: input.perceivedDifficulty }
      : item,
  )
  updateMastery(state, user.id, assignment, existingHistory.feedback, input.perceivedDifficulty)
  const reviewItems = reviewItemsForUser(state, user.id)
  state.historyByUserId.set(user.id, updatedHistory)
  state.reviewByUserId.set(user.id, reviewItems)
  return { kind: "ok", reviewItems }
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

export function getAdminContentCoverage(_state: AppState): AdminContentCoverageResult {
  return {
    coverage: coverageSlots(),
    generationPolicy,
    kind: "ok",
    problemVersions: problemVersionSummaries(),
  }
}
