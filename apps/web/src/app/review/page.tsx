"use client"

import ky from "ky"
import { useEffect, useState } from "react"
import { LearnerNav } from "../nav"
import { LearningBadge, MobileShell, PageHeader, ProgressRail, SurfaceCard } from "../ui"

type ReviewItem = {
  readonly subjectLabel: string
  readonly label: string
  readonly reason: string
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
        eyebrow="Weak spots"
        kicker="틀린 게 아니라, 다음 패치 후보가 생긴 거야."
        title="Review"
      />
      <ProgressRail current={reviewItems.length > 0 ? 1 : 0} total={1} />
      {reviewItems.length > 0 ? (
        reviewItems.map((item) => (
          <SurfaceCard key={item.subjectLabel} tone="warm">
            <p className="text-sm font-black text-coral">{item.label}</p>
            <h2 className="mt-2 text-xl font-black">{item.subjectLabel}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted">{item.reason}</p>
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
