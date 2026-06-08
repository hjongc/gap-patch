import { betaLoginRequestSchema, submissionRequestSchema } from "@gappatch/api-contracts"
import { describe, expect, it } from "vitest"

describe("API contracts", () => {
  it("accepts a temporary numeric user id at the login boundary", () => {
    const parsed = betaLoginRequestSchema.safeParse({
      temporaryUserId: " 0000 ",
      timezone: "Asia/Seoul",
    })

    expect(parsed.success).toBe(true)
    if (!parsed.success) {
      throw new Error("expected numeric login to parse")
    }
    expect(parsed.data.temporaryUserId).toBe("0000")
  })

  it("rejects unsupported timezones at the login boundary", () => {
    const parsed = betaLoginRequestSchema.safeParse({
      temporaryUserId: "0000",
      timezone: "Not/AZone",
    })

    expect(parsed.success).toBe(false)
  })

  it("rejects non-numeric temporary user ids at the login boundary", () => {
    const parsed = betaLoginRequestSchema.safeParse({
      temporaryUserId: "test@gappatch.app",
      timezone: "Asia/Seoul",
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
