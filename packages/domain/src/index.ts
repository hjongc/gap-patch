export const subjectIds = [
  "ai-ml-foundations",
  "operating-systems",
  "computer-networking",
  "data-math-statistics",
  "software-engineering-systems",
] as const

export type SubjectId = (typeof subjectIds)[number]

export type PracticeProblem = {
  readonly id: string
  readonly subjectId: SubjectId
  readonly title: string
  readonly prompt: string
  readonly answerFormat: "multiple_choice" | "short_text" | "long_text" | "code_text"
}
