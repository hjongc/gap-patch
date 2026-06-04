"use client"

import ky from "ky"
import { useEffect, useState } from "react"
import { LearnerNav } from "../nav"
import { LearningBadge, MobileShell, PageHeader, SurfaceCard } from "../ui"

type HistoryItem = {
  readonly assignmentId: string
  readonly title: string
  readonly feedback: {
    readonly label: string
  }
}

export default function HistoryPage() {
  const [history, setHistory] = useState<readonly HistoryItem[]>([])

  useEffect(() => {
    async function loadHistory() {
      const response = await ky
        .get("/api/history")
        .json<{ readonly history: readonly HistoryItem[] }>()
      setHistory(response.history)
    }

    void loadHistory()
  }, [])

  return (
    <MobileShell hasBottomNav>
      <LearnerNav />
      <PageHeader
        aside={<LearningBadge tone="mint">{history.length}</LearningBadge>}
        eyebrow="Attempts"
        kicker="작은 시도들이 쌓이면 빈틈 지도가 된다."
        title="History"
      />
      {history.length > 0 ? (
        history.map((item) => (
          <SurfaceCard key={item.assignmentId}>
            <div className="flex items-start gap-3">
              <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-accent text-xs font-black text-white">
                ✓
              </span>
              <div>
                <h2 className="font-black">{item.title}</h2>
                <p className="mt-2 text-sm font-semibold text-muted">{item.feedback.label}</p>
              </div>
            </div>
          </SurfaceCard>
        ))
      ) : (
        <SurfaceCard tone="accent">
          <h2 className="text-xl font-black">아직 첫 발자국 전이야</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted">
            오늘 문제를 풀면 완료 기록이 여기에 남는다.
          </p>
        </SurfaceCard>
      )}
    </MobileShell>
  )
}
