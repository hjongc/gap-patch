"use client"

import ky from "ky"
import { useEffect, useState } from "react"
import type { HealthSnapshot } from "../../../server/health"
import { LearningBadge, MobileShell, PageHeader, SurfaceCard } from "../../ui"

type HealthResponse = {
  readonly ok: boolean
  readonly snapshot: HealthSnapshot
}

const stateMetricLabels = [
  ["사용자", "users"],
  ["세션", "sessions"],
  ["배정", "assignments"],
  ["기록 항목", "historyItems"],
  ["복습 항목", "reviewItems"],
  ["숙련도 기록", "masteryRecords"],
  ["초대 코드", "invites"],
] as const

export default function AdminHealthPage() {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    async function loadHealth() {
      try {
        const response = await ky.get("/api/admin/health").json<HealthResponse>()
        setSnapshot(response.snapshot)
      } catch (caught) {
        if (caught instanceof Error) {
          setLoadError("관리자 권한이 필요합니다.")
          return
        }
        throw caught
      }
    }

    void loadHealth()
  }, [])

  return (
    <MobileShell>
      <PageHeader
        aside={<LearningBadge tone="sky">관리자</LearningBadge>}
        eyebrow="시스템 운영"
        kicker="웹 프로세스와 파일 기반 상태를 빠르게 확인합니다."
        title="서비스 상태"
      />
      {loadError ? (
        <SurfaceCard tone="warm">
          <h2 className="text-xl font-black">{loadError}</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted">
            서비스 상태 화면을 열기 전에 승인된 관리자 계정으로 로그인해 주세요.
          </p>
        </SurfaceCard>
      ) : null}
      {snapshot ? (
        <div className="space-y-4">
          <SurfaceCard tone="accent">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-coral">상태</p>
                <h2 className="mt-2 text-2xl font-black">{snapshot.service}</h2>
              </div>
              <LearningBadge tone={snapshot.readiness.ready ? "mint" : "coral"}>
                {snapshot.readiness.ready ? "운영 준비됨" : "점검 필요"}
              </LearningBadge>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs font-black">
              <div className="rounded-[8px] border border-line bg-white px-3 py-2">
                <dt className="text-muted">런타임</dt>
                <dd className="mt-1 text-ink">{snapshot.runtime.nodeEnv}</dd>
              </div>
              <div className="rounded-[8px] border border-line bg-white px-3 py-2">
                <dt className="text-muted">저장소</dt>
                <dd className="mt-1 text-ink">
                  {snapshot.runtime.dataFileConfigured ? "데이터 파일 설정됨" : "기본 데이터 파일"}
                </dd>
              </div>
              <div className="rounded-[8px] border border-line bg-white px-3 py-2">
                <dt className="text-muted">채점</dt>
                <dd className="mt-1 text-ink">{snapshot.runtime.gradingProvider}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs font-bold text-muted">확인 시각 {snapshot.checkedAt}</p>
          </SurfaceCard>
          <SurfaceCard tone={snapshot.readiness.ready ? "accent" : "warm"}>
            <p className="text-xs font-black uppercase text-coral">운영 준비도</p>
            <div className="mt-3 space-y-2">
              {snapshot.readiness.checks.map((check) => (
                <div className="rounded-[8px] border border-line bg-white p-3" key={check.key}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-black text-ink">{check.key}</p>
                    <LearningBadge tone={check.status === "pass" ? "mint" : "coral"}>
                      {check.status === "pass" ? "통과" : "실패"}
                    </LearningBadge>
                  </div>
                  <p className="mt-2 text-xs font-bold leading-5 text-muted">{check.detail}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>
          <SurfaceCard>
            <p className="text-xs font-black uppercase text-coral">상태 카운트</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {stateMetricLabels.map(([label, key]) => (
                <div className="rounded-[8px] border border-line bg-white p-3" key={key}>
                  <p className="text-xs font-black text-muted">{label}</p>
                  <p className="mt-2 text-2xl font-black">{snapshot.state[key]}</p>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      ) : loadError ? null : (
        <p className="text-sm text-muted">서비스 상태를 불러오는 중...</p>
      )}
    </MobileShell>
  )
}
