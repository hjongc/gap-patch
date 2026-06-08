const temporaryUserEmailDomain = "@temporary.gappatch.local"

export function temporaryUserEmail(temporaryUserId: string): string {
  return `${temporaryUserId}${temporaryUserEmailDomain}`
}

export function isTemporaryUserId(userId: string): boolean {
  return /^\d+$/.test(userId)
}

export function isTemporaryUserEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  if (!normalized.endsWith(temporaryUserEmailDomain)) {
    return false
  }
  return isTemporaryUserId(normalized.slice(0, -temporaryUserEmailDomain.length))
}
