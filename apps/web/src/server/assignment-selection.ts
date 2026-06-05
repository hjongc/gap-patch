import type { AppState, ConceptId, User } from "./app-model"
import type { ApprovedProblemVersion } from "./problem-bank"
import { approvedProblemsForSubjects } from "./problem-bank"

const recentAssignmentLimit = 5

export function selectDailyProblem(state: AppState, user: User): ApprovedProblemVersion | null {
  const candidates = preferredDifficultyPool(
    approvedProblemsForSubjects(user.selectedSubjects),
    user.difficulty,
  )
  const recentAssignments = recentAssignmentsForUser(state, user.id)
  const weakConceptId = weakestConceptIdForUser(state, user.id)

  if (weakConceptId) {
    const weakConceptCandidates = candidates.filter(
      (candidate) => candidate.conceptId === weakConceptId,
    )
    const weakProblem = firstWithoutRecentProblem(weakConceptCandidates, recentAssignments)
    if (weakProblem) {
      return weakProblem
    }
  }

  const freshConceptCandidates = withoutRecentConcepts(candidates, recentAssignments)
  return (
    firstWithoutRecentProblem(freshConceptCandidates, recentAssignments) ??
    firstWithoutRecentProblem(candidates, recentAssignments) ??
    firstCandidate(candidates)
  )
}

function preferredDifficultyPool(
  candidates: readonly ApprovedProblemVersion[],
  difficulty: User["difficulty"],
): readonly ApprovedProblemVersion[] {
  const matches = candidates.filter((candidate) => candidate.difficulty === difficulty)
  return matches.length > 0 ? matches : candidates
}

function recentAssignmentsForUser(state: AppState, userId: string) {
  return [...state.assignmentsByKey.values()]
    .filter((assignment) => assignment.userId === userId)
    .sort((left, right) => right.localDate.localeCompare(left.localDate))
    .slice(0, recentAssignmentLimit)
}

function weakestConceptIdForUser(state: AppState, userId: string): ConceptId | null {
  const weakConcepts = [...state.masteryByUserConceptKey.values()]
    .filter((mastery) => mastery.userId === userId && mastery.stability < 0.85)
    .sort((left, right) => left.stability - right.stability)
  for (const mastery of weakConcepts) {
    return mastery.conceptId
  }
  return null
}

function withoutRecentConcepts(
  candidates: readonly ApprovedProblemVersion[],
  recentAssignments: ReturnType<typeof recentAssignmentsForUser>,
): readonly ApprovedProblemVersion[] {
  const recentConceptIds = new Set(recentAssignments.map((assignment) => assignment.conceptId))
  return candidates.filter((candidate) => !recentConceptIds.has(candidate.conceptId))
}

function firstWithoutRecentProblem(
  candidates: readonly ApprovedProblemVersion[],
  recentAssignments: ReturnType<typeof recentAssignmentsForUser>,
): ApprovedProblemVersion | null {
  const recentProblemIds = new Set(
    recentAssignments.map((assignment) => assignment.problemVersionId),
  )
  for (const candidate of candidates) {
    if (!recentProblemIds.has(candidate.id)) {
      return candidate
    }
  }
  return null
}

function firstCandidate(
  candidates: readonly ApprovedProblemVersion[],
): ApprovedProblemVersion | null {
  for (const candidate of candidates) {
    return candidate
  }
  return null
}
