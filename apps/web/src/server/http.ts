import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { ZodError } from "zod"

const sessionCookieName = "gappatch_session"

export async function readSessionId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(sessionCookieName)?.value ?? null
}

export async function writeSessionId(sessionId: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(sessionCookieName, sessionId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: shouldUseSecureSessionCookies(),
    path: "/",
  })
}

export async function clearSessionId(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    sameSite: "lax",
    secure: shouldUseSecureSessionCookies(),
    path: "/",
  })
}

export function shouldUseSecureSessionCookies(): boolean {
  const { GAPPATCH_SECURE_COOKIES, NODE_ENV } = process.env
  if (GAPPATCH_SECURE_COOKIES === "false") {
    return false
  }
  if (GAPPATCH_SECURE_COOKIES === "true") {
    return true
  }
  return NODE_ENV === "production"
}

export function shouldAllowAuthRequest(request: Request): boolean {
  const { GAPPATCH_ALLOW_INSECURE_AUTH, NODE_ENV } = process.env
  if (NODE_ENV !== "production") {
    return true
  }
  if (GAPPATCH_ALLOW_INSECURE_AUTH === "true") {
    return true
  }

  const forwardedProtocol = request.headers.get("x-forwarded-proto")
  if (forwardedProtocol) {
    return forwardedProtocol.toLowerCase() === "https"
  }

  return new URL(request.url).protocol === "https:"
}

export function jsonError(code: string, status: 400 | 401): NextResponse {
  return NextResponse.json({ ok: false, error: { code } }, { status })
}

export function zodError(error: ZodError): NextResponse {
  return NextResponse.json(
    { ok: false, error: { code: "invalid_request", issues: error.issues } },
    { status: 400 },
  )
}
