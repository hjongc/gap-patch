import { difficultyFeedbackRequestSchema } from "@gappatch/api-contracts"
import { NextResponse } from "next/server"

import { updateDifficultyFeedback } from "../../../../server/app-services"
import { jsonError, readSessionId, zodError } from "../../../../server/http"
import { getAppState, persistAppState } from "../../../../server/state"

export async function POST(request: Request) {
  const sessionId = await readSessionId()
  if (!sessionId) {
    return jsonError("invalid_submission", 400)
  }

  const parsed = difficultyFeedbackRequestSchema.safeParse(await request.json())
  if (!parsed.success) {
    return zodError(parsed.error)
  }

  const state = await getAppState()
  const result = updateDifficultyFeedback(state, sessionId, parsed.data)
  if (result.kind === "error") {
    return jsonError(result.code, result.status)
  }

  await persistAppState(state)
  return NextResponse.json({ ok: true, reviewItems: result.reviewItems })
}
