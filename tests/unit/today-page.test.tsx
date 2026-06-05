import "@testing-library/jest-dom/vitest"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import TodayPage from "../../apps/web/src/app/today/page"

const kyMocks = vi.hoisted(() => ({
  get: vi.fn(() => ({
    json: async () => ({
      ok: true,
      assignment: {
        answerGuidance: "2-5문장으로 답해 주세요.",
        assignmentReason: "AI/ML 기초를 함께 연습하기 위해 출제했습니다.",
        conceptLabel: "과적합과 일반화",
        estimatedDifficulty: "foundation",
        generationSource: "approved_problem_pool",
        id: "assignment-ai",
        problemVersionId: "problem-ai-overfitting-generalization-interview-foundation-v1",
        prompt: "검증 지표가 학습 지표를 따라오지 않는 이유를 설명해 주세요.",
        rubricVersionId: "rubric-ai-overfitting-generalization-v1",
        scenarioLabel: "면접 답변",
        subjectId: "ai-ml-foundations",
        title: "모델 리뷰에서 보이는 과적합 신호",
      },
    }),
  })),
  post: vi.fn(() => ({
    json: async () => ({
      feedback: {
        label: "Partial",
        missingConcepts: ["완화 방법을 하나 제시해 주세요."],
        misconceptions: [],
        reviewConcepts: ["ai.overfitting.generalization"],
        strengths: ["학습/검증 성능 차이를 일반화 위험과 연결했습니다."],
        summary: "조금 더 보완해 주세요.",
      },
      ok: true,
    }),
  })),
}))

vi.mock("ky", () => ({
  default: {
    get: kyMocks.get,
    post: kyMocks.post,
  },
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/today",
}))

describe("TodayPage", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("renders the subject badge from the assignment subject id", async () => {
    render(<TodayPage />)

    expect(await screen.findByText("AI/ML")).toBeVisible()
    expect(screen.queryByText("network")).not.toBeInTheDocument()
  })

  it("does not render internal assignment metadata chips", async () => {
    render(<TodayPage />)

    expect(await screen.findByText("모델 리뷰에서 보이는 과적합 신호")).toBeVisible()
    expect(screen.queryByText("검수 완료")).not.toBeInTheDocument()
    expect(screen.queryByText("기초")).not.toBeInTheDocument()
    expect(screen.queryByText("개념: 과적합과 일반화")).not.toBeInTheDocument()
    expect(screen.queryByText("foundation")).not.toBeInTheDocument()
  })

  it("shows visible grading progress when the learner submits an answer", async () => {
    // Given: grading is intentionally held open after the assignment loads.
    let releaseSubmission: (() => void) | undefined
    kyMocks.post.mockImplementationOnce(() => ({
      json: async () =>
        new Promise((resolve) => {
          releaseSubmission = () =>
            resolve({
              feedback: {
                label: "Partial",
                missingConcepts: ["완화 방법을 하나 제시해 주세요."],
                misconceptions: [],
                reviewConcepts: ["ai.overfitting.generalization"],
                strengths: [],
                summary: "조금 더 보완해 주세요.",
              },
              ok: true,
            })
        }),
    }))

    render(<TodayPage />)
    await screen.findByText("AI/ML")

    // When: the learner submits a non-empty answer.
    fireEvent.change(screen.getByLabelText(/내 답안/), {
      target: { value: "검증 성능이 낮아지는 것은 과적합 신호입니다." },
    })
    fireEvent.click(screen.getByRole("button", { name: "답안 제출" }))

    // Then: the submit surface confirms that grading is still in progress.
    const busyButton = await screen.findByRole("button", { name: "채점 중..." })
    expect(busyButton).toBeDisabled()
    expect(busyButton).toHaveAttribute("aria-busy", "true")
    expect(screen.getByText("답안을 채점하고 있어요")).toBeVisible()

    await act(async () => {
      releaseSubmission?.()
    })
    expect(await screen.findByText("보완 필요")).toBeVisible()
    expect(screen.getByText("조금 더 보완해 주세요.")).toBeVisible()
    expect(screen.queryByText("Partial")).not.toBeInTheDocument()
    expect(screen.queryByText("ai.overfitting.generalization")).not.toBeInTheDocument()
  })

  it("shows strengths and missing concepts after grading", async () => {
    kyMocks.post.mockImplementationOnce(() => ({
      json: async () => ({
        feedback: {
          label: "Partial",
          missingConcepts: ["애플리케이션 계층에 남는 책임을 함께 설명해 주세요."],
          misconceptions: [],
          reviewConcepts: ["networking.tcp.layer-ownership"],
          strengths: ["TCP 재전송을 전송 계층 동작으로 구분했습니다."],
          summary: "TCP 재전송은 전송 계층 동작입니다.",
        },
        ok: true,
      }),
    }))

    render(<TodayPage />)
    await screen.findByText("AI/ML")

    fireEvent.change(screen.getByLabelText(/내 답안/), {
      target: { value: "트랜스포트 레이어 아님?" },
    })
    fireEvent.click(screen.getByRole("button", { name: "답안 제출" }))

    expect(await screen.findByText("잘한 부분")).toBeVisible()
    expect(screen.getByText("TCP 재전송을 전송 계층 동작으로 구분했습니다.")).toBeVisible()
    expect(screen.getByText("빠진 개념")).toBeVisible()
    expect(screen.getByText("애플리케이션 계층에 남는 책임을 함께 설명해 주세요.")).toBeVisible()
  })

  it("renders a credible loading state before the assignment arrives", () => {
    kyMocks.get.mockImplementationOnce(() => ({
      json: async () => new Promise(() => {}),
    }))

    render(<TodayPage />)

    expect(screen.getByText("오늘의 패치를 준비 중...")).toBeVisible()
  })

  it("renders a recovery message when the assignment cannot load", async () => {
    kyMocks.get.mockImplementationOnce(() => ({
      json: async () => {
        throw new Error("network down")
      },
    }))

    render(<TodayPage />)

    expect(await screen.findByText("오늘의 문제를 불러오지 못했습니다.")).toBeVisible()
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeVisible()
  })
})
