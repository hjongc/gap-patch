# AGENTS.md

## Project

This repository is `빈틈패치 / GapPatch`, a mobile-web-first daily CS/AI practice app.

## Language

Agent-facing documents, code comments, README content, plans, commit messages, and PR text must be written in English unless the user explicitly asks otherwise.

## Execution Order

Build in this order:

1. Mobile-web-first web app.
2. Web hardening, admin, and production readiness.
3. Native iOS/Android app.
4. OCI deployment after explicit credentials and approval.

Do not start native mobile implementation until the web MVP gates pass.
Do not perform remote OCI deployment without explicit server details and approval.

## Stack

- Package manager: pnpm workspace.
- Web: Next.js App Router, React, strict TypeScript, Tailwind CSS v4, Motion.
- Shared packages: domain, API contracts, API client, product copy, design tokens, grading contracts, eval fixtures.
- Native later: Expo, React Native, Expo Router.
- Validation: Zod at boundaries.
- Tests: Vitest for unit/integration, Playwright for browser e2e.

## Quality Rules

- Use test-first development for production behavior.
- Keep files focused and under 250 pure lines of code where practical.
- No `any`, non-null assertions, `@ts-ignore`, or broad catch-and-swallow.
- Use typed errors or discriminated unions for expected failures.
- Prefer shared domain/types over duplicated logic.
- Web and native may share tokens, copy, schemas, API client, and domain logic, but not full UI components.

## UX Direction

The app should feel like a calm, premium engineering workbench:

- Mobile-first.
- Dense but readable.
- Polished but not decorative.
- No marketing landing page as the primary experience.
- No leaderboard, social feed, or course-marketplace language.
- Motion must clarify state changes and respect reduced motion.

## Verification

Every user-facing change needs:

- Automated test evidence.
- Real surface evidence through browser, HTTP, or tmux.
- Cleanup receipt for any spawned server/session.

