import type { SubjectId } from "@gappatch/domain"

export type Assignment = {
  readonly id: string
  readonly subjectId: SubjectId
  readonly problemVersionId: string
  readonly rubricVersionId: string
  readonly conceptLabel: string
  readonly scenarioLabel: string
  readonly estimatedDifficulty: string
  readonly assignmentReason: string
  readonly generationSource: string
  readonly answerGuidance: string
  readonly title: string
  readonly prompt: string
}

export type TodayResponse = {
  readonly ok: boolean
  readonly assignment: Assignment
}

export type SubmissionResponse = {
  readonly ok: boolean
  readonly feedback: {
    readonly label: string
    readonly summary: string
    readonly strengths: readonly string[]
    readonly missingConcepts: readonly string[]
    readonly misconceptions: readonly string[]
    readonly reviewConcepts: readonly string[]
  }
}

export const assignmentSubjectLabels: Record<SubjectId, string> = {
  "ai-ml-foundations": "AI/ML",
  "computer-networking": "Network",
  "data-math-statistics": "Data/Math",
  "operating-systems": "OS",
  "software-engineering-systems": "Systems",
}

export const difficultyOptions = [
  { label: "쉬움", value: "easy" },
  { label: "적당함", value: "right" },
  { label: "어려움", value: "hard" },
] as const

export type DifficultyOptionValue = (typeof difficultyOptions)[number]["value"]
