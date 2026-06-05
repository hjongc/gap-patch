import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import AdminHealthPage from "../../apps/web/src/app/admin/health/page"

const kyMocks = vi.hoisted(() => ({
  get: vi.fn(() => ({
    json: async () => ({
      ok: true,
      snapshot: {
        checkedAt: "2026-06-05T00:00:00.000Z",
        ok: true,
        runtime: {
          dataFileConfigured: true,
          nodeEnv: "production",
        },
        service: "gappatch-web",
        state: {
          assignments: 4,
          historyItems: 3,
          invites: 2,
          masteryRecords: 5,
          reviewItems: 1,
          sessions: 2,
          users: 2,
        },
      },
    }),
  })),
}))

vi.mock("ky", () => ({
  default: {
    get: kyMocks.get,
  },
}))

describe("AdminHealthPage", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("renders the latest service health snapshot", async () => {
    render(<AdminHealthPage />)

    expect(await screen.findByText("서비스 상태")).toBeVisible()
    expect(screen.getByText("gappatch-web")).toBeVisible()
    expect(screen.getByText("production")).toBeVisible()
    expect(screen.getByText("데이터 파일 설정됨")).toBeVisible()
    expect(screen.getByText("사용자")).toBeVisible()
    expect(screen.getByText("배정")).toBeVisible()
    expect(screen.getByText("복습 항목")).toBeVisible()
  })

  it("renders an admin access error when the snapshot cannot load", async () => {
    kyMocks.get.mockImplementationOnce(() => ({
      json: async () => {
        throw new Error("unauthorized")
      },
    }))

    render(<AdminHealthPage />)

    expect(await screen.findByText("관리자 권한이 필요합니다.")).toBeVisible()
  })
})
