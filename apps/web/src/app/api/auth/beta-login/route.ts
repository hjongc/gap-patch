import { betaLoginRequestSchema } from "@gappatch/api-contracts"
import { NextResponse } from "next/server"
import { loginWithTemporaryUserId } from "../../../../server/app-services"
import {
  jsonError,
  shouldAllowAuthRequest,
  writeSessionId,
  zodError,
} from "../../../../server/http"
import { getAppState, persistAppState } from "../../../../server/state"

export async function POST(request: Request) {
  if (!shouldAllowAuthRequest(request)) {
    return jsonError("https_required", 400)
  }

  const parsed = betaLoginRequestSchema.safeParse(await request.json())
  if (!parsed.success) {
    return zodError(parsed.error)
  }

  const state = await getAppState()
  const result = loginWithTemporaryUserId(state, parsed.data)
  if (result.kind === "error") {
    return jsonError(result.code, result.status)
  }

  await persistAppState(state)
  await writeSessionId(result.sessionId)
  return NextResponse.json({ ok: true, user: { id: result.user.id } })
}
