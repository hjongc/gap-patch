import { SurfaceCard } from "../ui"
import {
  type Assignment,
  type DifficultyOptionValue,
  difficultyOptions,
  displayFeedbackVerdict,
  type SubmissionResponse,
} from "./today-model"

type SubmissionFeedbackCardProps = {
  readonly assignment: Assignment
  readonly difficultyError: string | null
  readonly difficultySaved: string | null
  readonly feedback: SubmissionResponse["feedback"]
  readonly onSaveDifficulty: (perceivedDifficulty: DifficultyOptionValue) => void
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

  return (
    <SurfaceCard tone="warm">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-banana text-sm font-black text-banana-ink">
          +
        </span>
        <div>
          <p className="text-base font-black text-coral">
            {displayFeedbackVerdict(feedback.label)}
          </p>
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
