"use client"

import ky from "ky"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LearningBadge, MobileShell, PageHeader, PrimaryButton, ProgressRail } from "../ui"

const subjectOptions = [
  { id: "ai-ml-foundations", label: "AI/ML Foundations", note: "모델 감각" },
  { id: "computer-networking", label: "Computer Networking", note: "TCP/HTTP" },
  { id: "operating-systems", label: "Operating Systems", note: "프로세스/메모리" },
] as const

export default function SetupPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<readonly string[]>([])

  function toggleSubject(subjectId: string, checked: boolean) {
    setSubjects((current) =>
      checked ? [...current, subjectId] : current.filter((selected) => selected !== subjectId),
    )
  }

  async function saveSubjects(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await ky.post("/api/user/subjects", {
      json: {
        subjects: subjects.length > 0 ? subjects : ["ai-ml-foundations"],
        difficulty: "foundation",
      },
    })
    router.push("/today")
  }

  return (
    <MobileShell>
      <PageHeader
        aside={<LearningBadge tone="sky">기초</LearningBadge>}
        eyebrow="설정"
        kicker="오늘부터 패치할 과목을 고르면 매일 한 문제씩 밀어줄게."
        title="과목 선택"
      />
      <form className="space-y-4" onSubmit={saveSubjects}>
        <ProgressRail current={1} total={2} />
        {subjectOptions.map((subject) => (
          <label
            className="motion-rise flex items-center justify-between gap-4 rounded-[8px] border-2 border-line bg-panel px-4 py-4 text-sm font-black shadow-[0_8px_0_rgba(33,52,69,0.06)] transition has-[:checked]:border-leaf has-[:checked]:bg-banana"
            key={subject.id}
          >
            <span>
              <span className="block">{subject.label}</span>
              <span className="mt-1 block text-xs font-bold text-muted">{subject.note}</span>
            </span>
            <input
              aria-label={subject.label}
              checked={subjects.includes(subject.id)}
              className="size-5 accent-accent"
              onChange={(event) => toggleSubject(subject.id, event.target.checked)}
              type="checkbox"
            />
          </label>
        ))}
        <div className="pt-2">
          <PrimaryButton>과목 저장</PrimaryButton>
        </div>
      </form>
    </MobileShell>
  )
}
