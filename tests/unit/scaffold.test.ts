import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { designTokens } from "@gappatch/design-tokens"
import { productIdentity } from "@gappatch/product"
import { describe, expect, it } from "vitest"

describe("workspace scaffold", () => {
  it("exposes product identity and mobile design tokens", () => {
    expect(productIdentity.koreanName).toBe("빈틈패치")
    expect(productIdentity.englishName).toBe("GapPatch")
    expect(designTokens.radius.card).toBeLessThanOrEqual(8)
    expect(designTokens.motion.reducedMotionPolicy).toBe("respect-user")
  })

  it("honors reduced-motion preferences for app animations", async () => {
    const css = await readFile(join(process.cwd(), "apps/web/src/app/globals.css"), "utf8")

    expect(css).toContain("@media (prefers-reduced-motion: reduce)")
    expect(css).toContain(".motion-rise")
  })
})
