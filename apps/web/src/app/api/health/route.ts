import { NextResponse } from "next/server"

import { getPublicHealthSnapshot } from "../../../server/health"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    ok: true,
    snapshot: getPublicHealthSnapshot(),
  })
}
