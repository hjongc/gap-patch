"use client"

import { productIdentity } from "@gappatch/product"
import ky, { HTTPError } from "ky"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { MobileShell, PrimaryButton, SurfaceCard } from "../ui"

type LoginResponse = {
  readonly ok: boolean
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("ai@example.com")
  const [inviteCode, setInviteCode] = useState("BETA-AI-0001")
  const [error, setError] = useState<string | null>(null)

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      const result = await ky
        .post("/api/auth/beta-login", {
          json: { email, inviteCode, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        })
        .json<LoginResponse>()
      if (result.ok) {
        router.push("/setup")
      }
    } catch (caught) {
      if (caught instanceof HTTPError) {
        setError("Invite code is not valid.")
        return
      }
      throw caught
    }
  }

  return (
    <MobileShell>
      <section className="motion-rise flex flex-1 flex-col justify-between gap-10 py-5">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {productIdentity.englishName}
            </p>
            <span className="rounded-full border border-line bg-panel px-3 py-1 text-xs font-semibold">
              beta
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-semibold leading-[1.02]">{productIdentity.koreanName}</h1>
            <p className="max-w-[18rem] text-base leading-7 text-muted">
              {productIdentity.koreanTagline}
            </p>
          </div>
          <div className="grid grid-cols-[1fr_auto] items-end gap-3 rounded-[8px] border border-line bg-panel p-4 shadow-[0_18px_50px_rgba(19,30,44,0.08)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-coral">today</p>
              <p className="mt-2 text-2xl font-semibold">1 question</p>
            </div>
            <span className="grid size-14 place-items-center rounded-[8px] bg-accent text-lg font-semibold text-white">
              1Q
            </span>
          </div>
        </div>
        <SurfaceCard>
          <form className="space-y-4" onSubmit={submitLogin}>
            <label className="block space-y-2 text-sm font-medium">
              <span>Email</span>
              <input
                className="w-full rounded-[8px] border border-line bg-white px-3 py-3 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              <span>Invite code</span>
              <input
                className="w-full rounded-[8px] border border-line bg-white px-3 py-3 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                onChange={(event) => setInviteCode(event.target.value)}
                value={inviteCode}
              />
            </label>
            {error ? (
              <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}
            <PrimaryButton>Start practice</PrimaryButton>
          </form>
        </SurfaceCard>
      </section>
    </MobileShell>
  )
}
