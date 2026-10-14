# Operator Runbook

## Local Windows run

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm doctor:built
pnpm start:local
```

Open `http://127.0.0.1:3000`. Local data is under `.local-data` for this command and under the Windows Electron user-data folder for the installed app.

## Windows installer

```powershell
pnpm installer:win
```

Install the `.exe` from `release`. Unsigned local builds may show Windows reputation warnings. Production distribution should use `pnpm installer:win:signed` with the signing certificate configured in the release environment.

## Hosted/ngrok run

Set `DATABASE_URL`, `JWT_SECRET`, `CREDENTIAL_ENCRYPTION_KEY`, `VITE_APP_ID`, `OAUTH_SERVER_URL`, `NGROK_AUTHTOKEN`, and optional `NGROK_DOMAIN`, then:

```powershell
pnpm build
pnpm doctor:built
pnpm start:ngrok
```

The app must report `/api/health` HTTP 200 and `/api/readiness` HTTP 200. A health success with readiness 503 means the process is alive but must not receive traffic.

## Docker

Create an untracked `.env` with the hosted values, then run:

```powershell
docker compose config
docker compose up --build -d
docker compose ps
```

The published port binds to loopback by default. ngrok runs inside the app only when explicitly enabled.

## Emergency stop

Open Operations, enter a meaningful reason, and enable **Pause outreach**. This blocks new queue records, discovery, campaign resume, message approval, successful send recording, follow-up approval, and scheduled execution. Draft editing, response recording, audit review, export, and deletion remain available.

Resolve the provider or data issue, inspect queue/audit state, and disable the stop. Resuming is an audited high-risk action.

## Local backup and restore

Stop the app before backup or restore.

```powershell
pnpm backup:local -- C:\Backups\ReachOut-2026-08-08
pnpm verify:backup -- C:\Backups\ReachOut-2026-08-08
pnpm restore:local -- C:\Backups\ReachOut-2026-08-08 --confirm
```

The backup has a SHA-256 manifest. Restore verifies every file and uses a temporary file plus rename for each replacement. It never accepts parent-directory paths.

For hosted MySQL, use the infrastructure provider's encrypted snapshot/PITR process. Before a release, record the snapshot id and perform a restore rehearsal into an isolated database. Point the app at the rehearsal database, run migrations/readiness, inspect counts, then destroy the rehearsal environment.

## Migration and rollback

```powershell
pnpm db:push
```

Migrations are forward-only SQL in `drizzle/`. Take a backup before applying. Application rollback is a prior image/installer plus a compatible database. Do not reverse a destructive migration without a reviewed SQL plan and tested restore.

## Incident triage

1. Pause outreach.
2. Download the Operations support bundle.
3. Check `/api/readiness`, queue health, provider status, and Audit.
4. Preserve timestamps and ids, not personal message contents.
5. For ambiguous provider actions, do not retry until the provider UI confirms whether the first action happened.
6. Restore service only after the blocking condition is understood and an audited operator resumes outreach.
