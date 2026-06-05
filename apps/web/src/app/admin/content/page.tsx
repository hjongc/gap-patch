"use client"

import ky from "ky"
import { useEffect, useState } from "react"
import { LearningBadge, MobileShell, PageHeader, SurfaceCard } from "../../ui"

type CoverageSlot = {
  readonly slotId: string
  readonly conceptLabel: string
  readonly scenarioLabel: string
  readonly difficulty: string
  readonly approvedProblemCount: number
  readonly targetProblemCount: number
}

type ProblemVersion = {
  readonly id: string
  readonly title: string
  readonly status: string
}

type CoverageResponse = {
  readonly coverage: readonly CoverageSlot[]
  readonly generationPolicy: {
    readonly realtimePerUserGeneration: boolean
    readonly batchGenerationUnit: string
  }
  readonly problemVersions: readonly ProblemVersion[]
}

export default function AdminContentPage() {
  const [coverage, setCoverage] = useState<CoverageResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCoverage() {
      try {
        const response = await ky.get("/api/admin/content/coverage").json<CoverageResponse>()
        setCoverage(response)
      } catch (caught) {
        if (caught instanceof Error) {
          setLoadError("Admin access required.")
          return
        }
        throw caught
      }
    }

    void loadCoverage()
  }, [])

  return (
    <MobileShell>
      <PageHeader
        aside={<LearningBadge tone="sky">Admin</LearningBadge>}
        eyebrow="Content ops"
        kicker="Approved content supply, coverage, and generation controls."
        title="Admin Content Operations"
      />
      {loadError ? (
        <SurfaceCard tone="warm">
          <h2 className="text-xl font-black">{loadError}</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted">
            Sign in with an approved admin account before opening content operations.
          </p>
        </SurfaceCard>
      ) : null}
      {coverage ? (
        <div className="space-y-4">
          <SurfaceCard tone="accent">
            <p className="text-xs font-black uppercase text-coral">Generation policy</p>
            <h2 className="mt-2 text-xl font-black">No realtime per-user generation</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted">
              LLM generation runs by content slot, then approved problem versions are selected per
              learner.
            </p>
            <p className="mt-3 text-xs font-black text-muted">
              Batch unit: {coverage.generationPolicy.batchGenerationUnit}
            </p>
          </SurfaceCard>
          <SurfaceCard>
            <p className="text-xs font-black uppercase text-coral">Content coverage</p>
            <div className="mt-3 space-y-3">
              {coverage.coverage.map((slot) => (
                <div className="rounded-[8px] border border-line bg-white p-3" key={slot.slotId}>
                  <h2 className="font-black">{slot.conceptLabel}</h2>
                  <p className="mt-1 text-sm font-semibold text-muted">
                    {slot.scenarioLabel} / {slot.difficulty}
                  </p>
                  <p className="mt-2 text-xs font-black text-leaf">
                    {slot.approvedProblemCount}/{slot.targetProblemCount} approved
                  </p>
                </div>
              ))}
            </div>
          </SurfaceCard>
          <SurfaceCard tone="warm">
            <p className="text-xs font-black uppercase text-coral">Problem versions</p>
            <div className="mt-3 space-y-3">
              {coverage.problemVersions.map((problem) => (
                <div className="rounded-[8px] border border-line bg-white p-3" key={problem.id}>
                  <h2 className="font-black">{problem.title}</h2>
                  <p className="mt-1 text-xs font-bold text-muted">{problem.id}</p>
                  <LearningBadge tone="mint">{problem.status}</LearningBadge>
                </div>
              ))}
            </div>
          </SurfaceCard>
          <SurfaceCard>
            <h2 className="text-xl font-black">Review queue readiness</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted">
              Candidate generation, semantic dedupe, rubric checks, and approval states are modeled
              for the next admin build-out.
            </p>
          </SurfaceCard>
        </div>
      ) : (
        <p className="text-sm text-muted">Loading content coverage...</p>
      )}
    </MobileShell>
  )
}
