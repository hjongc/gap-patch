import type { User } from "./app-model"

export function isAdminUser(user: User): boolean {
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
