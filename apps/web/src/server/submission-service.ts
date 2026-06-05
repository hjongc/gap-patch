import type {
  AppState,
  Assignment,
  Feedback,
  PerceivedDifficulty,
  ServiceError,
  SubmissionInput,
  SubmissionResult,
  User,
} from "./app-model"
import type { GradingProvider, GradingRequest } from "./grading"
import { reviewItemsForUser, updateMastery } from "./mastery"
import type { ApprovedProblemVersion } from "./problem-bank"
import { problemById } from "./problem-bank"
import { assignmentForUser, userForSession } from "./session-state"

export interface AsyncGradingProvider {
  grade(request: GradingRequest): Promise<Feedback>
}

type PreparedSubmission =
  | {
      readonly kind: "ok"
      readonly assignment: Assignment
      readonly perceivedDifficulty?: PerceivedDifficulty | undefined
      readonly problem: ApprovedProblemVersion
      readonly user: User
    }
  | ServiceError

export function submitAnswerSync(
  state: AppState,
  sessionId: string,
  input: SubmissionInput,
  gradingProvider: GradingProvider,
  now = new Date(),
): SubmissionResult {
  const prepared = prepareSubmission(state, sessionId, input)
  if (prepared.kind === "error") {
    return prepared
  }

  const feedback = gradingProvider.grade({ input, problem: prepared.problem })
  return recordSubmission(state, prepared, feedback, now)
}

export async function submitAnswerAsync(
  state: AppState,
  sessionId: string,
  input: SubmissionInput,
  gradingProvider: GradingProvider | AsyncGradingProvider,
  now = new Date(),
): Promise<SubmissionResult> {
  const prepared = prepareSubmission(state, sessionId, input)
  if (prepared.kind === "error") {
    return prepared
  }

  const feedback = await gradingProvider.grade({ input, problem: prepared.problem })
  return recordSubmission(state, prepared, feedback, now)
}

function prepareSubmission(
  state: AppState,
  sessionId: string,
  input: SubmissionInput,
): PreparedSubmission {
  const user = userForSession(state, sessionId)
  if (
    !user ||
    input.assignmentId.length === 0 ||
    input.answer.trim().length === 0 ||
    !isPerceivedDifficultyInput(input.perceivedDifficulty)
  ) {
    return { kind: "error", code: "invalid_submission", status: 400 }
  }

  const assignment = assignmentForUser(state, user.id, input.assignmentId)
  if (!assignment) {
    return { kind: "error", code: "invalid_submission", status: 400 }
  }

  const problem = problemById(assignment.problemVersionId)
  if (!problem) {
    return { kind: "error", code: "invalid_submission", status: 400 }
  }

  return { assignment, kind: "ok", perceivedDifficulty: input.perceivedDifficulty, problem, user }
}

function recordSubmission(
  state: AppState,
  prepared: Extract<PreparedSubmission, { readonly kind: "ok" }>,
  feedback: Feedback,
  now: Date,
): SubmissionResult {
  const history = [
    ...(state.historyByUserId.get(prepared.user.id) ?? []).filter(
      (item) => item.assignmentId !== prepared.assignment.id,
    ),
    {
      assignmentId: prepared.assignment.id,
      conceptId: prepared.assignment.conceptId,
      conceptLabel: prepared.assignment.conceptLabel,
      feedback,
      perceivedDifficulty: prepared.perceivedDifficulty,
      problemVersionId: prepared.assignment.problemVersionId,
      rubricVersionId: prepared.assignment.rubricVersionId,
      scenarioLabel: prepared.assignment.scenarioLabel,
      subjectId: prepared.assignment.subjectId,
      title: prepared.assignment.title,
    },
  ]

  updateMastery(
    state,
    prepared.user.id,
    prepared.assignment,
    feedback,
    prepared.perceivedDifficulty,
    now,
  )
  const reviewItems = reviewItemsForUser(state, prepared.user.id)

  state.historyByUserId.set(prepared.user.id, history)
  state.reviewByUserId.set(prepared.user.id, reviewItems)
  return { kind: "ok", feedback, history, reviewItems }
}

function isPerceivedDifficultyInput(
  value: SubmissionInput["perceivedDifficulty"],
): value is "easy" | "right" | "hard" | undefined {
  return value === undefined || value === "easy" || value === "right" || value === "hard"
}
