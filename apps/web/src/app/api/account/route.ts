import { NextResponse } from "next/server"

import { deleteAccount } from "../../../server/app-services"
import { clearSessionId, jsonError, readSessionId } from "../../../server/http"
import { getAppState, persistAppState } from "../../../server/state"

export async function DELETE() {
  const sessionId = await readSessionId()
  if (!sessionId) {
    return jsonError("unauthorized", 401)
  }

  const state = await getAppState()
  const result = deleteAccount(state, sessionId)
  if (result.kind === "error") {
    return jsonError(result.code, result.status)
  }

  await persistAppState(state)
  await clearSessionId()
  return NextResponse.json({ ok: true, deleted: result.deleted })
}
