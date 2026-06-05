import { SurfaceCard } from "../ui"
import {
  type Assignment,
  type DifficultyOptionValue,
  difficultyOptions,
  type SubmissionResponse,
} from "./today-model"

type SubmissionFeedbackCardProps = {
  readonly assignment: Assignment
  readonly difficultyError: string | null
  readonly difficultySaved: string | null
  readonly feedback: SubmissionResponse["feedback"]
  readonly onSaveDifficulty: (perceivedDifficulty: DifficultyOptionValue) => void
}

type FeedbackResultPresentation = {
  readonly animationLabel: string
  readonly cardTone: "accent" | "plain" | "warm"
  readonly headline: string
  readonly marker: string
  readonly motionClass: string
  readonly statusLabel: string
  readonly textClass: string
}

export function SubmissionFeedbackCard({
  assignment,
  difficultyError,
  difficultySaved,
  feedback,
  onSaveDifficulty,
}: SubmissionFeedbackCardProps) {
  const reviewConceptLabel =
    feedback.reviewConcepts.length > 0 ? assignment.conceptLabel : "복습 개념은 없습니다."
  const result = feedbackResultPresentation(feedback.label)

  return (
    <SurfaceCard tone={result.cardTone}>
      <div className="flex items-start gap-3">
        <span
          aria-label={result.animationLabel}
          className={`result-motion ${result.motionClass}`}
          role="img"
        >
          <span className="result-motion-core">{result.marker}</span>
          <span className="result-motion-spark result-motion-spark-a" />
          <span className="result-motion-spark result-motion-spark-b" />
          <span className="result-motion-spark result-motion-spark-c" />
        </span>
        <div className="min-w-0">
          <p className={`text-base font-black ${result.textClass}`}>{result.headline}</p>
          <p className="mt-1 text-xs font-black text-muted">{result.statusLabel}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted">{feedback.summary}</p>
          <div className="mt-4 space-y-3 text-sm">
            {feedback.strengths.length > 0 ? (
              <div>
                <p className="font-black">잘한 부분</p>
                <ul className="mt-1 space-y-1 font-semibold leading-6 text-leaf">
                  {feedback.strengths.map((strength) => (
                    <li key={strength}>{strength}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <p className="font-black">빠진 개념</p>
              <p className="mt-1 font-semibold leading-6 text-muted">
                {feedback.missingConcepts[0] ?? "필수 개념 누락은 없습니다."}
              </p>
            </div>
            <div>
              <p className="font-black">복습 개념</p>
              <p className="mt-1 font-semibold leading-6 text-muted">{reviewConceptLabel}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {difficultyOptions.map((option) => (
              <button
                className="rounded-[8px] border border-line bg-white px-3 py-2 text-xs font-black transition active:bg-banana"
                key={option.value}
                onClick={() => onSaveDifficulty(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          {difficultySaved ? (
            <p className="mt-3 text-xs font-black text-leaf">{difficultySaved}</p>
          ) : null}
          {difficultyError ? (
            <p className="mt-3 text-xs font-black text-coral">{difficultyError}</p>
          ) : null}
        </div>
      </div>
    </SurfaceCard>
  )
}

function feedbackResultPresentation(label: string): FeedbackResultPresentation {
  switch (label) {
    case "Stable":
      return {
        animationLabel: "정답 축하 애니메이션",
        cardTone: "accent",
        headline: "정답이에요",
        marker: "+",
        motionClass: "result-motion-stable",
        statusLabel: "좋아요. 맞춘 부분을 먼저 확인해요.",
        textClass: "text-leaf",
      }
    case "Needs review":
      return {
        animationLabel: "복습 안내 애니메이션",
        cardTone: "warm",
        headline: "다시 짚어볼게요",
        marker: "!",
        motionClass: "result-motion-review",
        statusLabel: "복습 필요",
        textClass: "text-coral",
      }
    default:
      return {
        animationLabel: "보완 안내 애니메이션",
        cardTone: "plain",
        headline: "거의 다 왔어요",
        marker: "+",
        motionClass: "result-motion-partial",
        statusLabel: "보완 필요",
        textClass: "text-banana-ink",
      }
  }
}
