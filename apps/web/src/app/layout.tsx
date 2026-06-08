import type { Metadata } from "next"
import "./globals.css"

import { productIdentity } from "@gappatch/product"

export const metadata: Metadata = {
  title: `${productIdentity.koreanName} / ${productIdentity.englishName}`,
  description: productIdentity.koreanTagline,
  icons: {
    apple: [{ url: "/brand/apple-touch-icon.svg", type: "image/svg+xml" }],
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/gappatch-icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: ["/favicon.svg"],
  },
}

type RootLayoutProps = {
  readonly children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
