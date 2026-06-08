import "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { metadata } from "../../apps/web/src/app/layout"
import HomePage from "../../apps/web/src/app/page"

describe("brand assets", () => {
  it("renders the GapPatch logo on the home screen", () => {
    // Given: the learner opens the first app surface.
    render(<HomePage />)

    // When: the home screen is rendered.
    const logo = screen.getByRole("img", { name: "GapPatch logo" })

    // Then: the brand mark is visible and backed by the workspace logo asset.
    expect(logo).toBeVisible()
    expect(logo).toHaveAttribute("src", "/brand/gappatch-logo.svg")
  })

  it("publishes favicon and app icon metadata", () => {
    // Given: Next.js reads the root metadata export.
    const icons = metadata.icons

    // When: icons are configured for browser and install surfaces.
    // Then: the app exposes the favicon, app icon, and apple touch icon.
    expect(icons).toMatchObject({
      apple: [{ url: "/brand/apple-touch-icon.svg", type: "image/svg+xml" }],
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/brand/gappatch-icon.svg", type: "image/svg+xml", sizes: "any" },
      ],
      shortcut: ["/favicon.svg"],
    })
  })
})
