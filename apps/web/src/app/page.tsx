import { productIdentity } from "@gappatch/product"

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[430px] flex-col justify-between px-5 py-6">
      <section className="space-y-4">
        <p className="text-sm font-medium text-accent">{productIdentity.englishName}</p>
        <h1 className="text-3xl font-semibold tracking-normal">{productIdentity.koreanName}</h1>
        <p className="text-base leading-7 text-muted">{productIdentity.koreanTagline}</p>
      </section>
      <a
        className="rounded-[6px] bg-accent px-4 py-3 text-center text-sm font-semibold text-white"
        href="/login"
      >
        오늘의 빈틈 확인하기
      </a>
    </main>
  )
}
