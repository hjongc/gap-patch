import { NextResponse } from "next/server"

import { isAdminUser } from "../../../../server/admin-access"
import { getHealthSnapshot } from "../../../../server/health"
import { jsonError, readSessionId } from "../../../../server/http"
import { userForSession } from "../../../../server/session-state"
import { getAppState } from "../../../../server/state"

export const dynamic = "force-dynamic"

export async function GET() {
  const sessionId = await readSessionId()
  if (!sessionId) {
    return jsonError("unauthorized", 401)
  }

  const state = await getAppState()
  const user = userForSession(state, sessionId)
  if (!user || !isAdminUser(user)) {
    return jsonError("unauthorized", 401)
  }

  return NextResponse.json({
    ok: true,
    snapshot: getHealthSnapshot(state),
  })
}
