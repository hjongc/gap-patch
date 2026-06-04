"use client"

import ky from "ky"
import { useEffect, useState } from "react"
import { LearnerNav } from "../nav"
import { MobileShell, PageHeader, SurfaceCard } from "../ui"

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
        aside={
          <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral">
            {reviewItems.length}
          </span>
        }
        eyebrow="Weak spots"
        title="Review"
      />
      {reviewItems.map((item) => (
        <SurfaceCard key={item.subjectLabel} tone="warm">
          <p className="text-sm font-semibold text-coral">{item.label}</p>
          <h2 className="mt-1 font-semibold">{item.subjectLabel}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{item.reason}</p>
        </SurfaceCard>
      ))}
    </MobileShell>
  )
}
