import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

describe("OCI deployment runbook", () => {
  it("documents the approval-gated production deployment path", async () => {
    const runbook = await readFile(join(process.cwd(), "docs/deployment/oci.md"), "utf8")

    expect(runbook).toContain("Do not deploy without explicit approval")
    expect(runbook).toContain("pnpm build")
    expect(runbook).toContain("compose.yaml")
    expect(runbook).toContain("deploy-git-service")
    expect(runbook).toContain("Oracle Cloud Infrastructure")
  })

  it("documents the required OCI deployment inputs before remote changes", async () => {
    const runbook = await readFile(join(process.cwd(), "docs/deployment/oci.md"), "utf8")

    for (const requiredInput of [
      "OCI host",
      "SSH user",
      "deployment directory",
      "domain name",
      "TLS plan",
      "environment values",
      "rollback ref",
      "explicit approval",
    ]) {
      expect(runbook).toContain(requiredInput)
    }
    expect(runbook).toContain("If any required input is missing, stop before SSH")
  })

  it("documents the known non-secret OCI target handoff values", async () => {
    const runbook = await readFile(join(process.cwd(), "docs/deployment/oci.md"), "utf8")

    for (const targetValue of [
      "168.107.18.30",
      "ubuntu",
      "/Users/a11466/.ssh/oci-a1-chuncheon",
      "/home/ubuntu/repos/gappatch",
      "http://168.107.18.30/",
      "GAPPATCH_SECURE_COOKIES=false",
    ]) {
      expect(runbook).toContain(targetValue)
    }
    expect(runbook).toContain("Do not print or copy private key contents")
    expect(runbook).toContain("capture the rollback ref from the server")
  })

  it("keeps the documented web start command executable", async () => {
    const manifest = JSON.parse(
      await readFile(join(process.cwd(), "apps/web/package.json"), "utf8"),
    ) as {
      readonly scripts?: {
        readonly start?: string
      }
    }

    expect(manifest.scripts?.start).toBe("next start")
  })
})
