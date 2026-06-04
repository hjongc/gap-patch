import type { SubjectId } from "@gappatch/domain"

export type Difficulty = "foundation" | "working" | "deepening"

export type User = {
  readonly id: string
  readonly email: string
  readonly timezone: string
  readonly selectedSubjects: readonly SubjectId[]
  readonly difficulty: Difficulty
}

export type Session = {
  readonly id: string
  readonly userId: string
  readonly expiresAt: string
}

export type Assignment = {
  readonly id: string
  readonly userId: string
  readonly localDate: string
  readonly subjectId: SubjectId
  readonly title: string
  readonly prompt: string
}

export type Feedback = {
  readonly score: number
  readonly label: "Stable" | "Needs review"
  readonly summary: string
}

export type HistoryItem = {
  readonly assignmentId: string
  readonly title: string
  readonly subjectId: SubjectId
  readonly feedback: Feedback
}

export type ReviewItem = {
  readonly subjectId: SubjectId
  readonly subjectLabel: string
  readonly label: "Needs review" | "Stable"
  readonly reason: string
}

export type AppState = {
  readonly invites: Set<string>
  readonly usersByEmail: Map<string, User>
  readonly sessionsById: Map<string, Session>
  readonly assignmentsByKey: Map<string, Assignment>
  readonly historyByUserId: Map<string, readonly HistoryItem[]>
  readonly reviewByUserId: Map<string, readonly ReviewItem[]>
}

export type LoginInput = {
  readonly email: string
  readonly inviteCode: string
  readonly timezone: string
}

export type SubjectSelectionInput = {
  readonly subjects: readonly SubjectId[]
  readonly difficulty: Difficulty
}

export type SubmissionInput = {
  readonly assignmentId: string
  readonly answer: string
}

export type ServiceErrorCode = "invalid_invite" | "unauthorized" | "invalid_submission"

export type ServiceError = {
  readonly kind: "error"
  readonly code: ServiceErrorCode
  readonly status: 400 | 401
}

export type LoginResult =
  | {
      readonly kind: "ok"
      readonly sessionId: string
      readonly user: User
    }
  | ServiceError

export type SubjectSelectionResult =
  | {
      readonly kind: "ok"
      readonly subjects: readonly SubjectId[]
      readonly difficulty: Difficulty
    }
  | ServiceError

export type AssignmentResult =
  | {
      readonly kind: "ok"
      readonly assignment: Assignment
    }
  | ServiceError

export type SubmissionResult =
  | {
      readonly kind: "ok"
      readonly feedback: Feedback
      readonly history: readonly HistoryItem[]
      readonly reviewItems: readonly ReviewItem[]
    }
  | ServiceError

export type HistoryResult =
  | {
      readonly kind: "ok"
      readonly history: readonly HistoryItem[]
    }
  | ServiceError

export type ReviewResult =
  | {
      readonly kind: "ok"
      readonly reviewItems: readonly ReviewItem[]
    }
  | ServiceError

export const subjectLabels: Record<SubjectId, string> = {
  "ai-ml-foundations": "AI/ML Foundations",
  "operating-systems": "Operating Systems",
  "computer-networking": "Computer Networking",
  "data-math-statistics": "Data, Math, Statistics",
  "software-engineering-systems": "Software Engineering Systems",
}
