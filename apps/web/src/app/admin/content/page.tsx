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
          setLoadError("관리자 권한이 필요합니다.")
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
        aside={<LearningBadge tone="sky">관리자</LearningBadge>}
        eyebrow="콘텐츠 운영"
        kicker="검수된 문제 공급, 커버리지, 생성 정책을 한 화면에서 확인합니다."
        title="관리자 콘텐츠 운영"
      />
      {loadError ? (
        <SurfaceCard tone="warm">
          <h2 className="text-xl font-black">{loadError}</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted">
            콘텐츠 운영 화면을 열기 전에 승인된 관리자 계정으로 로그인해 주세요.
          </p>
        </SurfaceCard>
      ) : null}
      {coverage ? (
        <div className="space-y-4">
          <SurfaceCard tone="accent">
            <p className="text-xs font-black uppercase text-coral">생성 정책</p>
            <h2 className="mt-2 text-xl font-black">사용자별 실시간 생성 없음</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted">
              LLM 생성은 콘텐츠 슬롯 단위로 배치 실행하고, 승인된 문제 버전을 학습자별로 선택합니다.
            </p>
            <p className="mt-3 text-xs font-black text-muted">
              배치 단위: {coverage.generationPolicy.batchGenerationUnit}
            </p>
          </SurfaceCard>
          <SurfaceCard>
            <p className="text-xs font-black uppercase text-coral">콘텐츠 커버리지</p>
            <div className="mt-3 space-y-3">
              {coverage.coverage.map((slot) => (
                <div className="rounded-[8px] border border-line bg-white p-3" key={slot.slotId}>
                  <h2 className="font-black">{slot.conceptLabel}</h2>
                  <p className="mt-1 text-sm font-semibold text-muted">
                    {slot.scenarioLabel} / {slot.difficulty}
                  </p>
                  <p className="mt-2 text-xs font-black text-leaf">
                    승인 {slot.approvedProblemCount}/{slot.targetProblemCount}
                  </p>
                </div>
              ))}
            </div>
          </SurfaceCard>
          <SurfaceCard tone="warm">
            <p className="text-xs font-black uppercase text-coral">문제 버전</p>
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
            <h2 className="text-xl font-black">복습 큐 준비도</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted">
              후보 생성, 의미 중복 제거, 루브릭 검사, 승인 상태까지 다음 관리자 확장을 위해
              모델링되어 있습니다.
            </p>
          </SurfaceCard>
        </div>
      ) : (
        <p className="text-sm text-muted">콘텐츠 커버리지를 불러오는 중...</p>
      )}
    </MobileShell>
  )
}
