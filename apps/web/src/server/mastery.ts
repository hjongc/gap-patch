import type { AppState, Assignment, Feedback, PerceivedDifficulty, ReviewItem } from "./app-model"
import { subjectLabels } from "./app-model"

export function updateMastery(
  state: AppState,
  userId: string,
  assignment: Assignment,
  feedback: Feedback,
  perceivedDifficulty: PerceivedDifficulty | undefined,
): void {
  const key = masteryKey(userId, assignment.conceptId)
  const stability = Math.max(
    0,
    Math.min(1, feedback.score - difficultyPenalty(perceivedDifficulty)),
  )
  state.masteryByUserConceptKey.set(key, {
    conceptId: assignment.conceptId,
    conceptLabel: assignment.conceptLabel,
    lastMisconception: feedback.misconceptions[0],
    lastScore: feedback.score,
    nextReviewAt: nextReviewDateFor(feedback.label, perceivedDifficulty),
    perceivedDifficulty,
    stability,
    userId,
  })
}

export function reviewItemsForUser(state: AppState, userId: string): readonly ReviewItem[] {
  return [...state.masteryByUserConceptKey.values()]
    .filter((mastery) => mastery.userId === userId && mastery.stability < 0.85)
    .map((mastery) => {
      const assignment = latestAssignmentForConcept(state, userId, mastery.conceptId)
      return {
        conceptId: mastery.conceptId,
        conceptLabel: mastery.conceptLabel,
        label: mastery.stability < 0.5 ? "Needs review" : "Partial",
        lastScenarioLabel: assignment?.scenarioLabel ?? "Practice",
        nextReviewAt: mastery.nextReviewAt,
        perceivedDifficulty: mastery.perceivedDifficulty,
        reason:
          mastery.lastMisconception ??
          "Review this concept with a different scenario before marking it stable.",
        subjectId: assignment?.subjectId ?? "computer-networking",
        subjectLabel: subjectLabels[assignment?.subjectId ?? "computer-networking"],
      } satisfies ReviewItem
    })
}

function latestAssignmentForConcept(
  state: AppState,
  userId: string,
  conceptId: Assignment["conceptId"],
): Assignment | null {
  const assignments = [...state.assignmentsByKey.values()].filter(
    (assignment) => assignment.userId === userId && assignment.conceptId === conceptId,
  )
  return assignments.at(-1) ?? null
}

function masteryKey(userId: string, conceptId: Assignment["conceptId"]): string {
  return `${userId}:${conceptId}`
}

function difficultyPenalty(perceivedDifficulty: PerceivedDifficulty | undefined): number {
  if (perceivedDifficulty === "hard") {
    return 0.12
  }
  if (perceivedDifficulty === "easy") {
    return -0.04
  }
  return 0
}

function nextReviewDateFor(
  label: Feedback["label"],
  perceivedDifficulty: PerceivedDifficulty | undefined,
): string {
  const days = label === "Stable" && perceivedDifficulty !== "hard" ? 7 : 2
  const date = new Date("2026-06-05T00:00:00.000Z")
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
