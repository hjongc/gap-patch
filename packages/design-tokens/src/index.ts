export const designTokens = {
  color: {
    background: "oklch(0.985 0.004 95)",
    foreground: "oklch(0.18 0.018 245)",
    muted: "oklch(0.55 0.02 245)",
    border: "oklch(0.86 0.012 245)",
    accent: "oklch(0.58 0.12 182)",
    warning: "oklch(0.72 0.14 72)",
    danger: "oklch(0.58 0.16 25)",
  },
  radius: {
    card: 8,
    control: 6,
  },
  motion: {
    reducedMotionPolicy: "respect-user",
    fastMs: 140,
    normalMs: 220,
  },
} as const
