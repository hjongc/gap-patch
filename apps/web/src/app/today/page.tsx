"use client"

import ky from "ky"
import { useEffect, useState } from "react"
import { LearnerNav } from "../nav"
import { MobileShell, PageHeader, PrimaryButton, SurfaceCard } from "../ui"

type Assignment = {
  readonly id: string
  readonly title: string
  readonly prompt: string
}

type TodayResponse = {
  readonly ok: boolean
  readonly assignment: Assignment
}

type SubmissionResponse = {
  readonly ok: boolean
  readonly feedback: {
    readonly label: string
    readonly summary: string
  }
}

export default function TodayPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [answer, setAnswer] = useState("")
  const [feedback, setFeedback] = useState<SubmissionResponse["feedback"] | null>(null)

  useEffect(() => {
    async function loadToday() {
      const response = await ky.get("/api/daily/today").json<TodayResponse>()
      setAssignment(response.assignment)
    }

    void loadToday()
  }, [])

  async function submitAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!assignment) {
      return
    }

    const response = await ky
      .post("/api/submissions", { json: { assignmentId: assignment.id, answer } })
      .json<SubmissionResponse>()
    setFeedback(response.feedback)
  }

  return (
    <MobileShell hasBottomNav>
      <LearnerNav />
      <PageHeader
        aside={
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            1Q
          </span>
        }
        eyebrow="Daily practice"
        title="Today"
      />
      {assignment ? (
        <form className="space-y-4" onSubmit={submitAnswer}>
          <SurfaceCard tone="accent">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-coral">problem</p>
            <h2 className="mt-3 text-xl font-semibold leading-tight">{assignment.title}</h2>
            <p className="mt-4 text-sm leading-6 text-muted">{assignment.prompt}</p>
          </SurfaceCard>
          <label className="block space-y-2 text-sm font-medium">
            <span>Your answer</span>
            <textarea
              className="min-h-32 w-full rounded-[8px] border border-line bg-panel px-3 py-3 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              onChange={(event) => setAnswer(event.target.value)}
              value={answer}
            />
          </label>
          <PrimaryButton disabled={answer.trim().length === 0}>Submit answer</PrimaryButton>
        </form>
      ) : (
        <p className="text-sm text-muted">Loading today&apos;s problem...</p>
      )}
      {feedback ? (
        <SurfaceCard tone="warm">
          <p className="text-sm font-semibold text-coral">{feedback.label}</p>
          <p className="mt-2 text-sm leading-6 text-muted">{feedback.summary}</p>
        </SurfaceCard>
      ) : null}
    </MobileShell>
  )
}
