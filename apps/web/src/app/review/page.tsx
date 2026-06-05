"use client"

import ky from "ky"
import { useEffect, useState } from "react"
import { LearnerNav } from "../nav"
import { displayFeedbackVerdict } from "../today/today-model"
import { LearningBadge, MobileShell, PageHeader, ProgressRail, SurfaceCard } from "../ui"

type ReviewItem = {
  readonly subjectLabel: string
  readonly conceptLabel: string
  readonly label: string
  readonly reason: string
  readonly nextReviewAt: string
  readonly lastScenarioLabel: string
  readonly perceivedDifficulty?: string
}

export default function ReviewPage() {
  const [reviewItems, setReviewItems] = useState<readonly ReviewItem[]>([])

  useEffect(() => {
    async function loadReview() {
      const response = await ky
        .get("/api/review")
        .json<{ readonly reviewItems: readonly ReviewItem[] }>()
      setReviewItems(response.reviewItems)
    }

    void loadReview()
  }, [])

  return (
    <MobileShell hasBottomNav>
      <LearnerNav />
      <PageHeader
        aside={<LearningBadge tone="coral">{reviewItems.length}</LearningBadge>}
        eyebrow="취약 개념"
        kicker="틀린 게 아니라, 다음 패치 후보가 생긴 거야."
        title="복습"
      />
      <ProgressRail current={reviewItems.length > 0 ? 1 : 0} total={1} />
      {reviewItems.length > 0 ? (
        reviewItems.map((item) => (
          <SurfaceCard key={item.conceptLabel} tone="warm">
            <p className="text-sm font-black text-coral">{displayFeedbackVerdict(item.label)}</p>
            <h2 className="mt-2 text-xl font-black">{item.conceptLabel}</h2>
            <p className="mt-2 text-xs font-black uppercase text-muted">{item.subjectLabel}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted">{item.reason}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs font-bold">
              <div>
                <dt className="font-black text-ink">다음 복습</dt>
                <dd className="mt-1 text-muted">{item.nextReviewAt}</dd>
              </div>
              <div>
                <dt className="font-black text-ink">상황</dt>
                <dd className="mt-1 text-muted">{item.lastScenarioLabel}</dd>
              </div>
            </dl>
          </SurfaceCard>
        ))
      ) : (
        <SurfaceCard tone="accent">
          <h2 className="text-xl font-black">패치 큐가 비어 있어</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted">
            오늘 문제를 풀면 복습 후보가 여기에 쌓인다.
          </p>
        </SurfaceCard>
      )}
    </MobileShell>
  )
}
