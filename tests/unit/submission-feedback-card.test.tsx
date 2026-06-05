import "@testing-library/jest-dom/vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { SubmissionFeedbackCard } from "../../apps/web/src/app/today/submission-feedback-card"
import type { Assignment, SubmissionResponse } from "../../apps/web/src/app/today/today-model"

const assignment = {
  answerGuidance: "2-5문장으로 답해 주세요.",
  assignmentReason: "자주 헷갈리는 책임 경계를 짚기 위해 출제했습니다.",
  conceptLabel: "TCP 계층 책임",
  estimatedDifficulty: "foundation",
  generationSource: "approved_problem_pool",
  id: "assignment-networking",
  problemVersionId: "problem-networking-tcp-layer-ownership-debugging-foundation-v1",
  prompt: "TCP 재전송은 어느 계층의 책임일까?",
  rubricVersionId: "rubric-networking-tcp-layer-ownership-v1",
  scenarioLabel: "디버깅 로그",
  subjectId: "computer-networking",
  title: "TCP 재전송은 어느 계층의 책임일까?",
} satisfies Assignment

describe("SubmissionFeedbackCard", () => {
  afterEach(() => {
    cleanup()
  })

  it.each([
    {
      animationLabel: "정답 축하 애니메이션",
      headline: "정답이에요",
      label: "Stable",
    },
    {
      animationLabel: "보완 안내 애니메이션",
      headline: "거의 다 왔어요",
      label: "Partial",
    },
    {
      animationLabel: "복습 안내 애니메이션",
      headline: "다시 짚어볼게요",
      label: "Needs review",
    },
  ])("renders calibrated result motion for $label", ({ animationLabel, headline, label }) => {
    render(
      <SubmissionFeedbackCard
        assignment={assignment}
        difficultyError={null}
        difficultySaved={null}
        feedback={feedbackFor(label)}
        onSaveDifficulty={vi.fn()}
      />,
    )

    expect(screen.getByText(headline)).toBeVisible()
    expect(screen.getByLabelText(animationLabel)).toBeVisible()
  })
})

function feedbackFor(label: string): SubmissionResponse["feedback"] {
  return {
    label,
    missingConcepts: label === "Stable" ? [] : ["앱 수준 책임을 함께 설명해 주세요."],
    misconceptions: label === "Needs review" ? ["책임 계층을 반대로 보았습니다."] : [],
    reviewConcepts: label === "Stable" ? [] : ["networking.tcp.layer-ownership"],
    strengths: label === "Needs review" ? [] : ["TCP 재전송 계층을 짚었습니다."],
    summary: "채점 요약입니다.",
  }
}
