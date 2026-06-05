import { afterEach, describe, expect, it, vi } from "vitest"

import { shouldUseSecureSessionCookies } from "../../apps/web/src/server/http"

describe("session cookie policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("allows production HTTP deployments to disable secure cookies explicitly", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("GAPPATCH_SECURE_COOKIES", "false")

    expect(shouldUseSecureSessionCookies()).toBe(false)
  })

  it("uses secure cookies by default in production", () => {
    vi.stubEnv("NODE_ENV", "production")

    expect(shouldUseSecureSessionCookies()).toBe(true)
  })
})
