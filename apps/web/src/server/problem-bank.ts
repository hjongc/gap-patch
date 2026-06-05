import type { SubjectId } from "@gappatch/domain"
import type {
  ConceptId,
  Difficulty,
  GenerationPolicy,
  GenerationSource,
  ProblemVersionSummary,
  ScenarioFrame,
} from "./app-model"
import { subjectLabels } from "./app-model"

export type RubricCriterion = {
  readonly id: string
  readonly description: string
  readonly required: boolean
}

export type ApprovedProblemVersion = {
  readonly id: string
  readonly rubricVersionId: string
  readonly status: "approved"
  readonly subjectId: SubjectId
  readonly conceptId: ConceptId
  readonly conceptLabel: string
  readonly scenarioFrame: ScenarioFrame
  readonly scenarioLabel: string
  readonly difficulty: Difficulty
  readonly generationSource: GenerationSource
  readonly title: string
  readonly prompt: string
  readonly answerGuidance: string
  readonly assignmentReason: string
  readonly rubric: readonly RubricCriterion[]
  readonly targetProblemCount: number
}

export const generationPolicy: GenerationPolicy = {
  batchGenerationUnit: "content_slot",
  defaultSource: "approved_problem_pool",
  realtimePerUserGeneration: false,
}

export const approvedProblemVersions = [
  {
    id: "problem-networking-tcp-layer-ownership-debugging-foundation-v1",
    rubricVersionId: "rubric-networking-tcp-layer-ownership-v1",
    status: "approved",
    subjectId: "computer-networking",
    conceptId: "networking.tcp.layer-ownership",
    conceptLabel: "TCP layer ownership",
    scenarioFrame: "debugging-log",
    scenarioLabel: "Debugging log",
    difficulty: "foundation",
    generationSource: "approved_problem_pool",
    title: "TCP layer ownership during retransmission",
    prompt:
      "A service log shows packet loss followed by TCP retransmissions. Which layer owns the retransmission behavior, and what should the application layer own instead?",
    answerGuidance:
      "Answer in 2-5 sentences. Name the responsible layer and separate it from app-level retry policy.",
    assignmentReason:
      "weak-spot probe: TCP layer ownership is a common source of confusion, and this version uses a debugging-log scenario to avoid repeating the same wording.",
    rubric: [
      {
        id: "tcp-transport-owner",
        description: "Identifies TCP retransmission as transport-layer behavior.",
        required: true,
      },
      {
        id: "application-policy-separation",
        description: "Separates TCP segment retransmission from application-level retry policy.",
        required: true,
      },
    ],
    targetProblemCount: 10,
  },
  {
    id: "problem-ai-overfitting-generalization-interview-foundation-v1",
    rubricVersionId: "rubric-ai-overfitting-generalization-v1",
    status: "approved",
    subjectId: "ai-ml-foundations",
    conceptId: "ai.overfitting.generalization",
    conceptLabel: "Overfitting and generalization",
    scenarioFrame: "interview-answer",
    scenarioLabel: "Interview answer",
    difficulty: "foundation",
    generationSource: "approved_problem_pool",
    title: "Overfitting in a model review",
    prompt:
      "During a model review, validation metrics lag behind training metrics. Explain why this may indicate overfitting and name one mitigation.",
    answerGuidance: "Answer in 2-5 sentences. Compare training and validation behavior.",
    assignmentReason:
      "Coverage rotation: AI/ML foundations needs approved practice coverage alongside networking.",
    rubric: [
      {
        id: "generalization-gap",
        description: "Connects training-validation gap to weak generalization.",
        required: true,
      },
      {
        id: "mitigation",
        description: "Names a plausible mitigation such as regularization or more data.",
        required: true,
      },
    ],
    targetProblemCount: 10,
  },
] as const satisfies readonly ApprovedProblemVersion[]

export function approvedProblemsForSubjects(
  subjects: readonly SubjectId[],
): readonly ApprovedProblemVersion[] {
  const selected = approvedProblemVersions.filter((problem) => subjects.includes(problem.subjectId))
  return selected.length > 0 ? selected : approvedProblemVersions
}

export function problemById(problemVersionId: string): ApprovedProblemVersion | null {
  return approvedProblemVersions.find((problem) => problem.id === problemVersionId) ?? null
}

export function problemVersionSummaries(): readonly ProblemVersionSummary[] {
  return approvedProblemVersions.map((problem) => ({
    conceptId: problem.conceptId,
    difficulty: problem.difficulty,
    id: problem.id,
    scenarioFrame: problem.scenarioFrame,
    status: problem.status,
    subjectId: problem.subjectId,
    title: problem.title,
  }))
}

export function coverageSlots() {
  return approvedProblemVersions.map((problem) => ({
    approvedProblemCount: 1,
    conceptId: problem.conceptId,
    conceptLabel: problem.conceptLabel,
    difficulty: problem.difficulty,
    scenarioFrame: problem.scenarioFrame,
    scenarioLabel: problem.scenarioLabel,
    slotId: `${problem.conceptId}:${problem.scenarioFrame}:${problem.difficulty}`,
    subjectId: problem.subjectId,
    subjectLabel: subjectLabels[problem.subjectId],
    targetProblemCount: problem.targetProblemCount,
  }))
}
