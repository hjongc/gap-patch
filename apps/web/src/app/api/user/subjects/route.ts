import { subjectSelectionRequestSchema } from "@gappatch/api-contracts"
import { NextResponse } from "next/server"
import { updateSubjectSelection } from "../../../../server/app-services"
import { jsonError, readSessionId, zodError } from "../../../../server/http"
import { getAppState, persistAppState } from "../../../../server/state"

export async function POST(request: Request) {
  const sessionId = await readSessionId()
  if (!sessionId) {
    return jsonError("unauthorized", 401)
  }

  const parsed = subjectSelectionRequestSchema.safeParse(await request.json())
  if (!parsed.success) {
    return zodError(parsed.error)
  }

  const state = await getAppState()
  const result = updateSubjectSelection(state, sessionId, parsed.data)
  if (result.kind === "error") {
    return jsonError(result.code, result.status)
  }

  await persistAppState(state)
  return NextResponse.json({ ok: true, subjects: result.subjects, difficulty: result.difficulty })
}
