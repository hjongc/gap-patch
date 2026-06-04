"use client"

import ky from "ky"
import { useEffect, useState } from "react"
import { LearnerNav } from "../nav"
import { MobileShell, PageHeader, SurfaceCard } from "../ui"

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
        aside={
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            {history.length}
          </span>
        }
        eyebrow="Attempts"
        title="History"
      />
      {history.map((item) => (
        <SurfaceCard key={item.assignmentId}>
          <h2 className="font-semibold">{item.title}</h2>
          <p className="mt-2 text-sm text-muted">{item.feedback.label}</p>
        </SurfaceCard>
      ))}
    </MobileShell>
  )
}
