import type { User } from "./app-model"
import { isTemporaryUserEmail } from "./temporary-users"

export function isAdminUser(user: User): boolean {
  if (isTemporaryUserEmail(user.email)) {
    return false
  }
  return user.role === "admin" || isAdminEmail(user.email)
}

export function isAdminEmail(email: string): boolean {
  const { GAPPATCH_ADMIN_EMAILS: rawAllowedEmails } = process.env
  const allowedEmails = rawAllowedEmails
    ?.split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0)

  return allowedEmails?.includes(email.trim().toLowerCase()) ?? false
}
