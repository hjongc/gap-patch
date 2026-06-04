"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/today", label: "Today" },
  { href: "/review", label: "Review" },
  { href: "/history", label: "History" },
] as const

export function LearnerNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] left-1/2 z-20 grid w-[min(calc(100%_-_32px),390px)] -translate-x-1/2 grid-cols-3 rounded-[8px] border border-line bg-panel/95 p-1 text-center text-xs font-semibold shadow-[0_22px_70px_rgba(19,30,44,0.18)] backdrop-blur">
      {navItems.map((item) => {
        const active = pathname === item.href

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`rounded-[6px] px-3 py-2.5 transition ${
              active ? "bg-ink text-white" : "text-muted active:bg-surface"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
