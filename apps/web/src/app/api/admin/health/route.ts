import { NextResponse } from "next/server"

import { isAdminUser } from "../../../../server/admin-access"
import type { AppState } from "../../../../server/app-model"
import { getHealthSnapshot } from "../../../../server/health"
import { jsonError, readSessionId } from "../../../../server/http"
import { checkPostgresConnection } from "../../../../server/postgres-runtime-database"
import { userForSession } from "../../../../server/session-state"
import { getAppState } from "../../../../server/state"

export const dynamic = "force-dynamic"

export async function GET() {
  const sessionId = await readSessionId()
  if (!sessionId) {
    return jsonError("unauthorized", 401)
  }

  const databaseConnection = await currentDatabaseConnection()
  let state: AppState
  try {
    state = await getAppState()
  } catch (caught) {
    if (caught instanceof Error) {
      return jsonError("state_unavailable", 401)
    }
    throw caught
  }
  const user = userForSession(state, sessionId)
  if (!user || !isAdminUser(user)) {
    return jsonError("unauthorized", 401)
  }

  return NextResponse.json({
    ok: true,
    snapshot: getHealthSnapshot(state, new Date(), { databaseConnection }),
  })
}

async function currentDatabaseConnection(): Promise<"fail" | "pass" | "unchecked"> {
  const { DATABASE_URL } = process.env
  if (!DATABASE_URL?.trim()) {
    return "unchecked"
  }
  return (await checkPostgresConnection()) ? "pass" : "fail"
}
