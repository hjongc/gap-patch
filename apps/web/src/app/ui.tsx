import type { ReactNode } from "react"

type MobileShellProps = {
  readonly children: ReactNode
  readonly hasBottomNav?: boolean
}

export function MobileShell({ children, hasBottomNav = false }: MobileShellProps) {
  return (
    <main
      className={`relative mx-auto flex min-h-dvh max-w-[430px] flex-col px-5 pt-5 ${
        hasBottomNav ? "pb-28" : "pb-6"
      }`}
    >
      {children}
    </main>
  )
}

type PageHeaderProps = {
  readonly eyebrow: string
  readonly title: string
  readonly aside?: ReactNode
  readonly kicker?: string
}

export function PageHeader({ aside, eyebrow, kicker, title }: PageHeaderProps) {
  return (
    <section className="motion-rise flex items-end justify-between gap-4 py-5">
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-leaf">{eyebrow}</p>
        <h1 className="mt-2 text-4xl font-black leading-none">{title}</h1>
        {kicker ? (
          <p className="mt-3 text-sm font-semibold leading-6 text-muted">{kicker}</p>
        ) : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </section>
  )
}

type SurfaceCardProps = {
  readonly children: ReactNode
  readonly tone?: "plain" | "accent" | "warm"
}

export function SurfaceCard({ children, tone = "plain" }: SurfaceCardProps) {
  const toneClass = {
    accent: "border-leaf bg-panel shadow-[0_10px_0_rgba(41,137,112,0.16)]",
    plain: "border-line bg-panel shadow-[0_10px_0_rgba(33,52,69,0.08)]",
    warm: "border-coral bg-panel shadow-[0_10px_0_rgba(190,95,61,0.13)]",
  }[tone]

  return (
    <section className={`motion-rise rounded-[8px] border p-4 ${toneClass}`}>{children}</section>
  )
}

type PrimaryButtonProps = {
  readonly children: ReactNode
  readonly disabled?: boolean
}

export function PrimaryButton({ children, disabled = false }: PrimaryButtonProps) {
  return (
    <button
      className="motion-pop w-full rounded-[8px] border-b-[5px] border-leaf bg-accent px-4 py-3.5 text-sm font-black text-white shadow-[0_14px_30px_rgba(54,166,132,0.22)] transition active:translate-y-1 active:border-b-2 disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted disabled:shadow-none"
      disabled={disabled}
      type="submit"
    >
      {children}
    </button>
  )
}

type LearningBadgeProps = {
  readonly children: ReactNode
  readonly tone?: "banana" | "mint" | "coral" | "sky"
}

export function LearningBadge({ children, tone = "mint" }: LearningBadgeProps) {
  const toneClass = {
    banana: "bg-banana text-banana-ink",
    coral: "bg-coral/12 text-coral",
    mint: "bg-accent/12 text-leaf",
    sky: "bg-sky/14 text-ink",
  }[tone]

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${toneClass}`}
    >
      {children}
    </span>
  )
}

type ProgressRailProps = {
  readonly current: number
  readonly total: number
}

export function ProgressRail({ current, total }: ProgressRailProps) {
  const width = `${Math.min(100, Math.max(0, (current / total) * 100))}%`

  return (
    <div
      aria-label={`Progress ${current} of ${total}`}
      aria-valuemax={total}
      aria-valuemin={0}
      aria-valuenow={current}
      className="space-y-2"
      role="progressbar"
    >
      <div className="flex items-center justify-between text-xs font-black text-muted">
        <span>PATCH ROAD</span>
        <span>
          {current}/{total}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-line bg-white">
        <div className="h-full rounded-full bg-accent" style={{ width }} />
      </div>
    </div>
  )
}

export function MascotMark() {
  return (
    <div
      aria-hidden="true"
      className="motion-bob grid size-14 place-items-center rounded-full border-[3px] border-ink bg-banana text-xl font-black text-ink shadow-[0_7px_0_rgba(33,52,69,0.16)]"
    >
      빈
    </div>
  )
}
