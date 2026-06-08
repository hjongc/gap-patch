import { z } from "zod"

const supportedTimezoneSchema = z.string().min(1).refine(isSupportedTimezone, {
  message: "Unsupported timezone",
})

const temporaryUserIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .regex(/^\d+$/, { message: "Use numbers only" })

export const betaLoginRequestSchema = z.object({
  temporaryUserId: temporaryUserIdSchema,
  timezone: supportedTimezoneSchema.default("Asia/Seoul"),
})

export type BetaLoginRequest = z.infer<typeof betaLoginRequestSchema>

export const subjectSelectionRequestSchema = z.object({
  subjects: z
    .array(
      z.enum([
        "ai-ml-foundations",
        "operating-systems",
        "computer-networking",
        "data-math-statistics",
        "software-engineering-systems",
      ]),
    )
    .min(1),
  difficulty: z.enum(["foundation", "working", "deepening"]),
})

export type SubjectSelectionRequest = z.infer<typeof subjectSelectionRequestSchema>

export const submissionRequestSchema = z.object({
  assignmentId: z.string().min(1),
  answer: z.string().min(1),
  perceivedDifficulty: z.enum(["easy", "right", "hard"]).optional(),
})

export type SubmissionRequest = z.infer<typeof submissionRequestSchema>

export const difficultyFeedbackRequestSchema = z.object({
  assignmentId: z.string().min(1),
  perceivedDifficulty: z.enum(["easy", "right", "hard"]),
})

export type DifficultyFeedbackRequest = z.infer<typeof difficultyFeedbackRequestSchema>

function isSupportedTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date(0))
    return true
  } catch {
    return false
  }
}
