import "@testing-library/jest-dom/vitest"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import AccountDeletePage from "../../apps/web/src/app/account/delete/page"

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
}))

const kyMocks = vi.hoisted(() => ({
  delete: vi.fn(() => ({
    json: async () => ({ ok: true }),
  })),
}))

vi.mock("ky", () => ({
  default: {
    delete: kyMocks.delete,
  },
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerMocks.push,
  }),
}))

describe("AccountDeletePage", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("submits the account deletion request and returns to login", async () => {
    render(<AccountDeletePage />)

    expect(screen.getByRole("button", { name: "계정 삭제 요청" })).toBeDisabled()

    fireEvent.click(screen.getByLabelText("내 학습 기록 삭제에 동의합니다."))
    fireEvent.click(screen.getByRole("button", { name: "계정 삭제 요청" }))

    await waitFor(() => {
      expect(kyMocks.delete).toHaveBeenCalledWith("/api/account")
    })
    expect(routerMocks.push).toHaveBeenCalledWith("/login")
  })
})
