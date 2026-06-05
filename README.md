# GapPatch

GapPatch is the mobile-web-first product for `빈틈패치`: one focused practice problem per day, immediate grading, history, and review of weak spots.

The first production slice targets computer-science-adjacent engineers, starting with AI/ML foundations, computer networking, and operating systems. Native iOS and Android clients are planned after the mobile web surface is stabilized.

## Stack

- pnpm workspace
- Next.js App Router, React, TypeScript
- Tailwind CSS v4
- Zod for request boundaries
- Vitest for service tests
- Playwright for mobile web E2E

## Local Run

```sh
pnpm install
pnpm --filter @gappatch/web dev --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000/login`.

Local beta invite code:

```text
BETA-AI-0001
```

The local beta invite is disabled by default when `NODE_ENV=production`. Use `.env.example`
to seed production master and test invite accounts.

Local runtime data is stored in `.gappatch-data/state.json` by default. Override it with `GAPPATCH_DATA_FILE` when running a separate QA or production environment.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test -- --run tests/unit/scaffold.test.ts tests/unit/app-services.test.ts tests/unit/deployment-runbook.test.ts
pnpm test:e2e --project=mobile-chromium tests/e2e/mobile-web-flow.spec.ts
pnpm build
```

## Deployment

See [docs/deployment/oci.md](docs/deployment/oci.md). The OCI path uses the root `compose.yaml`
with the server `deploy-git-service` helper, Caddy on the external `web` network, and a
server-only `.env`. Production deployment is approval-gated and requires OCI host details,
domain/TLS decisions, environment values, and rollback approval.
