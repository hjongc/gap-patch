import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import TodayPage from "../../apps/web/src/app/today/page"

const kyMocks = vi.hoisted(() => ({
  get: vi.fn(() => ({
    json: async () => ({
      ok: true,
      assignment: {
        id: "assignment-ai",
        subjectId: "ai-ml-foundations",
        title: "Gradient descent check",
        prompt: "What does a learning rate control during optimization?",
      },
    }),
  })),
  post: vi.fn(),
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
})
