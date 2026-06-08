import Image from "next/image"

type GapPatchLogoProps = {
  readonly className?: string
}

export function GapPatchLogo({ className }: GapPatchLogoProps) {
  return (
    <Image
      alt="GapPatch logo"
      className={className}
      height="96"
      src="/brand/gappatch-logo.svg"
      width="320"
    />
  )
}
