import ky, { HTTPError, TimeoutError } from "ky"
import { z } from "zod"

import type { Feedback } from "./app-model"
import { deterministicGradingProvider, type GradingRequest } from "./grading"
import { gradingFeedbackJsonSchema, parseGradingFeedbackContent } from "./llm-grading-contract"
import type { AsyncGradingProvider } from "./submission-service"

const defaultTimeoutMs = 8000

export type AzureOpenAiGradingConfig = {
  readonly apiKey: string
  readonly deployment: string
  readonly endpoint: string
  readonly timeoutMs: number
}

export type AzureOpenAiGradingRequest = {
  readonly body: AzureChatCompletionRequest
  readonly headers: Readonly<Record<string, string>>
  readonly timeoutMs: number
  readonly url: string
}

export type AzureOpenAiGradingTransport = (request: AzureOpenAiGradingRequest) => Promise<unknown>

type Env = Readonly<{
  readonly AZURE_OPENAI_API_KEY?: string | undefined
  readonly AZURE_OPENAI_DEPLOYMENT?: string | undefined
  readonly AZURE_OPENAI_ENDPOINT?: string | undefined
  readonly AZURE_OPENAI_GRADING_DEPLOYMENT?: string | undefined
  readonly AZURE_OPENAI_GRADING_TIMEOUT_MS?: string | undefined
  readonly GAPPATCH_GRADING_PROVIDER?: string | undefined
  readonly LLM_API_ENDPOINT?: string | undefined
  readonly LLM_API_KEY?: string | undefined
  readonly LLM_API_VERSION?: string | undefined
  readonly LLM_MODEL?: string | undefined
}>

type AzureChatMessage = {
  readonly role: "system" | "user"
  readonly content: string
}

type AzureChatCompletionRequest = {
  readonly model: string
  readonly messages: readonly AzureChatMessage[]
  readonly max_completion_tokens: number
  readonly response_format: {
    readonly type: "json_schema"
    readonly json_schema: {
      readonly name: "gap_patch_grading_feedback"
      readonly strict: true
      readonly schema: typeof gradingFeedbackJsonSchema
    }
  }
}

export class AzureOpenAiGradingError extends Error {
  readonly code:
    | "incomplete_config"
    | "invalid_config"
    | "invalid_response"
    | "request_failed"
    | "request_timeout"

  constructor(code: AzureOpenAiGradingError["code"], message: string, options?: ErrorOptions) {
    super(message, options)
    this.code = code
    this.name = "AzureOpenAiGradingError"
  }
}

const azureChatCompletionResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().min(1),
        }),
      }),
    )
    .min(1),
})

export function createRuntimeGradingProvider(
  env: Env = currentEnv(),
  transport: AzureOpenAiGradingTransport = postAzureOpenAiJson,
): AsyncGradingProvider {
  const config = resolveAzureOpenAiGradingConfig(env)
  if (!config) {
    return { grade: async (request) => deterministicGradingProvider.grade(request) }
  }

  const azureProvider = createAzureOpenAiGradingProvider(config, transport)
  return {
    async grade(request) {
      try {
        return await azureProvider.grade(request)
      } catch (caught) {
        if (caught instanceof AzureOpenAiGradingError) {
          return deterministicGradingProvider.grade(request)
        }
        throw caught
      }
    },
  }
}

export function resolveAzureOpenAiGradingConfig(env: Env): AzureOpenAiGradingConfig | null {
  if (env.GAPPATCH_GRADING_PROVIDER?.trim() !== "azure-openai") {
    return null
  }

  const apiKey = trimmed(env.AZURE_OPENAI_API_KEY ?? env.LLM_API_KEY)
  const deployment = trimmed(
    env.AZURE_OPENAI_GRADING_DEPLOYMENT ?? env.AZURE_OPENAI_DEPLOYMENT ?? env.LLM_MODEL,
  )
  const endpoint = trimmed(env.AZURE_OPENAI_ENDPOINT ?? env.LLM_API_ENDPOINT)
  if (!apiKey || !deployment || !endpoint) {
    throw new AzureOpenAiGradingError(
      "incomplete_config",
      "Azure OpenAI grading requires endpoint, API key, and deployment/model env values.",
    )
  }

  return {
    apiKey,
    deployment,
    endpoint: normalizeAzureEndpoint(endpoint),
    timeoutMs: parseTimeoutMs(env.AZURE_OPENAI_GRADING_TIMEOUT_MS),
  }
}

export function createAzureOpenAiGradingProvider(
  config: AzureOpenAiGradingConfig,
  transport: AzureOpenAiGradingTransport = postAzureOpenAiJson,
): AsyncGradingProvider {
  return {
    async grade(request) {
      const response = await transport(buildAzureOpenAiRequest(config, request))
      return parseAzureOpenAiFeedback(response)
    },
  }
}

function buildAzureOpenAiRequest(
  config: AzureOpenAiGradingConfig,
  request: GradingRequest,
): AzureOpenAiGradingRequest {
  return {
    body: {
      max_completion_tokens: 700,
      messages: [
        {
          content:
            "You grade short Korean or English CS practice answers. Return only structured JSON. Reward correct concept ownership, penalize misconceptions, and keep feedback concise.",
          role: "system",
        },
        {
          content: JSON.stringify({
            answer: request.input.answer,
            answerGuidance: request.problem.answerGuidance,
            conceptId: request.problem.conceptId,
            prompt: request.problem.prompt,
            rubric: request.problem.rubric,
            title: request.problem.title,
          }),
          role: "user",
        },
      ],
      model: config.deployment,
      response_format: {
        json_schema: {
          name: "gap_patch_grading_feedback",
          schema: gradingFeedbackJsonSchema,
          strict: true,
        },
        type: "json_schema",
      },
    },
    headers: {
      "Content-Type": "application/json",
      "api-key": config.apiKey,
    },
    timeoutMs: config.timeoutMs,
    url: `${config.endpoint}/openai/v1/chat/completions`,
  }
}

async function postAzureOpenAiJson(request: AzureOpenAiGradingRequest): Promise<unknown> {
  try {
    return await ky
      .post(request.url, {
        headers: request.headers,
        json: request.body,
        timeout: request.timeoutMs,
      })
      .json<unknown>()
  } catch (caught) {
    if (caught instanceof HTTPError) {
      throw new AzureOpenAiGradingError(
        "request_failed",
        `Azure OpenAI grading failed with HTTP ${caught.response.status}.`,
        { cause: caught },
      )
    }
    if (caught instanceof TimeoutError) {
      throw new AzureOpenAiGradingError("request_timeout", "Azure OpenAI grading timed out.", {
        cause: caught,
      })
    }
    throw caught
  }
}

function parseAzureOpenAiFeedback(response: unknown): Feedback {
  const parsedResponse = azureChatCompletionResponseSchema.safeParse(response)
  if (!parsedResponse.success) {
    throw new AzureOpenAiGradingError("invalid_response", "Azure OpenAI returned an invalid shape.")
  }

  const [choice] = parsedResponse.data.choices
  if (!choice) {
    throw new AzureOpenAiGradingError("invalid_response", "Azure OpenAI returned no choices.")
  }

  const feedback = parseGradingFeedbackContent(choice.message.content)
  if (feedback.kind === "error") {
    throw new AzureOpenAiGradingError(
      "invalid_response",
      "Azure OpenAI grading JSON did not match the feedback contract.",
    )
  }
  return feedback.feedback
}

function parseTimeoutMs(value: string | undefined): number {
  const normalized = trimmed(value)
  if (!normalized) {
    return defaultTimeoutMs
  }

  const parsed = Number(normalized)
  if (!Number.isInteger(parsed) || parsed < 1000 || parsed > 30000) {
    throw new AzureOpenAiGradingError(
      "invalid_config",
      "AZURE_OPENAI_GRADING_TIMEOUT_MS must be an integer from 1000 to 30000.",
    )
  }
  return parsed
}

function trimmed(value: string | undefined): string | null {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : null
}

function normalizeAzureEndpoint(value: string): string {
  const [withoutQuery] = value.split("?")
  const withoutOpenAiPath = withoutQuery?.split("/openai/")[0] ?? value
  return withoutOpenAiPath.replace(/\/+$/, "")
}

function currentEnv(): Env {
  return {
    AZURE_OPENAI_API_KEY: processEnvValue("AZURE_OPENAI_API_KEY"),
    AZURE_OPENAI_DEPLOYMENT: processEnvValue("AZURE_OPENAI_DEPLOYMENT"),
    AZURE_OPENAI_ENDPOINT: processEnvValue("AZURE_OPENAI_ENDPOINT"),
    AZURE_OPENAI_GRADING_DEPLOYMENT: processEnvValue("AZURE_OPENAI_GRADING_DEPLOYMENT"),
    AZURE_OPENAI_GRADING_TIMEOUT_MS: processEnvValue("AZURE_OPENAI_GRADING_TIMEOUT_MS"),
    GAPPATCH_GRADING_PROVIDER: processEnvValue("GAPPATCH_GRADING_PROVIDER"),
    LLM_API_ENDPOINT: processEnvValue("LLM_API_ENDPOINT"),
    LLM_API_KEY: processEnvValue("LLM_API_KEY"),
    LLM_API_VERSION: processEnvValue("LLM_API_VERSION"),
    LLM_MODEL: processEnvValue("LLM_MODEL"),
  }
}

function processEnvValue(key: keyof Env): string | undefined {
  return process.env[key]
}
