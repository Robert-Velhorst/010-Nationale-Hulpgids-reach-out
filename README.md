# Nationale Hulpgids Reach-Out

An outreach tool for finding, matching, and contacting care professionals across Dutch platforms. It supports campaign setup, candidate discovery, AI-assisted matching, message review, and queue monitoring.

## What It Does

- Finds candidates across Nationale Hulpgids, Indeed, PGBvacatures, Zorgbanen, and Jobbird.
- Scores candidate fit against campaign criteria.
- Drafts personalized outreach messages.
- Lets the user review and edit messages before sending.
- Tracks campaigns, candidates, messages, and queue status.
- Provides an emergency stop, privacy export/delete, and redacted diagnostics.
- Runs as a Windows desktop app or as a hosted web app targeted for Hetzner.

## Run Modes

### Windows 11 Desktop App

Build an installer:

```bash
pnpm installer:win
```

The `.exe` installer is created in `release/`. The installed app runs locally, stores data in the Windows user data folder, and creates local secrets on first launch.

### Hosted Hetzner Deployment

Hetzner is the production deployment target. Review [DEPLOYMENT_TARGET.md](DEPLOYMENT_TARGET.md) before provisioning the host, reverse proxy, database, and secrets. The production Docker image serves the built files from `dist/`; Vite is used only for development.

### Local Production Run

```bash
pnpm build
pnpm start:local
```

Local data is stored in `.local-data/`.

### Development

```bash
pnpm dev
```

Development mode uses Vite for hot reloading.

## Required Tools

- Node.js 26.12.0 or newer
- pnpm
- Windows 11 for the installer target

Server deployments also need:

- MySQL or TiDB through `DATABASE_URL`
- `JWT_SECRET`, at least 32 characters
- `CREDENTIAL_ENCRYPTION_KEY`, at least 32 characters
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- OAuth/LLM environment variables for the hosted environment

Desktop local mode does not require MySQL or OAuth.

## Useful Commands

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm doctor:built
pnpm installer:win
```

## Configuration

Security:

- `JWT_SECRET`
- `CREDENTIAL_ENCRYPTION_KEY`
- `TRANSCRIPTION_AUDIO_HOST_ALLOWLIST`

Resource controls:

- `REQUEST_BODY_LIMIT`, default `5mb`
- `SCRAPER_MAX_REQUESTS`, default `30`
- `MESSAGE_QUEUE_CONCURRENCY`, default `2`
- `DISCOVERY_QUEUE_CONCURRENCY`, default `1`
- `SCHEDULED_CAMPAIGN_BATCH_SIZE`, default `20` (cap per scheduler tick, max `200`)

## Documentation

- [Operations guide](docs/OPERATIONS.md)
- [Operator runbook](docs/OPERATOR_RUNBOOK.md)
- [HAI connector](docs/HAI_CONNECTOR.md)
- [Security and privacy](docs/SECURITY.md)
- [Critical path](docs/CRITICAL_PATH.md)
- [Acceptance tests](docs/ACCEPTANCE_TESTS.md)
- [Goal completion matrix](docs/GOAL_COMPLETION_MATRIX.md)
- [Final verification](docs/FINAL_VERIFICATION_REPORT.md)
- [User guide](docs/USER_GUIDE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Project Layout

```text
client/      React frontend
desktop/    Electron desktop launcher
server/     Express, tRPC, queues, scraping, matching
shared/     Shared types
drizzle/    Database schema and migrations
docs/       Operator and review notes
```

## Security Notes

- Desktop mode binds to loopback and uses local auto-login.
- Production sessions require `JWT_SECRET`.
- Stored platform credentials are encrypted.
- Credential list responses do not expose stored secrets.
- Campaign and message data is scoped to the current user.
- Hosted startup requires durable MySQL storage and never falls back to desktop data.
- External delivery remains assisted/manual until a provider supplies a verified compliant API.

## Recovery and Diagnostics

```bash
pnpm doctor
pnpm backup:local -- C:\Backups\ReachOut
pnpm verify:backup -- C:\Backups\ReachOut
pnpm restore:local -- C:\Backups\ReachOut --confirm
```

## License

`package.json` currently declares MIT while earlier project documentation used proprietary language. The repository owner must resolve that legal metadata before public distribution.
