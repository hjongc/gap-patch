"use client"

import ky from "ky"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { MobileShell, PageHeader, SurfaceCard } from "../../ui"

export default function AccountDeletePage() {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitDeletion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!confirmed || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await ky.delete("/api/account").json()
      router.push("/login")
    } catch (caught) {
      if (caught instanceof Error) {
        setError("계정 삭제 요청을 처리하지 못했습니다. 다시 시도해 주세요.")
        return
      }
      throw caught
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MobileShell>
      <PageHeader
        eyebrow="개인정보"
        kicker="삭제하면 학습 기록과 세션이 즉시 제거됩니다."
        title="계정 삭제"
      />
      <SurfaceCard tone="warm">
        <form className="space-y-4" onSubmit={submitDeletion}>
          <p className="text-sm font-semibold leading-6 text-muted">
            계정 식별자, 제출 답안, 채점 피드백, 숙련도 기록, 복습 큐와 활성 세션을 삭제합니다.
          </p>
          <label className="flex items-start gap-3 rounded-[8px] border border-line bg-white p-3 text-sm font-black">
            <input
              checked={confirmed}
              className="mt-1 size-4 accent-coral"
              onChange={(event) => setConfirmed(event.target.checked)}
              type="checkbox"
            />
            <span>내 학습 기록 삭제에 동의합니다.</span>
          </label>
          {error ? <p className="text-sm font-black text-coral">{error}</p> : null}
          <button
            className="w-full rounded-[8px] border-b-[5px] border-coral bg-coral px-4 py-3.5 text-sm font-black text-white transition active:translate-y-1 active:border-b-2 disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted"
            disabled={!confirmed || isSubmitting}
            type="submit"
          >
            {isSubmitting ? "삭제 중..." : "계정 삭제 요청"}
          </button>
        </form>
      </SurfaceCard>
    </MobileShell>
  )
}
