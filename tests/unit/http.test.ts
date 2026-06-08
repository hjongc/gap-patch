import { afterEach, describe, expect, it, vi } from "vitest"

import {
  shouldAllowAuthRequest,
  shouldUseSecureSessionCookies,
} from "../../apps/web/src/server/http"

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

  it("rejects production auth over plain HTTP by default", () => {
    vi.stubEnv("NODE_ENV", "production")

    expect(shouldAllowAuthRequest(new Request("http://gappatch.example/login"))).toBe(false)
  })

  it("allows production auth through a HTTPS forwarding proxy", () => {
    vi.stubEnv("NODE_ENV", "production")

    expect(
      shouldAllowAuthRequest(
        new Request("http://gappatch-web:3000/login", {
          headers: { "x-forwarded-proto": "https" },
        }),
      ),
    ).toBe(true)
  })

  it("allows explicit insecure auth only for local smoke runs", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("GAPPATCH_ALLOW_INSECURE_AUTH", "true")

    expect(shouldAllowAuthRequest(new Request("http://127.0.0.1/login"))).toBe(true)
  })
})
