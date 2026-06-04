"use client"

import type { SubjectId } from "@gappatch/domain"
import ky from "ky"
import { useEffect, useRef, useState } from "react"
import { LearnerNav } from "../nav"
import {
  LearningBadge,
  MascotMark,
  MobileShell,
  PageHeader,
  PrimaryButton,
  ProgressRail,
  SurfaceCard,
} from "../ui"

type Assignment = {
  readonly id: string
  readonly subjectId: SubjectId
  readonly title: string
  readonly prompt: string
}

const assignmentSubjectLabels: Record<SubjectId, string> = {
  "ai-ml-foundations": "AI/ML",
  "computer-networking": "Network",
  "data-math-statistics": "Data/Math",
  "operating-systems": "OS",
  "software-engineering-systems": "Systems",
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
  const feedbackRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    async function loadToday() {
      const response = await ky.get("/api/daily/today").json<TodayResponse>()
      setAssignment(response.assignment)
    }

    void loadToday()
  }, [])

  useEffect(() => {
    if (!feedback) {
      return
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    feedbackRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    })
  }, [feedback])

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
          <div className="flex flex-col items-end gap-2">
            <MascotMark />
            <LearningBadge tone="banana">1Q</LearningBadge>
          </div>
        }
        eyebrow="Daily practice"
        kicker="오늘의 작은 미션 하나만 클리어하자."
        title="Today"
      />
      {assignment ? (
        <form className="space-y-4" onSubmit={submitAnswer}>
          <ProgressRail current={feedback ? 2 : 1} total={2} />
          <SurfaceCard tone="accent">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-coral">
                patch mission
              </p>
              <LearningBadge tone="mint">
                {assignmentSubjectLabels[assignment.subjectId]}
              </LearningBadge>
            </div>
            <h2 className="mt-4 text-xl font-black leading-tight sm:text-2xl">
              {assignment.title}
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted sm:text-base sm:leading-7">
              {assignment.prompt}
            </p>
          </SurfaceCard>
          <label className="block space-y-2 text-sm font-medium">
            <span className="font-black">Your answer</span>
            <textarea
              className="min-h-24 w-full rounded-[8px] border-2 border-line bg-panel px-3 py-3 font-semibold outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              onChange={(event) => setAnswer(event.target.value)}
              value={answer}
            />
          </label>
          {feedback ? (
            <div ref={feedbackRef}>
              <SurfaceCard tone="warm">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-banana text-sm font-black text-banana-ink">
                    +
                  </span>
                  <div>
                    <p className="text-base font-black text-coral">{feedback.label}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-muted">
                      {feedback.summary}
                    </p>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          ) : null}
          <PrimaryButton disabled={answer.trim().length === 0}>Submit answer</PrimaryButton>
        </form>
      ) : (
        <p className="text-sm text-muted">Loading today&apos;s problem...</p>
      )}
    </MobileShell>
  )
}
