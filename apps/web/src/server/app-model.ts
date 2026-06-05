import type { SubjectId } from "@gappatch/domain"

export type Difficulty = "foundation" | "working" | "deepening"
export type PerceivedDifficulty = "easy" | "right" | "hard"
export type GradingVerdict = "Stable" | "Partial" | "Needs review"
export type GenerationSource = "approved_problem_pool"
export type AccountRole = "admin" | "learner"
export type ScenarioFrame = "debugging-log" | "architecture-judgment" | "interview-answer"
export type ConceptId =
  | "networking.tcp.layer-ownership"
  | "networking.dns.caching"
  | "ai.overfitting.generalization"

export type InviteCode = {
  readonly code: string
  readonly email?: string | undefined
  readonly role: AccountRole
}

export type User = {
  readonly id: string
  readonly email: string
  readonly role: AccountRole
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
  readonly problemVersionId: string
  readonly rubricVersionId: string
  readonly conceptId: ConceptId
  readonly conceptLabel: string
  readonly scenarioFrame: ScenarioFrame
  readonly scenarioLabel: string
  readonly estimatedDifficulty: Difficulty
  readonly assignmentReason: string
  readonly generationSource: GenerationSource
  readonly realtimeGenerated: boolean
  readonly answerGuidance: string
  readonly title: string
  readonly prompt: string
}

export type Feedback = {
  readonly score: number
  readonly label: GradingVerdict
  readonly summary: string
  readonly strengths: readonly string[]
  readonly missingConcepts: readonly string[]
  readonly misconceptions: readonly string[]
  readonly reviewConcepts: readonly ConceptId[]
  readonly confidence: number
}

export type HistoryItem = {
  readonly assignmentId: string
  readonly problemVersionId: string
  readonly rubricVersionId: string
  readonly title: string
  readonly subjectId: SubjectId
  readonly conceptId: ConceptId
  readonly conceptLabel: string
  readonly scenarioLabel: string
  readonly perceivedDifficulty?: PerceivedDifficulty | undefined
  readonly feedback: Feedback
}

export type ReviewItem = {
  readonly subjectId: SubjectId
  readonly subjectLabel: string
  readonly conceptId: ConceptId
  readonly conceptLabel: string
  readonly label: GradingVerdict
  readonly reason: string
  readonly nextReviewAt: string
  readonly lastScenarioLabel: string
  readonly perceivedDifficulty?: PerceivedDifficulty | undefined
}

export type UserConceptMastery = {
  readonly userId: string
  readonly conceptId: ConceptId
  readonly conceptLabel: string
  readonly stability: number
  readonly lastScore: number
  readonly nextReviewAt: string
  readonly lastMisconception?: string | undefined
  readonly perceivedDifficulty?: PerceivedDifficulty | undefined
}

export type ContentCoverageSlot = {
  readonly slotId: string
  readonly subjectId: SubjectId
  readonly subjectLabel: string
  readonly conceptId: ConceptId
  readonly conceptLabel: string
  readonly scenarioFrame: ScenarioFrame
  readonly scenarioLabel: string
  readonly difficulty: Difficulty
  readonly approvedProblemCount: number
  readonly targetProblemCount: number
}

export type ProblemVersionSummary = {
  readonly id: string
  readonly title: string
  readonly subjectId: SubjectId
  readonly conceptId: ConceptId
  readonly scenarioFrame: ScenarioFrame
  readonly difficulty: Difficulty
  readonly status: "approved"
}

export type GenerationPolicy = {
  readonly realtimePerUserGeneration: boolean
  readonly defaultSource: GenerationSource
  readonly batchGenerationUnit: "content_slot"
}

export type AppState = {
  readonly invites: Map<string, InviteCode>
  readonly usersByEmail: Map<string, User>
  readonly sessionsById: Map<string, Session>
  readonly assignmentsByKey: Map<string, Assignment>
  readonly historyByUserId: Map<string, readonly HistoryItem[]>
  readonly reviewByUserId: Map<string, readonly ReviewItem[]>
  readonly masteryByUserConceptKey: Map<string, UserConceptMastery>
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
  readonly perceivedDifficulty?: string | undefined
}

export type DifficultyFeedbackInput = {
  readonly assignmentId: string
  readonly perceivedDifficulty: PerceivedDifficulty
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

export type DifficultyFeedbackResult =
  | {
      readonly kind: "ok"
      readonly reviewItems: readonly ReviewItem[]
    }
  | ServiceError

export type AdminContentCoverageResult = {
  readonly kind: "ok"
  readonly coverage: readonly ContentCoverageSlot[]
  readonly generationPolicy: GenerationPolicy
  readonly problemVersions: readonly ProblemVersionSummary[]
}

export const subjectLabels: Record<SubjectId, string> = {
  "ai-ml-foundations": "AI/ML",
  "operating-systems": "운영체제",
  "computer-networking": "네트워크",
  "data-math-statistics": "데이터/수학",
  "software-engineering-systems": "시스템 설계",
}
