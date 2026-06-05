import { submissionRequestSchema } from "@gappatch/api-contracts"
import { NextResponse } from "next/server"

import { createRuntimeGradingProvider } from "../../../server/azure-openai-grading"
import { jsonError, readSessionId } from "../../../server/http"
import { getAppState, persistAppState } from "../../../server/state"
import { submitAnswerAsync } from "../../../server/submission-service"

export async function POST(request: Request) {
  const sessionId = await readSessionId()
  if (!sessionId) {
    return jsonError("invalid_submission", 400)
  }

  const parsed = submissionRequestSchema.safeParse(await request.json())
  if (!parsed.success) {
    return jsonError("invalid_submission", 400)
  }

  const state = await getAppState()
  const result = await submitAnswerAsync(
    state,
    sessionId,
    parsed.data,
    createRuntimeGradingProvider(),
  )
  if (result.kind === "error") {
    return jsonError(result.code, result.status)
  }

  await persistAppState(state)
  return NextResponse.json({
    ok: true,
    feedback: result.feedback,
    history: result.history,
    reviewItems: result.reviewItems,
  })
}
