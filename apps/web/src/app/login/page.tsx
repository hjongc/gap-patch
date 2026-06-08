"use client"

import { productIdentity } from "@gappatch/product"
import ky, { HTTPError } from "ky"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LearningBadge, MascotMark, MobileShell, PrimaryButton, SurfaceCard } from "../ui"

type LoginResponse = {
  readonly ok: boolean
}

export default function LoginPage() {
  const router = useRouter()
  const [temporaryUserId, setTemporaryUserId] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      const result = await ky
        .post("/api/auth/beta-login", {
          json: {
            temporaryUserId,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        })
        .json<LoginResponse>()
      if (result.ok) {
        router.push("/setup")
      }
    } catch (caught) {
      if (caught instanceof HTTPError) {
        setError("숫자만 입력해 주세요.")
        return
      }
      throw caught
    }
  }

  return (
    <MobileShell>
      <section className="flex flex-1 flex-col justify-between gap-8 py-5">
        <div className="motion-rise space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-leaf">
              {productIdentity.englishName}
            </p>
            <LearningBadge tone="banana">베타</LearningBadge>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-end gap-4">
            <div className="space-y-3">
              <h1 className="text-5xl font-black leading-[0.98]">{productIdentity.koreanName}</h1>
              <p className="max-w-[18rem] text-base font-semibold leading-7 text-muted">
                {productIdentity.koreanTagline}
              </p>
            </div>
            <MascotMark />
          </div>
          <div className="rounded-[8px] border border-leaf bg-banana p-4 shadow-[0_10px_0_rgba(41,137,112,0.15)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-leaf">
                  오늘 미션
                </p>
                <p className="mt-2 text-2xl font-black">1문제로 빈틈 패치</p>
              </div>
              <span className="grid size-12 place-items-center rounded-full bg-white text-base font-black text-leaf">
                1Q
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-banana-ink">
              {productIdentity.koreanTagline}
            </p>
          </div>
        </div>
        <SurfaceCard tone="accent">
          <form className="space-y-4" onSubmit={submitLogin}>
            <label className="block space-y-2 text-sm font-medium">
              <span>임시 숫자 ID</span>
              <input
                autoComplete="off"
                className="w-full rounded-[8px] border-2 border-line bg-white px-3 py-3 font-semibold outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                inputMode="numeric"
                onChange={(event) => setTemporaryUserId(event.target.value)}
                pattern="[0-9]*"
                placeholder="0000"
                type="text"
                value={temporaryUserId}
              />
            </label>
            {error ? (
              <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}
            <PrimaryButton>시작하기</PrimaryButton>
          </form>
        </SurfaceCard>
      </section>
    </MobileShell>
  )
}
