import { NextResponse } from "next/server"

import { getAdminContentCoverage } from "../../../../../server/app-services"
import { getAppState } from "../../../../../server/state"

export async function GET() {
  const result = getAdminContentCoverage(await getAppState())

  return NextResponse.json({
    ok: true,
    coverage: result.coverage,
    generationPolicy: result.generationPolicy,
    problemVersions: result.problemVersions,
  })
}
