import { describe, expect, it } from "vitest"

import {
  AzureOpenAiGradingError,
  createAzureOpenAiGradingProvider,
  createRuntimeGradingProvider,
  resolveAzureOpenAiGradingConfig,
} from "../../apps/web/src/server/azure-openai-grading"
import type { GradingRequest } from "../../apps/web/src/server/grading"
import { approvedProblemVersions } from "../../apps/web/src/server/problem-bank"

const gradingRequest = {
  input: {
    assignmentId: "assignment-user-1-2026-06-05",
    answer: "TCP retransmission belongs to the transport layer. Apps own request retry policy.",
    perceivedDifficulty: "right",
  },
  problem: approvedProblemVersions[0],
} satisfies GradingRequest

describe("Azure OpenAI grading provider", () => {
  it("requests structured grading from an Azure OpenAI deployment", async () => {
    const seenRequests: unknown[] = []
    const provider = createAzureOpenAiGradingProvider(
      {
        apiKey: "azure-key",
        deployment: "gap-patch-gpt-5-4-mini",
        endpoint: "https://gap-patch.openai.azure.com",
        timeoutMs: 5000,
      },
      async (request) => {
        seenRequests.push(request)
        return {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  confidence: 0.91,
                  label: "Stable",
                  missingConcepts: [],
                  misconceptions: [],
                  reviewConcepts: [],
                  score: 0.95,
                  strengths: ["Separated TCP retransmission from application retry policy."],
                  summary: "TCP retransmission is transport-layer behavior.",
                }),
              },
            },
          ],
        }
      },
    )

    const feedback = await provider.grade(gradingRequest)

    expect(feedback).toMatchObject({
      label: "Stable",
      reviewConcepts: [],
      score: 0.95,
    })
    expect(seenRequests[0]).toMatchObject({
      body: {
        model: "gap-patch-gpt-5-4-mini",
        response_format: {
          json_schema: {
            name: "gap_patch_grading_feedback",
            strict: true,
          },
          type: "json_schema",
        },
      },
      headers: { "api-key": "azure-key" },
      url: "https://gap-patch.openai.azure.com/openai/v1/chat/completions",
    })
  })

  it("falls back to deterministic grading unless Azure OpenAI is fully configured", async () => {
    const provider = createRuntimeGradingProvider({
      AZURE_OPENAI_API_KEY: "azure-key",
      AZURE_OPENAI_ENDPOINT: "https://gap-patch.openai.azure.com",
      GAPPATCH_GRADING_PROVIDER: "deterministic",
    })

    const feedback = await provider.grade(gradingRequest)

    expect(feedback.label).toBe("Stable")
    expect(feedback.score).toBe(1)
  })

  it("falls back to deterministic grading when Azure OpenAI is unavailable", async () => {
    const provider = createRuntimeGradingProvider(
      {
        AZURE_OPENAI_API_KEY: "azure-key",
        AZURE_OPENAI_ENDPOINT: "https://gap-patch.openai.azure.com",
        AZURE_OPENAI_GRADING_DEPLOYMENT: "gap-patch-gpt-5-4-mini",
        GAPPATCH_GRADING_PROVIDER: "azure-openai",
      },
      async () => {
        throw new AzureOpenAiGradingError("request_timeout", "timeout")
      },
    )

    const feedback = await provider.grade(gradingRequest)

    expect(feedback.label).toBe("Stable")
    expect(feedback.score).toBe(1)
  })

  it("rejects incomplete explicit Azure OpenAI configuration", () => {
    expect(() =>
      resolveAzureOpenAiGradingConfig({
        AZURE_OPENAI_API_KEY: "azure-key",
        AZURE_OPENAI_ENDPOINT: "https://gap-patch.openai.azure.com",
        GAPPATCH_GRADING_PROVIDER: "azure-openai",
      }),
    ).toThrow(AzureOpenAiGradingError)
  })
})
