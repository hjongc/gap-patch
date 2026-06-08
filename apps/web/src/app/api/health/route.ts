import { NextResponse } from "next/server"

import { getPublicHealthSnapshot } from "../../../server/health"
import { checkPostgresConnection } from "../../../server/postgres-runtime-database"

export const dynamic = "force-dynamic"

export async function GET() {
  const ok = await publicReadinessOk()
  return NextResponse.json(
    {
      ok,
      snapshot: getPublicHealthSnapshot(new Date(), ok),
    },
    { status: ok ? 200 : 503 },
  )
}

async function publicReadinessOk(): Promise<boolean> {
  const { DATABASE_URL } = process.env
  if (!DATABASE_URL?.trim()) {
    return true
  }
  return checkPostgresConnection()
}
