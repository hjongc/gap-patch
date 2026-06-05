import { betaLoginRequestSchema, submissionRequestSchema } from "@gappatch/api-contracts"
import { describe, expect, it } from "vitest"

describe("API contracts", () => {
  it("rejects unsupported timezones at the login boundary", () => {
    const parsed = betaLoginRequestSchema.safeParse({
      email: "ai@example.com",
      inviteCode: "BETA-AI-0001",
      timezone: "Not/AZone",
    })

    expect(parsed.success).toBe(false)
  })

  it("rejects invalid perceived difficulty", () => {
    const parsed = submissionRequestSchema.safeParse({
      assignmentId: "assignment-user-1-2026-06-05",
      answer: "TCP retransmission belongs to the transport layer.",
      perceivedDifficulty: "impossible",
    })

    expect(parsed.success).toBe(false)
  })
})
