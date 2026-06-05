import { NextResponse } from "next/server"

import { isAdminEmail } from "../../../../../server/admin-access"
import { getAdminContentCoverage } from "../../../../../server/app-services"
import { jsonError, readSessionId } from "../../../../../server/http"
import { userForSession } from "../../../../../server/session-state"
import { getAppState } from "../../../../../server/state"

export async function GET() {
  const sessionId = await readSessionId()
  if (!sessionId) {
    return jsonError("unauthorized", 401)
  }

  const state = await getAppState()
  const user = userForSession(state, sessionId)
  if (!user || !isAdminEmail(user.email)) {
    return jsonError("unauthorized", 401)
  }

  const result = getAdminContentCoverage(state)

  return NextResponse.json({
    ok: true,
    coverage: result.coverage,
    generationPolicy: result.generationPolicy,
    problemVersions: result.problemVersions,
  })
}
