export function isAdminEmail(email: string): boolean {
  const { GAPPATCH_ADMIN_EMAILS: rawAllowedEmails } = process.env
  const allowedEmails = rawAllowedEmails
    ?.split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0)

  return allowedEmails?.includes(email.trim().toLowerCase()) ?? false
}
