import { describe, expect, it } from "vitest"

import { createAppState, getAdminContentCoverage } from "../test-support/app-service-imports"

describe("admin content operations", () => {
  it("reports content coverage for admin operations", async () => {
    const result = getAdminContentCoverage(createAppState())

    expect(result.kind).toBe("ok")
    expect(result.generationPolicy.realtimePerUserGeneration).toBe(false)
    expect(result.coverage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          approvedProblemCount: expect.any(Number),
          slotId: "networking.tcp.layer-ownership:debugging-log:foundation",
        }),
      ]),
    )
    expect(result.problemVersions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "problem-networking-tcp-layer-ownership-debugging-foundation-v1",
          status: "approved",
        }),
      ]),
    )
  })
})
