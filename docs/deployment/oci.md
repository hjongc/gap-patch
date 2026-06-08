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

## Known OCI A1 Target

These non-secret values are approved for GapPatch deployment handoff. Do not print or copy private key contents; use only the key path.

- OCI host: `168.107.18.30`
- SSH user: `ubuntu`
- SSH key path: `/Users/a11466/.ssh/oci-a1-chuncheon`
- SSH command: `ssh -i /Users/a11466/.ssh/oci-a1-chuncheon ubuntu@168.107.18.30`
- GitHub repository: `https://github.com/hjongc/gap-patch.git`
- Deployment repo directory: `/home/ubuntu/repos/gappatch`
- Compose file: `/home/ubuntu/repos/gappatch/compose.yaml`
- Compose project: `gappatch`
- App container: `gappatch-web`
- Public URL: `https://gappatch.168.107.18.30.sslip.io/`
- Legacy IP health URL: `http://168.107.18.30/api/health`
- Health URL: `https://gappatch.168.107.18.30.sslip.io/api/health`
- Current domain plan: sslip.io HTTPS for beta traffic; replace with a branded domain before broad launch.
- Current TLS plan: Caddy automatic HTTPS for `gappatch.168.107.18.30.sslip.io`.
- Cookie plan: `GAPPATCH_SECURE_COOKIES=true` in the server `.env`.
- Auth plan: real login traffic requires HTTPS unless `GAPPATCH_ALLOW_INSECURE_AUTH=true` is temporarily set for a single-operator HTTP smoke test.
- Server `.env`: expected at `/home/ubuntu/repos/gappatch/.env`; verify presence without printing values.

Before deploying a new ref, capture the rollback ref from the server instead of asking the user
again when SSH is available:

```sh
ssh -i /Users/a11466/.ssh/oci-a1-chuncheon ubuntu@168.107.18.30 \
  'git -C /home/ubuntu/repos/gappatch rev-parse HEAD'
```

Record that value in the deployment evidence as the rollback ref. If SSH is unavailable, stop and
ask for a rollback ref rather than guessing.

## Target Shape

- Platform: Oracle Cloud Infrastructure compute instance.
- Runtime: Docker image built from `node:22-bookworm-slim` with pnpm 9 through Corepack.
- App: Next.js production server for `@gappatch/web`.
- Process manager: Docker Compose with `restart: unless-stopped`.
- Edge: Caddy reverse proxy on external Docker network `web`.
- Compose file: repository root `compose.yaml`.
- Data: Postgres-backed application state in the `gappatch-postgres` Docker volume.
- Legacy migration source: `GAPPATCH_DATA_FILE=/data/state.json` stays mounted so the first Postgres start can import the last file-backed state when the database is empty.

## Local Preflight

Run these from the repository root before any server changes:

```sh
pnpm lint
pnpm typecheck
pnpm test -- --run
pnpm test:e2e
pnpm build
printf 'GAPPATCH_POSTGRES_PASSWORD=compose-preflight-placeholder\n' > /tmp/gappatch-compose-preflight.env
docker compose --env-file /tmp/gappatch-compose-preflight.env config
```

`pnpm build` must finish without Next.js build errors. In the Codex sandbox it may require an unsandboxed run because Turbopack opens an internal port during build.

## Environment

Create the server-side `.env` from `.env.example` inside the deployed repo directory. Keep this file out of git.

Required values:

- `GAPPATCH_MASTER_EMAIL`
- `GAPPATCH_MASTER_INVITE_CODE`
- `GAPPATCH_TEST_EMAIL`
- `GAPPATCH_TEST_INVITE_CODE`
- `GAPPATCH_POSTGRES_PASSWORD`
- `GAPPATCH_GRADING_PROVIDER`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_GRADING_DEPLOYMENT`
- `AZURE_OPENAI_GRADING_TIMEOUT_MS`

Cookie policy:

- Keep `GAPPATCH_SECURE_COOKIES=true` for beta traffic.
- Keep `GAPPATCH_ALLOW_INSECURE_AUTH=false` for real beta traffic. Set it to `true` only for a short, single-operator HTTP smoke test, then remove it again.
- Keep `GAPPATCH_GRADING_PROVIDER=deterministic` until the Azure OpenAI endpoint, key, and deployment name are present.
- Use `GAPPATCH_GRADING_PROVIDER=azure-openai` with `AZURE_OPENAI_GRADING_DEPLOYMENT` set to the Azure deployment name, not just the public model slug. The current grading default is `gpt-5-mini`.
- Legacy aliases `LLM_API_ENDPOINT`, `LLM_API_KEY`, `LLM_MODEL`, and `LLM_API_VERSION` are accepted. `LLM_API_VERSION` is ignored on the Azure v1 API path and exists only for compatibility with older `.env` files.
- Store Azure OpenAI keys in the server `.env` or a secret manager. Do not commit them.

The legacy local invite `BETA-AI-0001` is disabled by default when `NODE_ENV=production`.

State storage policy:

- `compose.yaml` builds `DATABASE_URL` from `GAPPATCH_POSTGRES_PASSWORD` and points the app at the internal `db` service.
- Keep `GAPPATCH_DATA_FILE=/data/state.json` during the first Postgres rollout. The app imports that file into `app_state_snapshots` when Postgres is empty.
- After the first successful migration has been verified, `/data/state.json` becomes a rollback/migration artifact rather than the primary store.

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

## Postgres first-run migration

Before the first deployment of the Postgres-backed build, ensure the server `.env` contains
`GAPPATCH_POSTGRES_PASSWORD`. Generate a URL-safe value on the server and append it without
printing the value. The compose file interpolates this value into `DATABASE_URL`, so avoid
characters that require URL escaping.

On first app boot with an empty Postgres volume:

1. The app connects through `DATABASE_URL`.
2. It creates `app_state_snapshots` if missing.
3. It reads `/data/state.json` when no database snapshot exists.
4. It writes that snapshot into Postgres.
5. Future writes update Postgres, not the file.

Verify the migration without printing user data:

```sh
docker compose -f /home/ubuntu/repos/gappatch/compose.yaml \
  --project-name gappatch \
  --project-directory /home/ubuntu/repos/gappatch \
  exec -T db psql -U gappatch -d gappatch \
  -c "select id, jsonb_array_length(snapshot->'users') as users, jsonb_array_length(snapshot->'history') as history_owners, updated_at from app_state_snapshots;"
```

## Backup

Create a compressed Postgres backup before and after production deploys that change storage:

```sh
umask 077
install -d -m 700 /home/ubuntu/backups/gappatch
docker compose -f /home/ubuntu/repos/gappatch/compose.yaml \
  --project-name gappatch \
  --project-directory /home/ubuntu/repos/gappatch \
  exec -T db pg_dump -U gappatch -d gappatch \
  | gzip > "/home/ubuntu/backups/gappatch/gappatch-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
```

Confirm the backup file exists and is non-empty:

```sh
ls -lh /home/ubuntu/backups/gappatch/
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

The current beta domain is `gappatch.168.107.18.30.sslip.io`; replace it with a branded domain before broad launch.

## Smoke Test

After deployment:

```sh
curl -i http://<host>/api/health
curl -i https://gappatch.168.107.18.30.sslip.io/api/health
curl -I http://<host>/login
curl -I https://gappatch.168.107.18.30.sslip.io/login
curl -I http://<host>/hello/
```

Then verify seeded accounts through HTTPS cookies:

Only run this authenticated smoke over HTTPS. Use a short single-operator HTTP smoke window with
`GAPPATCH_ALLOW_INSECURE_AUTH=true` only when debugging the proxy itself. Never invite real users
while authenticated traffic is served over plain HTTP.

```sh
curl -c /tmp/gappatch-test.cookie \
  -H 'content-type: application/json' \
  -d '{"email":"<test-email>","inviteCode":"<test-invite>","timezone":"Asia/Seoul"}' \
  https://gappatch.168.107.18.30.sslip.io/api/auth/beta-login

curl -b /tmp/gappatch-test.cookie https://gappatch.168.107.18.30.sslip.io/api/daily/today
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

For a storage rollback, keep the `gappatch-postgres` volume intact unless the project owner explicitly approves deleting it. The old `/data/state.json` may be stale after the migration and must not be treated as the latest source of truth once Postgres has accepted writes.

## Open Production Gaps

- Move from the Docker-local Postgres volume to a managed Postgres service before multi-instance scale or broad public launch.
- Add automated off-host backup retention and restore drills.
- Add production secrets validation for external AI grading.
- Add AI grading cost and privacy controls.
- Attach a real domain and HTTPS, then restore secure cookies for all production traffic.
- Add native iOS and Android clients after the mobile web MVP is stabilized.
