import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import TodayPage from "../../apps/web/src/app/today/page"

const kyMocks = vi.hoisted(() => ({
  get: vi.fn(() => ({
    json: async () => ({
      ok: true,
      assignment: {
        answerGuidance: "Answer in 2-5 sentences.",
        assignmentReason: "Coverage rotation for production practice.",
        conceptLabel: "Overfitting and generalization",
        estimatedDifficulty: "foundation",
        generationSource: "approved_problem_pool",
        id: "assignment-ai",
        problemVersionId: "problem-ai-overfitting-generalization-interview-foundation-v1",
        prompt: "What does a learning rate control during optimization?",
        rubricVersionId: "rubric-ai-overfitting-generalization-v1",
        scenarioLabel: "Interview answer",
        subjectId: "ai-ml-foundations",
        title: "Gradient descent check",
      },
    }),
  })),
  post: vi.fn(() => ({
    json: async () => ({
      feedback: {
        label: "Partial",
        missingConcepts: ["Name one mitigation."],
        misconceptions: [],
        reviewConcepts: ["ai.overfitting.generalization"],
        strengths: [],
        summary: "Tighten the answer.",
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
    vi.clearAllMocks()
  })

  it("renders the subject badge from the assignment subject id", async () => {
    render(<TodayPage />)

    expect(await screen.findByText("AI/ML")).toBeVisible()
    expect(screen.queryByText("network")).not.toBeInTheDocument()
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
