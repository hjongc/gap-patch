import { betaLoginRequestSchema } from "@gappatch/api-contracts"
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
})
