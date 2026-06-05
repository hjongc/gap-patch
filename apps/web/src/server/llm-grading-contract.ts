import { z } from "zod"

import type { ConceptId, Feedback } from "./app-model"

const conceptIdValues = [
  "networking.tcp.layer-ownership",
  "networking.dns.caching",
  "ai.overfitting.generalization",
] as const satisfies readonly ConceptId[]

const gradingFeedbackSchema = z.object({
  confidence: z.number().min(0).max(1),
  label: z.enum(["Stable", "Partial", "Needs review"]),
  missingConcepts: z.array(z.string().min(1)).max(4),
  misconceptions: z.array(z.string().min(1)).max(4),
  reviewConcepts: z.array(z.enum(conceptIdValues)).max(4),
  score: z.number().min(0).max(1),
  strengths: z.array(z.string().min(1)).max(4),
  summary: z.string().min(1).max(500),
})

export const gradingFeedbackJsonSchema = {
  additionalProperties: false,
  properties: {
    confidence: { maximum: 1, minimum: 0, type: "number" },
    label: { enum: ["Stable", "Partial", "Needs review"], type: "string" },
    missingConcepts: {
      items: { type: "string" },
      maxItems: 4,
      type: "array",
    },
    misconceptions: {
      items: { type: "string" },
      maxItems: 4,
      type: "array",
    },
    reviewConcepts: {
      items: { enum: conceptIdValues, type: "string" },
      maxItems: 4,
      type: "array",
    },
    score: { maximum: 1, minimum: 0, type: "number" },
    strengths: {
      items: { type: "string" },
      maxItems: 4,
      type: "array",
    },
    summary: { maxLength: 500, minLength: 1, type: "string" },
  },
  required: [
    "score",
    "label",
    "summary",
    "strengths",
    "missingConcepts",
    "misconceptions",
    "reviewConcepts",
    "confidence",
  ],
  type: "object",
} as const

export type GradingFeedbackParseResult =
  | {
      readonly kind: "ok"
      readonly feedback: Feedback
    }
  | {
      readonly kind: "error"
    }

export function parseGradingFeedbackContent(content: string): GradingFeedbackParseResult {
  const parsedJson = parseJson(content)
  if (parsedJson.kind === "error") {
    return parsedJson
  }

  const feedback = gradingFeedbackSchema.safeParse(parsedJson.value)
  if (!feedback.success) {
    return { kind: "error" }
  }
  return { feedback: feedback.data, kind: "ok" }
}

type JsonParseResult =
  | {
      readonly kind: "ok"
      readonly value: unknown
    }
  | {
      readonly kind: "error"
    }

function parseJson(content: string): JsonParseResult {
  try {
    const value: unknown = JSON.parse(content)
    return { kind: "ok", value }
  } catch (caught) {
    if (caught instanceof SyntaxError) {
      return { kind: "error" }
    }
    throw caught
  }
}
