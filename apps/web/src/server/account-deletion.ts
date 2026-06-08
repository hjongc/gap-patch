import type { AccountDeletionCounts, AccountDeletionResult, AppState } from "./app-model"
import { userForSession } from "./session-state"

export function deleteAccount(state: AppState, sessionId: string): AccountDeletionResult {
  const user = userForSession(state, sessionId)
  if (!user) {
    return { kind: "error", code: "unauthorized", status: 401 }
  }

  const deleted = {
    assignments: deleteAssignmentsForUser(state, user.id),
    historyItems: state.historyByUserId.get(user.id)?.length ?? 0,
    masteryRecords: deleteMasteryForUser(state, user.id),
    reviewItems: state.reviewByUserId.get(user.id)?.length ?? 0,
    sessions: deleteSessionsForUser(state, user.id),
  } satisfies AccountDeletionCounts

  state.historyByUserId.delete(user.id)
  state.reviewByUserId.delete(user.id)
  state.usersByEmail.delete(user.email)

  return { kind: "ok", deleted }
}

function deleteAssignmentsForUser(state: AppState, userId: string): number {
  let deleted = 0
  for (const [key, assignment] of state.assignmentsByKey.entries()) {
    if (assignment.userId === userId) {
      state.assignmentsByKey.delete(key)
      deleted += 1
    }
  }
  return deleted
}

function deleteMasteryForUser(state: AppState, userId: string): number {
  let deleted = 0
  for (const [key, mastery] of state.masteryByUserConceptKey.entries()) {
    if (mastery.userId === userId) {
      state.masteryByUserConceptKey.delete(key)
      deleted += 1
    }
  }
  return deleted
}

function deleteSessionsForUser(state: AppState, userId: string): number {
  let deleted = 0
  for (const [key, session] of state.sessionsById.entries()) {
    if (session.userId === userId) {
      state.sessionsById.delete(key)
      deleted += 1
    }
  }
  return deleted
}
