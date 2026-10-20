# Operations Guide

This application has two normal ways to run:

- Windows desktop app for end users.
- Production web app targeted for Hetzner behind a controlled reverse proxy.

Vite is available for development only. Hosted and end-user runs use the built application from `dist/`.

## Windows 11 Installer

Build the installer with:

```bash
pnpm installer:win
```

The generated `.exe` installer is written to `release/`.

The installed desktop app starts its own private local server on `127.0.0.1`, stores app data in the Windows user data folder, and creates its own local secrets on first launch. It does not require a database or OAuth login for local desktop use.

On launch, the desktop shell waits for the local `/api/readiness` endpoint before
opening the dashboard. The local HTTP runtime is embedded in Electron's main
process, so the app does not keep a redundant server process. If it fails to start or never becomes
ready, the app shows a failure dialog with a short redacted server log tail so
the operator is not left on an indefinite loading screen.

For a signed installer, provide Electron Builder signing variables before running the installer command:

```bash
set CSC_LINK=C:\path\to\certificate.pfx
set CSC_KEY_PASSWORD=certificate-password
pnpm installer:win:signed
```

Without these values, `pnpm installer:win` creates a working unsigned installer. The unsigned build keeps executable resource editing disabled because some locked-down Windows environments cannot extract Electron Builder's signing/resource helper without symlink privileges.

## Local Production Run

For a local production-style run without the installer:

```bash
pnpm build
pnpm start:local
```

Local data is stored in `.local-data/`, which is ignored by git.

## Hetzner Production Target

Hetzner is the production target. Follow [DEPLOYMENT_TARGET.md](../DEPLOYMENT_TARGET.md) for the migration and cutover requirements. The production container requires durable MySQL storage and never falls back to the desktop JSON store. It validates hosted secrets and OAuth settings before listening.
`JWT_SECRET` and `CREDENTIAL_ENCRYPTION_KEY` must be unique long random
values, and `OAUTH_SERVER_URL` must be an HTTPS URL that matches the configured
Manus OAuth environment.

Runtime settings:

- `PORT` for a custom local port.
- `HOST` for a custom bind host. The default is `127.0.0.1`; keep public ingress on the Hetzner reverse proxy.

## Resource Controls

These environment variables can tune resource use:

- `REQUEST_BODY_LIMIT`, default `5mb`.
- `SCRAPER_MAX_REQUESTS`, default `30`.
- `SCRAPER_MAX_REQUESTS` is capped at `250` to prevent runaway crawl loops and memory pressure.
- `MESSAGE_QUEUE_CONCURRENCY`, default `2`.
- `DISCOVERY_QUEUE_CONCURRENCY`, default `1`.

Lower the scraper and queue values on small machines. Raise them cautiously only after checking platform rate limits and user experience.
