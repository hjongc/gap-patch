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
  const env = process.env as { readonly NODE_ENV?: string }
  cookieStore.set(sessionCookieName, sessionId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
  })
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
