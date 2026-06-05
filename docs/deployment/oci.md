# GapPatch OCI Deployment Runbook

This runbook documents the Docker Compose deployment path used by the OCI A1 server.

Do not deploy without explicit approval from the project owner. A production deployment requires the target OCI host, SSH user, deployment directory, domain name, TLS plan, environment values, rollback ref, and explicit approval.

## Required Deployment Inputs

Collect and confirm these values before any remote command:

- OCI host
- SSH user
- deployment directory
- domain name
- TLS plan
- environment values
- rollback ref
- explicit approval

If any required input is missing, stop before SSH and record the missing value in the deployment evidence. Do not guess a host, domain, environment value, or rollback ref.

## Target Shape

- Platform: Oracle Cloud Infrastructure compute instance.
- Runtime: Docker image built from `node:22-bookworm-slim` with pnpm 9 through Corepack.
- App: Next.js production server for `@gappatch/web`.
- Process manager: Docker Compose with `restart: unless-stopped`.
- Edge: Caddy reverse proxy on external Docker network `web`.
- Compose file: repository root `compose.yaml`.
- Data: file-backed MVP state through `GAPPATCH_DATA_FILE=/data/state.json`; move to a managed database before multi-instance scale.

## Local Preflight

Run these from the repository root before any server changes:

```sh
pnpm lint
pnpm typecheck
pnpm test -- --run
pnpm test:e2e
pnpm build
docker compose config
```

`pnpm build` must finish without Next.js build errors. In the Codex sandbox it may require an unsandboxed run because Turbopack opens an internal port during build.

## Environment

Create the server-side `.env` from `.env.example` inside the deployed repo directory. Keep this file out of git.

Required values:

- `GAPPATCH_MASTER_EMAIL`
- `GAPPATCH_MASTER_INVITE_CODE`
- `GAPPATCH_TEST_EMAIL`
- `GAPPATCH_TEST_INVITE_CODE`
- `GAPPATCH_GRADING_PROVIDER`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_GRADING_DEPLOYMENT`
- `AZURE_OPENAI_GRADING_TIMEOUT_MS`

Cookie policy:

- Use `GAPPATCH_SECURE_COOKIES=false` only for an IP-only HTTP deployment.
- Remove it or set `GAPPATCH_SECURE_COOKIES=true` after a HTTPS domain is attached.
- Keep `GAPPATCH_GRADING_PROVIDER=deterministic` until the Azure OpenAI endpoint, key, and deployment name are present.
- Use `GAPPATCH_GRADING_PROVIDER=azure-openai` with `AZURE_OPENAI_GRADING_DEPLOYMENT` set to the Azure deployment name, not just the public model slug. The current low-latency grading default is `gpt-4o-mini`.
- Legacy aliases `LLM_API_ENDPOINT`, `LLM_API_KEY`, `LLM_MODEL`, and `LLM_API_VERSION` are accepted. `LLM_API_VERSION` is ignored on the Azure v1 API path and exists only for compatibility with older `.env` files.
- Store Azure OpenAI keys in the server `.env` or a secret manager. Do not commit them.

The legacy local invite `BETA-AI-0001` is disabled by default when `NODE_ENV=production`.

## Server Preparation

The OCI host should provide these paths:

```text
/home/ubuntu/infra/proxy/
/home/ubuntu/infra/scripts/
/home/ubuntu/repos/
/home/ubuntu/services/
/home/ubuntu/backups/
```

The Docker network is created by the deployment scripts when missing:

```sh
docker network inspect web >/dev/null 2>&1 || docker network create web
```

## Build And Release

Deploy from GitHub with the server helper:

```sh
~/infra/scripts/deploy-git-service gappatch https://github.com/hjongc/gap-patch.git <approved-release-ref>
```

The helper clones or updates `/home/ubuntu/repos/gappatch`, then runs:

```sh
docker compose \
  -f /home/ubuntu/repos/gappatch/compose.yaml \
  --project-name gappatch \
  --project-directory /home/ubuntu/repos/gappatch \
  up -d --build
```

## Caddy Routing

Attach the app container to the existing public reverse proxy through the external `web` network.

Example `sites/*.caddy` block:

```caddyfile
:80 {
    handle_path /hello* {
        reverse_proxy hello:80
    }

    handle {
        reverse_proxy gappatch-web:3000
    }
}
```

Reload Caddy:

```sh
~/infra/scripts/proxy-reload
```

Add a domain and HTTPS before inviting real users beyond the trusted beta group.

## Smoke Test

After deployment:

```sh
curl -i http://<host>/api/health
curl -I http://<host>/login
curl -I http://<host>/hello/
```

Then verify seeded accounts through HTTP cookies:

```sh
curl -c /tmp/gappatch-test.cookie \
  -H 'content-type: application/json' \
  -d '{"email":"<test-email>","inviteCode":"<test-invite>","timezone":"Asia/Seoul"}' \
  http://<host>/api/auth/beta-login

curl -b /tmp/gappatch-test.cookie http://<host>/api/daily/today
```

Run the browser E2E suite against the production base URL only after explicit approval.

## Rollback

Keep the previous approved git ref. To roll back:

```sh
cd /home/ubuntu/repos/gappatch
git fetch origin <previous-approved-ref>
git checkout <previous-approved-ref>
docker compose -f compose.yaml --project-name gappatch --project-directory "$PWD" up -d --build
```

## Open Production Gaps

- Replace file-backed MVP state with a managed database before multi-instance scale.
- Add production secrets and environment validation for external AI grading.
- Add AI grading provider integration with cost and privacy controls.
- Add account deletion workflow that deletes persisted user data.
- Attach a real domain and HTTPS, then restore secure cookies for all production traffic.
- Add native iOS and Android clients after the mobile web MVP is stabilized.
