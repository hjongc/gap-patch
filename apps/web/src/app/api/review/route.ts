import { NextResponse } from "next/server"

import { getReview } from "../../../server/app-services"
import { jsonError, readSessionId } from "../../../server/http"
import { getAppState } from "../../../server/state"

export async function GET() {
  const sessionId = await readSessionId()
  if (!sessionId) {
    return jsonError("unauthorized", 401)
  }

  const result = getReview(await getAppState(), sessionId)
  if (result.kind === "error") {
    return jsonError(result.code, result.status)
  }

  return NextResponse.json({ ok: true, reviewItems: result.reviewItems })
}
