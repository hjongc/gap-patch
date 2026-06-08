import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

describe("production compose file", () => {
  it("runs the app against a durable Postgres service", async () => {
    const compose = await readFile(join(process.cwd(), "compose.yaml"), "utf8")

    expect(compose).toContain("postgres:17-alpine")
    expect(compose).toContain("DATABASE_URL:")
    expect(compose).toContain("GAPPATCH_POSTGRES_PASSWORD")
    expect(compose).toContain("gappatch-postgres:/var/lib/postgresql/data")
    expect(compose).toContain("pg_isready")
    expect(compose).toContain("condition: service_healthy")
  })
})
