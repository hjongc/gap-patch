import type { Feedback, SubmissionInput } from "./app-model"
import type { ApprovedProblemVersion } from "./problem-bank"

export type GradingRequest = {
  readonly problem: ApprovedProblemVersion
  readonly input: SubmissionInput
}

export interface GradingProvider {
  grade(request: GradingRequest): Feedback
}

export const deterministicGradingProvider: GradingProvider = {
  grade(request) {
    return gradeDeterministically(request)
  },
}

function gradeDeterministically(request: GradingRequest): Feedback {
  if (request.problem.conceptId === "networking.tcp.layer-ownership") {
    return gradeTcpLayerOwnership(request.input.answer)
  }
  if (request.problem.conceptId === "networking.dns.caching") {
    return gradeDnsCaching(request.input.answer)
  }
  return gradeGeneralExplanation(request.input.answer)
}

function gradeTcpLayerOwnership(answerText: string): Feedback {
  const answer = answerText.toLowerCase()
  const namesTcp = answer.includes("tcp")
  const namesTransport = answer.includes("transport")
  const confusesApplication = answer.includes("application")
  const separatesPolicy = answer.includes("policy") || answer.includes("application")

  if (namesTcp && namesTransport && !confusesApplication) {
    return {
      confidence: 0.92,
      label: "Stable",
      missingConcepts: [],
      misconceptions: [],
      reviewConcepts: [],
      score: 1,
      strengths: ["Identified TCP retransmission as transport-layer behavior."],
      summary:
        "Correct: TCP owns segment retransmission at the transport layer. Application code may define request-level retry policy, but it does not retransmit TCP segments.",
    }
  }

  return {
    confidence: 0.86,
    label: confusesApplication ? "Needs review" : "Partial",
    missingConcepts: [
      separatesPolicy
        ? "Application-level retry policy is different from TCP segment retransmission."
        : "Explain what responsibility remains at the application layer.",
    ],
    misconceptions: confusesApplication
      ? ["Application layer owns TCP retransmission behavior."]
      : [],
    reviewConcepts: ["networking.tcp.layer-ownership"],
    score: confusesApplication ? 0.4 : 0.72,
    strengths: namesTcp ? ["Recognized TCP as part of the answer."] : [],
    summary:
      "TCP retransmission is transport-layer behavior. The application layer can own higher-level retry policy, timeouts, and user-visible failure handling.",
  }
}

function gradeDnsCaching(answerText: string): Feedback {
  const answer = answerText.toLowerCase()
  const namesDns = answer.includes("dns")
  const namesCache = answer.includes("cache") || answer.includes("caching")
  const namesTtl = answer.includes("ttl") || answer.includes("time to live")

  if (namesDns && namesCache && namesTtl) {
    return {
      confidence: 0.9,
      label: "Stable",
      missingConcepts: [],
      misconceptions: [],
      reviewConcepts: [],
      score: 1,
      strengths: ["Connected DNS caching and TTL to rollout lag."],
      summary:
        "Correct: DNS answers can remain cached until TTL expires, so some clients may continue using the old address during a rollout.",
    }
  }

  return {
    confidence: 0.82,
    label: "Partial",
    missingConcepts: namesTtl
      ? ["Name where DNS answers are cached."]
      : ["Connect TTL to how long cached DNS answers can remain visible."],
    misconceptions: [],
    reviewConcepts: ["networking.dns.caching"],
    score: 0.65,
    strengths: namesDns ? ["Recognized DNS as part of the rollout behavior."] : [],
    summary:
      "DNS rollout lag often comes from resolver or client caches keeping the old answer until its TTL expires.",
  }
}

function gradeGeneralExplanation(answerText: string): Feedback {
  const answer = answerText.toLowerCase()
  const recognizesGap = answer.includes("validation") && answer.includes("training")
  const namesMitigation =
    answer.includes("regularization") || answer.includes("more data") || answer.includes("dropout")

  return {
    confidence: 0.8,
    label: recognizesGap && namesMitigation ? "Stable" : "Partial",
    missingConcepts: namesMitigation ? [] : ["Name one mitigation for overfitting."],
    misconceptions: [],
    reviewConcepts: recognizesGap && namesMitigation ? [] : ["ai.overfitting.generalization"],
    score: recognizesGap && namesMitigation ? 1 : 0.65,
    strengths: recognizesGap ? ["Connected train/validation gap to generalization risk."] : [],
    summary:
      "Overfitting appears when training performance improves while validation performance lags. Mitigations include regularization, more data, dropout, or simpler models.",
  }
}
