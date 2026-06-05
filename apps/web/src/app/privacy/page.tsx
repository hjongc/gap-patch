export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-[430px] space-y-4 px-5 py-6">
      <h1 className="text-2xl font-semibold">개인정보 처리 안내</h1>
      <p className="text-sm leading-6 text-muted">
        빈틈패치는 매일 학습을 운영하기 위해 이메일, 답안, 채점 피드백, 숙련도 기록을 저장합니다.
        서술형 답안은 명시적 동의 이후에만 외부 AI 채점으로 전송됩니다.
      </p>
    </main>
  )
}
