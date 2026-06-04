import { z } from "zod"

const supportedTimezoneSchema = z.string().min(1).refine(isSupportedTimezone, {
  message: "Unsupported timezone",
})

export const betaLoginRequestSchema = z.object({
  email: z.string().email(),
  inviteCode: z.string().min(1),
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
})

export type SubmissionRequest = z.infer<typeof submissionRequestSchema>

function isSupportedTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date(0))
    return true
  } catch {
    return false
  }
}
