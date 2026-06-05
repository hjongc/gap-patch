import { randomBytes } from "node:crypto"
import type { AppState, Assignment, User } from "./app-model"

export function createSessionId(): string {
  return `sess_${randomBytes(32).toString("base64url")}`
}

export function userForSession(state: AppState, sessionId: string): User | null {
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

export function assignmentForUser(
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
