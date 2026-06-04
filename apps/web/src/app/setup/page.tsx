"use client"

import ky from "ky"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { MobileShell, PageHeader, PrimaryButton } from "../ui"

const subjectOptions = [
  { id: "ai-ml-foundations", label: "AI/ML Foundations" },
  { id: "computer-networking", label: "Computer Networking" },
  { id: "operating-systems", label: "Operating Systems" },
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
        aside={
          <span className="rounded-full bg-violet/10 px-3 py-1 text-xs font-semibold text-violet">
            foundation
          </span>
        }
        eyebrow="Setup"
        title="Choose subjects"
      />
      <form className="space-y-3" onSubmit={saveSubjects}>
        {subjectOptions.map((subject) => (
          <label
            className="motion-rise flex items-center justify-between rounded-[8px] border border-line bg-panel px-4 py-4 text-sm font-semibold shadow-[0_12px_34px_rgba(19,30,44,0.05)] transition has-[:checked]:border-accent has-[:checked]:bg-accent/5"
            key={subject.id}
          >
            <span>{subject.label}</span>
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
          <PrimaryButton>Save subjects</PrimaryButton>
        </div>
      </form>
    </MobileShell>
  )
}
