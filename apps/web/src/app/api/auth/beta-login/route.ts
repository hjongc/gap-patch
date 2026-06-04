import { betaLoginRequestSchema } from "@gappatch/api-contracts"
import { NextResponse } from "next/server"
import { loginWithInvite } from "../../../../server/app-services"
import { jsonError, writeSessionId, zodError } from "../../../../server/http"
import { getAppState, persistAppState } from "../../../../server/state"

export async function POST(request: Request) {
  const parsed = betaLoginRequestSchema.safeParse(await request.json())
  if (!parsed.success) {
    return zodError(parsed.error)
  }

  const state = await getAppState()
  const result = loginWithInvite(state, parsed.data)
  if (result.kind === "error") {
    return jsonError(result.code, result.status)
  }

  await persistAppState(state)
  await writeSessionId(result.sessionId)
  return NextResponse.json({ ok: true, user: { email: result.user.email } })
}
