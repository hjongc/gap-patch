import type { ReactNode } from "react"

type MobileShellProps = {
  readonly children: ReactNode
  readonly hasBottomNav?: boolean
}

export function MobileShell({ children, hasBottomNav = false }: MobileShellProps) {
  return (
    <main
      className={`mx-auto flex min-h-dvh max-w-[430px] flex-col px-5 pt-5 ${
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
}

export function PageHeader({ aside, eyebrow, title }: PageHeaderProps) {
  return (
    <section className="motion-rise flex items-end justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">{title}</h1>
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
    accent: "border-accent/30 bg-panel shadow-[0_18px_50px_rgba(10,90,78,0.09)]",
    plain: "border-line bg-panel shadow-[0_14px_42px_rgba(19,30,44,0.06)]",
    warm: "border-coral/30 bg-panel shadow-[0_18px_50px_rgba(137,61,38,0.08)]",
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
      className="w-full rounded-[8px] bg-ink px-4 py-3.5 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(16,24,36,0.18)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-muted disabled:shadow-none"
      disabled={disabled}
      type="submit"
    >
      {children}
    </button>
  )
}
