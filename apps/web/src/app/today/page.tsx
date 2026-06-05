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
  readonly problemVersionId: string
  readonly rubricVersionId: string
  readonly conceptLabel: string
  readonly scenarioLabel: string
  readonly estimatedDifficulty: string
  readonly assignmentReason: string
  readonly generationSource: string
  readonly answerGuidance: string
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

const difficultyOptions = [
  { label: "Easy", value: "easy" },
  { label: "Right", value: "right" },
  { label: "Hard", value: "hard" },
] as const

type TodayResponse = {
  readonly ok: boolean
  readonly assignment: Assignment
}

type SubmissionResponse = {
  readonly ok: boolean
  readonly feedback: {
    readonly label: string
    readonly summary: string
    readonly strengths: readonly string[]
    readonly missingConcepts: readonly string[]
    readonly misconceptions: readonly string[]
    readonly reviewConcepts: readonly string[]
  }
}

export default function TodayPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [answer, setAnswer] = useState("")
  const [feedback, setFeedback] = useState<SubmissionResponse["feedback"] | null>(null)
  const [difficultySaved, setDifficultySaved] = useState<string | null>(null)
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
    setDifficultySaved(null)
  }

  async function saveDifficulty(perceivedDifficulty: "easy" | "right" | "hard") {
    if (!assignment) {
      return
    }

    await ky.post("/api/submissions/difficulty", {
      json: { assignmentId: assignment.id, perceivedDifficulty },
    })
    setDifficultySaved("Difficulty saved")
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
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black sm:grid-cols-4">
              <span className="rounded-[8px] border border-line bg-white px-3 py-2">
                Approved pool
              </span>
              <span className="rounded-[8px] border border-line bg-white px-3 py-2">
                {assignment.estimatedDifficulty}
              </span>
              <span className="rounded-[8px] border border-line bg-white px-3 py-2">Concept</span>
              <span className="rounded-[8px] border border-line bg-white px-3 py-2">
                {assignment.conceptLabel}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-black leading-tight sm:text-2xl">
              {assignment.title}
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted sm:text-base sm:leading-7">
              {assignment.prompt}
            </p>
            <dl className="mt-4 space-y-3 text-sm font-semibold leading-6">
              <div>
                <dt className="font-black text-ink">Scenario</dt>
                <dd className="text-muted">{assignment.scenarioLabel}</dd>
              </div>
              <div>
                <dt className="font-black text-ink">Why this problem</dt>
                <dd className="text-muted">{assignment.assignmentReason}</dd>
              </div>
            </dl>
          </SurfaceCard>
          <label className="block space-y-2 text-sm font-medium">
            <span className="font-black">Your answer</span>
            <span className="block text-xs font-bold leading-5 text-muted">
              {assignment.answerGuidance}
            </span>
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
                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <p className="font-black">Missing concept</p>
                        <p className="mt-1 font-semibold leading-6 text-muted">
                          {feedback.missingConcepts[0] ?? "No required concept is missing."}
                        </p>
                      </div>
                      <div>
                        <p className="font-black">Review concept</p>
                        <p className="mt-1 font-semibold leading-6 text-muted">
                          {feedback.reviewConcepts[0] ?? assignment.conceptLabel}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {difficultyOptions.map((option) => (
                        <button
                          className="rounded-[8px] border border-line bg-white px-3 py-2 text-xs font-black transition active:bg-banana"
                          key={option.value}
                          onClick={() => saveDifficulty(option.value)}
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {difficultySaved ? (
                      <p className="mt-3 text-xs font-black text-leaf">{difficultySaved}</p>
                    ) : null}
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
