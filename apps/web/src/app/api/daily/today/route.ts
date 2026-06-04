import { NextResponse } from "next/server"

import { createDailyAssignment, localDateForSession } from "../../../../server/app-services"
import { jsonError, readSessionId } from "../../../../server/http"
import { getAppState, persistAppState } from "../../../../server/state"

export async function GET() {
  const sessionId = await readSessionId()
  if (!sessionId) {
    return jsonError("unauthorized", 401)
  }

  const state = await getAppState()
  const localDate = localDateForSession(state, sessionId)
  if (!localDate) {
    return jsonError("unauthorized", 401)
  }

  const result = createDailyAssignment(state, sessionId, localDate)
  if (result.kind === "error") {
    return jsonError(result.code, result.status)
  }

  await persistAppState(state)
  return NextResponse.json({ ok: true, assignment: result.assignment })
}
