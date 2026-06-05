"use client"

import ky from "ky"
import { useCallback, useEffect, useRef, useState } from "react"
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
import { SubmissionFeedbackCard } from "./submission-feedback-card"
import {
  type Assignment,
  assignmentDifficultyLabels,
  assignmentSubjectLabels,
  type DifficultyOptionValue,
  type SubmissionResponse,
  type TodayResponse,
} from "./today-model"

export default function TodayPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [answer, setAnswer] = useState("")
  const [feedback, setFeedback] = useState<SubmissionResponse["feedback"] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [difficultyError, setDifficultyError] = useState<string | null>(null)
  const [difficultySaved, setDifficultySaved] = useState<string | null>(null)
  const feedbackRef = useRef<HTMLDivElement | null>(null)

  const loadToday = useCallback(async function loadToday() {
    setIsLoading(true)
    setLoadError(null)
    try {
      const response = await ky.get("/api/daily/today").json<TodayResponse>()
      setAssignment(response.assignment)
    } catch (caught) {
      if (caught instanceof Error) {
        setLoadError("오늘의 문제를 불러오지 못했습니다.")
        return
      }
      throw caught
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadToday()
  }, [loadToday])

  useEffect(() => {
    if (!feedback) {
      return
    }

    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    feedbackRef.current?.scrollIntoView?.({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    })
  }, [feedback])

  async function submitAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!assignment || isSubmitting) {
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const response = await ky
        .post("/api/submissions", { json: { assignmentId: assignment.id, answer } })
        .json<SubmissionResponse>()
      setFeedback(response.feedback)
      setDifficultySaved(null)
      setDifficultyError(null)
    } catch (caught) {
      if (caught instanceof Error) {
        setSubmitError("답안을 제출하지 못했습니다. 다시 시도해 주세요.")
        return
      }
      throw caught
    } finally {
      setIsSubmitting(false)
    }
  }

  async function saveDifficulty(perceivedDifficulty: DifficultyOptionValue) {
    if (!assignment) {
      return
    }

    setDifficultyError(null)
    try {
      await ky.post("/api/submissions/difficulty", {
        json: { assignmentId: assignment.id, perceivedDifficulty },
      })
      setDifficultySaved("난이도 저장됨")
    } catch (caught) {
      if (caught instanceof Error) {
        setDifficultySaved(null)
        setDifficultyError("난이도 피드백을 저장하지 못했습니다.")
        return
      }
      throw caught
    }
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
        eyebrow="매일 연습"
        kicker="오늘의 작은 미션 하나만 클리어하자."
        title="오늘의 문제"
      />
      {isLoading ? (
        <SurfaceCard>
          <p className="text-sm font-black text-ink">오늘의 패치를 준비 중...</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted">
            검수된 문제은행에서 오늘 풀 문제를 고르고 있습니다.
          </p>
        </SurfaceCard>
      ) : null}
      {loadError ? (
        <SurfaceCard tone="warm">
          <p className="text-sm font-black text-coral">{loadError}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted">
            세션을 확인한 뒤 다시 시도해 주세요.
          </p>
          <button
            className="mt-4 rounded-[8px] border border-line bg-white px-3 py-2 text-xs font-black"
            onClick={() => void loadToday()}
            type="button"
          >
            다시 시도
          </button>
        </SurfaceCard>
      ) : null}
      {assignment && !isLoading && !loadError ? (
        <form className="space-y-4" onSubmit={submitAnswer}>
          <ProgressRail current={feedback ? 2 : 1} total={2} />
          <SurfaceCard tone="accent">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-coral">패치 미션</p>
              <LearningBadge tone="mint">
                {assignmentSubjectLabels[assignment.subjectId]}
              </LearningBadge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black leading-none">
              <span className="rounded-full border border-line bg-white px-3 py-2 text-ink">
                검수 완료
              </span>
              <span className="rounded-full border border-line bg-white px-3 py-2 text-ink">
                {assignmentDifficultyLabels[assignment.estimatedDifficulty] ??
                  assignment.estimatedDifficulty}
              </span>
              <span className="max-w-full rounded-full border border-line bg-white px-3 py-2 text-ink">
                개념: {assignment.conceptLabel}
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
                <dt className="font-black text-ink">상황</dt>
                <dd className="text-muted">{assignment.scenarioLabel}</dd>
              </div>
              <div>
                <dt className="font-black text-ink">출제 이유</dt>
                <dd className="text-muted">{assignment.assignmentReason}</dd>
              </div>
            </dl>
          </SurfaceCard>
          <label className="block space-y-2 text-sm font-medium">
            <span className="font-black">내 답안</span>
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
              <SubmissionFeedbackCard
                assignment={assignment}
                difficultyError={difficultyError}
                difficultySaved={difficultySaved}
                feedback={feedback}
                onSaveDifficulty={(perceivedDifficulty) => {
                  void saveDifficulty(perceivedDifficulty)
                }}
              />
            </div>
          ) : null}
          {submitError ? (
            <p className="rounded-[8px] border border-coral bg-panel px-3 py-2 text-sm font-black text-coral">
              {submitError}
            </p>
          ) : null}
          {isSubmitting ? (
            <p
              aria-live="polite"
              className="rounded-[8px] border border-leaf/30 bg-accent/10 px-3 py-2 text-center text-xs font-black text-leaf"
            >
              답안을 채점하고 있어요
            </p>
          ) : null}
          <PrimaryButton
            busyLabel="채점 중..."
            disabled={answer.trim().length === 0}
            isBusy={isSubmitting}
          >
            답안 제출
          </PrimaryButton>
        </form>
      ) : null}
    </MobileShell>
  )
}
