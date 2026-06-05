import type { AccountRole, InviteCode } from "./app-model"

export class SeedInviteConfigError extends Error {
  readonly account: string

  constructor(account: string) {
    super(`Seed invite config for ${account} requires both email and invite code`)
    this.name = "SeedInviteConfigError"
    this.account = account
  }
}

const legacyBetaInvite = {
  code: "BETA-AI-0001",
  role: "learner",
} satisfies InviteCode

type SeedInviteInput = {
  readonly account: string
  readonly email?: string | undefined
  readonly code?: string | undefined
  readonly role: AccountRole
}

export function seedInvites(): Map<string, InviteCode> {
  const { GAPPATCH_MASTER_EMAIL, GAPPATCH_MASTER_INVITE_CODE } = process.env
  const { GAPPATCH_TEST_EMAIL, GAPPATCH_TEST_INVITE_CODE } = process.env
  const invites = new Map<string, InviteCode>()
  addInvite(invites, legacyBetaInvite)

  addOptionalInvite(
    invites,
    inviteFromEnv({
      account: "master",
      code: GAPPATCH_MASTER_INVITE_CODE,
      email: GAPPATCH_MASTER_EMAIL,
      role: "admin",
    }),
  )
  addOptionalInvite(
    invites,
    inviteFromEnv({
      account: "test",
      code: GAPPATCH_TEST_INVITE_CODE,
      email: GAPPATCH_TEST_EMAIL,
      role: "learner",
    }),
  )

  return invites
}

export function inviteMatchesEmail(invite: InviteCode, email: string): boolean {
  return invite.email ? normalizeEmail(invite.email) === normalizeEmail(email) : true
}

function inviteFromEnv(input: SeedInviteInput): InviteCode | null {
  if (!input.email && !input.code) {
    return null
  }
  if (!input.email || !input.code) {
    throw new SeedInviteConfigError(input.account)
  }

  return {
    code: input.code,
    email: input.email,
    role: input.role,
  }
}

function addOptionalInvite(invites: Map<string, InviteCode>, invite: InviteCode | null): void {
  if (invite) {
    addInvite(invites, invite)
  }
}

function addInvite(invites: Map<string, InviteCode>, invite: InviteCode): void {
  invites.set(invite.code, invite)
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
