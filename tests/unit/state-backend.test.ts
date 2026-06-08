import { describe, expect, it } from "vitest"

import { resolveStateBackend } from "../../apps/web/src/server/state-backend"

describe("state backend resolution", () => {
  it("Given DATABASE_URL When resolving backend Then uses Postgres", () => {
    const backend = resolveStateBackend({
      cwd: "/srv/gappatch",
      env: {
        DATABASE_URL: "postgresql://gappatch:placeholder@db:5432/gappatch",
        GAPPATCH_DATA_FILE: "/data/state.json",
      },
    })

    expect(backend.kind).toBe("postgres")
    if (backend.kind !== "postgres") {
      throw new Error("expected Postgres backend")
    }
    expect(backend.legacyFilePath).toBe("/data/state.json")
    expect(backend.cacheKey).toMatch(/^postgres:[a-f0-9]{16}$/)
  })

  it("Given no DATABASE_URL When resolving backend Then keeps the file store", () => {
    const backend = resolveStateBackend({
      cwd: "/srv/gappatch",
      env: {
        GAPPATCH_DATA_FILE: "/data/state.json",
      },
    })

    expect(backend).toEqual({
      filePath: "/data/state.json",
      kind: "file",
    })
  })

  it("Given no durable env When resolving backend Then uses the development file", () => {
    const backend = resolveStateBackend({
      cwd: "/srv/gappatch",
      env: {},
    })

    expect(backend).toEqual({
      filePath: "/srv/gappatch/.gappatch-data/state.json",
      kind: "file",
    })
  })
})
