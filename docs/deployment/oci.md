# GapPatch OCI Deployment Runbook

This runbook prepares the mobile-web-first GapPatch deployment path for Oracle Cloud Infrastructure.

Do not deploy without explicit approval from the project owner. A production deployment requires the target OCI host, SSH user, deployment directory, domain name, TLS plan, environment values, and rollback approval.

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
- Runtime: Node.js 26 with pnpm 9.
- App: Next.js standalone production server for `@gappatch/web`.
- Process manager: `systemd`.
- Edge: Nginx reverse proxy with HTTPS managed outside this repository.
- Data: file-backed MVP state through `GAPPATCH_DATA_FILE`; move to a managed database before multi-instance scale.

## Local Preflight

Run these from the repository root before any server changes:

```sh
pnpm lint
pnpm typecheck
pnpm test -- --run tests/unit/scaffold.test.ts tests/unit/app-services.test.ts tests/unit/deployment-runbook.test.ts
pnpm test:e2e --project=mobile-chromium tests/e2e/mobile-web-flow.spec.ts
pnpm build
```

`pnpm build` must finish without Next.js build errors. In the Codex sandbox it may require an unsandboxed run because Turbopack opens an internal port during build.

## Server Preparation

Install Node.js 26 and pnpm 9 on the OCI host. Confirm the app user can run:

```sh
node --version
pnpm --version
```

Create a deployment directory owned by the app user:

```sh
sudo mkdir -p /opt/gappatch
sudo chown gappatch:gappatch /opt/gappatch
sudo mkdir -p /var/lib/gappatch
sudo chown gappatch:gappatch /var/lib/gappatch
```

## Build And Release

From the deployment directory, fetch the approved revision and install dependencies:

```sh
git fetch --all --prune
git checkout <approved-release-ref>
pnpm install --frozen-lockfile
pnpm build
```

Start the web app on an internal port:

```sh
pnpm --filter @gappatch/web start --hostname 127.0.0.1 --port 3000
```

## systemd Unit

Create `/etc/systemd/system/gappatch-web.service`:

```ini
[Unit]
Description=GapPatch mobile web app
After=network.target

[Service]
Type=simple
User=gappatch
WorkingDirectory=/opt/gappatch
Environment=NODE_ENV=production
Environment=GAPPATCH_DATA_FILE=/var/lib/gappatch/state.json
ExecStart=/usr/bin/env pnpm --filter @gappatch/web start --hostname 127.0.0.1 --port 3000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable the service only after preflight approval:

```sh
sudo systemctl daemon-reload
sudo systemctl enable gappatch-web
sudo systemctl restart gappatch-web
sudo systemctl status gappatch-web
```

## Nginx Reverse Proxy

Route the public domain to the internal Next.js server:

```nginx
server {
    listen 80;
    server_name <domain>;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Add HTTPS before exposing the service to real users.

## Smoke Test

After deployment:

```sh
curl -I https://<domain>/login
curl -I https://<domain>/privacy
```

Then run the mobile E2E suite against the production base URL after explicit approval.

## Rollback

Keep the previous approved git ref. To roll back:

```sh
git checkout <previous-approved-ref>
pnpm install --frozen-lockfile
pnpm build
sudo systemctl restart gappatch-web
```

## Open Production Gaps

- Replace file-backed MVP state with a managed database before multi-instance scale.
- Add production secrets and environment validation for external AI grading.
- Add AI grading provider integration with cost and privacy controls.
- Add account deletion workflow that deletes persisted user data.
- Add native iOS and Android clients after the mobile web MVP is stabilized.
