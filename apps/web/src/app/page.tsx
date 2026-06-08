import { productIdentity } from "@gappatch/product"
import { GapPatchLogo } from "./brand"
import { MobileShell, SurfaceCard } from "./ui"

export default function HomePage() {
  return (
    <MobileShell>
      <section className="motion-rise flex flex-1 flex-col justify-between gap-8 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <GapPatchLogo className="h-16 w-auto" />
          </div>
          <div>
            <h1 className="text-5xl font-black leading-none">{productIdentity.koreanName}</h1>
            <p className="mt-4 text-base font-semibold leading-7 text-muted">
              {productIdentity.koreanTagline}
            </p>
          </div>
          <SurfaceCard tone="accent">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-coral">오늘 패치</p>
            <p className="mt-3 text-2xl font-black">하루 한 문제로 CS 감각을 깨운다</p>
          </SurfaceCard>
        </div>
        <a
          className="motion-pop w-full rounded-[8px] border-b-[5px] border-leaf bg-accent px-4 py-3.5 text-center text-sm font-black text-white shadow-[0_14px_30px_rgba(54,166,132,0.22)] transition active:translate-y-1 active:border-b-2"
          href="/login"
        >
          오늘의 빈틈 확인하기
        </a>
      </section>
    </MobileShell>
  )
}
