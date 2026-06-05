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
  const namesTransport =
    answer.includes("transport") || answer.includes("전송 계층") || answer.includes("전송계층")
  const namesApplication =
    answer.includes("application") ||
    answer.includes("app") ||
    answer.includes("애플리케이션") ||
    answer.includes("앱")
  const namesPolicy =
    answer.includes("policy") ||
    answer.includes("request retry") ||
    answer.includes("timeout") ||
    answer.includes("재시도 정책") ||
    answer.includes("요청 재시도") ||
    answer.includes("타임아웃")
  const namesRetransmission =
    answer.includes("retransmission") ||
    answer.includes("retransmit") ||
    answer.includes("retries") ||
    answer.includes("retry") ||
    answer.includes("재전송")
  const namesOwnership =
    answer.includes("own") ||
    answer.includes("handled by") ||
    answer.includes("responsible") ||
    answer.includes("맡") ||
    answer.includes("책임") ||
    answer.includes("담당")
  const confusesApplication =
    namesApplication && namesRetransmission && namesOwnership && !namesTransport
  const separatesPolicy = namesPolicy || namesApplication

  if (namesTcp && namesTransport && separatesPolicy && !confusesApplication) {
    return {
      confidence: 0.92,
      label: "Stable",
      missingConcepts: [],
      misconceptions: [],
      reviewConcepts: [],
      score: 1,
      strengths: ["TCP 재전송을 전송 계층 동작으로 구분했습니다."],
      summary:
        "좋아요. TCP 세그먼트 재전송은 전송 계층이 맡고, 애플리케이션은 요청 재시도 정책과 타임아웃, 사용자에게 보이는 실패 처리를 담당합니다.",
    }
  }

  return {
    confidence: 0.86,
    label: confusesApplication ? "Needs review" : "Partial",
    missingConcepts: [
      separatesPolicy
        ? "애플리케이션 수준 재시도 정책과 TCP 세그먼트 재전송을 분리해 주세요."
        : "애플리케이션 계층에 남는 책임을 함께 설명해 주세요.",
    ],
    misconceptions: confusesApplication
      ? ["애플리케이션 계층이 TCP 재전송 자체를 맡는다고 보았습니다."]
      : [],
    reviewConcepts: ["networking.tcp.layer-ownership"],
    score: confusesApplication ? 0.4 : 0.72,
    strengths: namesTcp ? ["TCP를 답변의 핵심으로 잡았습니다."] : [],
    summary:
      "TCP 재전송은 전송 계층 동작입니다. 애플리케이션 계층은 더 높은 수준의 재시도 정책, 타임아웃, 사용자에게 보이는 실패 처리를 맡을 수 있습니다.",
  }
}

function gradeDnsCaching(answerText: string): Feedback {
  const answer = answerText.toLowerCase()
  const namesDns = answer.includes("dns")
  const namesCache =
    answer.includes("cache") || answer.includes("caching") || answer.includes("캐시")
  const namesTtl = answer.includes("ttl") || answer.includes("time to live")

  if (namesDns && namesCache && namesTtl) {
    return {
      confidence: 0.9,
      label: "Stable",
      missingConcepts: [],
      misconceptions: [],
      reviewConcepts: [],
      score: 1,
      strengths: ["DNS 캐시와 TTL을 배포 지연 현상에 연결했습니다."],
      summary:
        "좋아요. DNS 응답은 TTL이 끝날 때까지 리졸버나 클라이언트에 남을 수 있어서 일부 사용자가 배포 중 예전 주소로 접속할 수 있습니다.",
    }
  }

  return {
    confidence: 0.82,
    label: "Partial",
    missingConcepts: namesTtl
      ? ["DNS 응답이 어디에 캐시될 수 있는지 설명해 주세요."]
      : ["TTL이 캐시된 DNS 응답의 유지 시간과 어떻게 연결되는지 설명해 주세요."],
    misconceptions: [],
    reviewConcepts: ["networking.dns.caching"],
    score: 0.65,
    strengths: namesDns ? ["DNS를 배포 현상의 일부로 짚었습니다."] : [],
    summary:
      "DNS 배포 지연은 리졸버나 클라이언트 캐시가 TTL 만료 전까지 예전 응답을 들고 있을 때 자주 발생합니다.",
  }
}

function gradeGeneralExplanation(answerText: string): Feedback {
  const answer = answerText.toLowerCase()
  const recognizesTraining =
    answer.includes("training") || answer.includes("train") || answer.includes("학습")
  const recognizesValidation =
    answer.includes("validation") || answer.includes("검증") || answer.includes("평가")
  const recognizesGap = recognizesTraining && recognizesValidation
  const namesMitigation =
    answer.includes("regularization") ||
    answer.includes("more data") ||
    answer.includes("dropout") ||
    answer.includes("정규화") ||
    answer.includes("데이터") ||
    answer.includes("드롭아웃")

  return {
    confidence: 0.8,
    label: recognizesGap && namesMitigation ? "Stable" : "Partial",
    missingConcepts: namesMitigation ? [] : ["과적합 완화 방법을 하나 제시해 주세요."],
    misconceptions: [],
    reviewConcepts: recognizesGap && namesMitigation ? [] : ["ai.overfitting.generalization"],
    score: recognizesGap && namesMitigation ? 1 : 0.65,
    strengths: recognizesGap ? ["학습/검증 성능 차이를 일반화 위험과 연결했습니다."] : [],
    summary:
      "과적합은 학습 지표는 좋아지지만 검증 지표가 따라오지 않을 때 의심할 수 있습니다. 정규화, 데이터 추가, 드롭아웃, 더 단순한 모델 같은 완화책을 함께 떠올려 보세요.",
  }
}
