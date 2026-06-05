import type { SubjectId } from "@gappatch/domain"
import type {
  Assignment,
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
    conceptLabel: "TCP 계층 책임",
    scenarioFrame: "debugging-log",
    scenarioLabel: "디버깅 로그",
    difficulty: "foundation",
    generationSource: "approved_problem_pool",
    title: "TCP 재전송은 어느 계층의 책임일까?",
    prompt:
      "서비스 로그에서 패킷 손실 뒤 TCP 재전송이 이어졌습니다. 이 재전송 동작은 어느 계층이 맡고, 애플리케이션 계층은 대신 어떤 책임을 가져야 할까요?",
    answerGuidance:
      "2-5문장으로 답해 주세요. 재전송을 맡는 계층과 앱 수준 재시도 정책을 구분해 주세요.",
    assignmentReason: "자주 헷갈리는 TCP 책임 경계를 짚기 위해 디버깅 로그 상황으로 출제했습니다.",
    rubric: [
      {
        id: "tcp-transport-owner",
        description: "TCP 재전송을 전송 계층 동작으로 식별한다.",
        required: true,
      },
      {
        id: "application-policy-separation",
        description: "TCP 세그먼트 재전송과 애플리케이션 수준 재시도 정책을 구분한다.",
        required: true,
      },
    ],
    targetProblemCount: 10,
  },
  {
    id: "problem-networking-tcp-layer-ownership-architecture-foundation-v1",
    rubricVersionId: "rubric-networking-tcp-layer-ownership-v1",
    status: "approved",
    subjectId: "computer-networking",
    conceptId: "networking.tcp.layer-ownership",
    conceptLabel: "TCP 계층 책임",
    scenarioFrame: "architecture-judgment",
    scenarioLabel: "아키텍처 판단",
    difficulty: "foundation",
    generationSource: "approved_problem_pool",
    title: "재시도 설계에서 TCP가 맡는 일",
    prompt:
      "팀이 잃어버린 TCP 세그먼트를 애플리케이션 코드에서 다시 보내자고 제안했습니다. 어떻게 답해야 하며, 앱의 재시도 로직은 어디까지 담당해야 할까요?",
    answerGuidance:
      "2-5문장으로 답해 주세요. TCP 세그먼트 신뢰성과 제품 수준 재시도 동작을 분리해 주세요.",
    assignmentReason: "같은 TCP 책임 개념을 설계 판단 상황으로 바꿔 반복감을 줄였습니다.",
    rubric: [
      {
        id: "tcp-transport-owner",
        description: "TCP 세그먼트 재전송을 전송 계층 동작으로 식별한다.",
        required: true,
      },
      {
        id: "application-policy-boundary",
        description:
          "애플리케이션 로직의 책임을 요청 재시도, 타임아웃, 사용자에게 보이는 실패 처리로 제한한다.",
        required: true,
      },
    ],
    targetProblemCount: 10,
  },
  {
    id: "problem-networking-dns-cache-debugging-foundation-v1",
    rubricVersionId: "rubric-networking-dns-caching-v1",
    status: "approved",
    subjectId: "computer-networking",
    conceptId: "networking.dns.caching",
    conceptLabel: "DNS 캐시와 TTL",
    scenarioFrame: "debugging-log",
    scenarioLabel: "디버깅 로그",
    difficulty: "foundation",
    generationSource: "approved_problem_pool",
    title: "배포 중 남아 있는 DNS 캐시",
    prompt:
      "DNS 레코드를 바꾼 뒤에도 일부 사용자가 예전 주소로 접속합니다. DNS 캐시와 TTL이 이 현상을 어떻게 만들 수 있는지 설명해 주세요.",
    answerGuidance:
      "2-5문장으로 답해 주세요. 캐시가 어디에 남고 TTL이 어떤 역할을 하는지 연결해 주세요.",
    assignmentReason:
      "네트워크 연습이 TCP에만 머물지 않도록 DNS 캐시 개념으로 커버리지를 넓혔습니다.",
    rubric: [
      {
        id: "dns-cache-owner",
        description: "리졸버나 클라이언트가 DNS 응답을 캐시할 수 있음을 설명한다.",
        required: true,
      },
      {
        id: "ttl-lifetime",
        description: "TTL이 오래된 응답이 보일 수 있는 시간을 제한한다는 점을 연결한다.",
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
    conceptLabel: "과적합과 일반화",
    scenarioFrame: "interview-answer",
    scenarioLabel: "면접 답변",
    difficulty: "foundation",
    generationSource: "approved_problem_pool",
    title: "모델 리뷰에서 보이는 과적합 신호",
    prompt:
      "모델 리뷰에서 학습 지표는 좋아지는데 검증 지표는 따라오지 않습니다. 왜 과적합 신호일 수 있는지 설명하고 완화 방법 하나를 제안해 주세요.",
    answerGuidance: "2-5문장으로 답해 주세요. 학습 성능과 검증 성능의 차이를 비교해 주세요.",
    assignmentReason:
      "AI/ML 기초도 네트워크와 함께 꾸준히 연습할 수 있도록 승인된 문제 풀에 포함했습니다.",
    rubric: [
      {
        id: "generalization-gap",
        description: "학습/검증 성능 차이를 일반화 약화와 연결한다.",
        required: true,
      },
      {
        id: "mitigation",
        description: "정규화, 데이터 추가, 드롭아웃처럼 타당한 완화 방법을 제시한다.",
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

export function problemByConceptId(conceptId: ConceptId): ApprovedProblemVersion | null {
  return approvedProblemVersions.find((problem) => problem.conceptId === conceptId) ?? null
}

export function applyProblemVersionToAssignment(
  assignment: Assignment,
  problem: ApprovedProblemVersion,
): Assignment {
  return {
    ...assignment,
    answerGuidance: problem.answerGuidance,
    assignmentReason: problem.assignmentReason,
    conceptId: problem.conceptId,
    conceptLabel: problem.conceptLabel,
    estimatedDifficulty: problem.difficulty,
    generationSource: problem.generationSource,
    problemVersionId: problem.id,
    prompt: problem.prompt,
    realtimeGenerated: false,
    rubricVersionId: problem.rubricVersionId,
    scenarioFrame: problem.scenarioFrame,
    scenarioLabel: problem.scenarioLabel,
    subjectId: problem.subjectId,
    title: problem.title,
  }
}

export function refreshAssignmentFromProblemBank(assignment: Assignment): Assignment {
  const problem = problemById(assignment.problemVersionId)
  return problem ? applyProblemVersionToAssignment(assignment, problem) : assignment
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
