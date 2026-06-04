import type { Metadata } from "next"
import "./globals.css"

import { productIdentity } from "@gappatch/product"

export const metadata: Metadata = {
  title: `${productIdentity.koreanName} / ${productIdentity.englishName}`,
  description: productIdentity.koreanTagline,
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
