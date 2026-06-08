import { describe, expect, it } from "vitest"

import nextConfig from "../../apps/web/next.config"

describe("Next.js security headers", () => {
  it("applies baseline security headers to every route", async () => {
    const rules = await nextConfig.headers?.()
    const allRoutes = rules?.find((rule) => rule.source === "/(.*)")

    expect(allRoutes?.headers).toEqual(
      expect.arrayContaining([
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      ]),
    )
  })
})
