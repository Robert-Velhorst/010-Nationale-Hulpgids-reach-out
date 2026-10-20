# Technical Audit

> Historical audit (2026-08-08 through 2026-08-09): Ngrok was present in that
> snapshot. The current source has no Ngrok launcher or runtime configuration;
> public deployment targets Hetzner. The audit below records prior behavior.

## Scope and baseline

Audit dates: 2026-08-08 through 2026-08-09. Starting branch: `codex/data-quality-overview`. Starting commit: `bdd1c01fea575c22a40d9cc58d9832237eb94dff`. The branch began clean and tracked `origin/codex/data-quality-overview`; `origin/main` was `6ae40a242344c79ec221f91c21fcc48d1d09e662`.

The repository is a React 19 SPA, Express/tRPC service, Drizzle/MySQL hosted data layer, JSON-backed desktop data layer, in-memory worker with durable job records, ngrok tunnel, and Electron/NSIS Windows installer. Vite is development/build tooling only. Production, ngrok, and desktop runs serve prebuilt static assets.

## What was inspected

- All tracked source, migrations, tests, package metadata, desktop runtime, scripts, and existing documentation.
- All 116 phases in the supplied goal prompt.
- Ownership checks across campaigns, candidates, messages, responses, follow-ups, queues, credentials, and audit events.
- Provider discovery/authentication/send behavior and the distinction between public discovery, verified authentication, assisted send, and confirmed delivery.
- Local runtime persistence, committed-file hygiene, security headers, secrets policy, dependency overrides, rate limits, scheduler/queue behavior, and installer isolation.
- Baseline checks: TypeScript passed. The original full test run had 180 passing, 2 skipped, and 3 Crawlee timeout failures; the real-network scraper smoke has since been moved to an explicit opt-in lane.

## Major findings and disposition

| Finding | Risk | Disposition |
| --- | --- | --- |
| No global emergency stop | High | Added persisted per-user control and server/worker enforcement. |
| No account-wide privacy export/delete | High | Added secret-free export and pause-gated cascade deletion. |
| Hosted startup allowed an implicit local data fallback | High | Hosted mode now requires `DATABASE_URL` and a dedicated encryption key. |
| Liveness was used as readiness | Medium | Added `/api/readiness` with config and database checks. |
| Missing CSP, frame protection, and same-origin mutation check | High | Added browser headers, HTTPS HSTS, and origin enforcement. |
| No redacted support bundle | Medium | Added current-user support diagnostics without secret values. |
| No CI, Docker, E2E, doctor, or backup/restore path | High | Added each with separate release and live-provider lanes. |
| Old `todo.md` contradicted implemented behavior | Medium | Replaced by a current, blocker-focused roadmap. |
| Real provider send automation is unavailable | External | Remains assisted/manual; success requires explicit delivery evidence. |
| Real provider authentication is incomplete or policy-dependent | External | UI/API continue to report exact capability and verification state. |

## Data and ownership

User-owned roots are `campaigns`, `platformCredentials`, `candidateIdentities`, queue/rate/credential/audit records, message snippets, qualification/duplicate decisions, and operator controls. Campaign cascades own candidates; candidates cascade messages, factors, responses, sources, and follow-up relationships. The new `userOperatorControls` table uses the user id as its primary key and cascades on account deletion.

Local desktop mode mirrors these collections in `local-store.json`. Deletion computes owned campaign, candidate, message, and identity sets before filtering every dependent collection. Hosted deletion removes the user root and relies on declared database cascades.

## Security model

- Hosted sessions require a 32-character `JWT_SECRET`; credential storage requires a separate 32-character `CREDENTIAL_ENCRYPTION_KEY`.
- Local desktop mode binds to loopback, auto-creates per-install secrets, and strips inherited ngrok variables.
- External action state is never inferred from a queue attempt. Approval, delivery evidence, response, follow-up, and audit records remain distinct.
- CSP, clickjacking protection, MIME sniff protection, permissions policy, cross-origin isolation headers, and HTTPS HSTS are emitted centrally.
- Unsafe browser methods with an `Origin` header must match the direct or forwarded host.
- Logs, durable queue payloads, exports, and support bundles use redaction or omit secret fields.

## Resource utilization

- UI pages remain route-level lazy chunks.
- Campaign operating summaries cap parallel work at 8.
- Discovery concurrency defaults to 1; message concurrency defaults to 2; scheduled batches default to 20 and cap at 200.
- Search/list APIs use bounded pagination and the queue/support diagnostics use bounded recent windows.
- Live scraping is excluded from the deterministic unit lane and limited independently.
- The production image is multi-stage and prunes development dependencies.
- Split server bundling reduced loaded-host cold startup from about 210 seconds to 11.38 seconds without eagerly loading ngrok, Crawlee, Vite, or native database adapters.
- The packaged desktop app uses one Electron main process for its local HTTP runtime; its verified working set was approximately 151.6 MB.
- Docker's final context was 2.69 MB, down from 816 MB of source plus local caches; its smoke container used 52.22 MiB and 0.04% CPU while idle.

## Residual risks

- Provider authentication, sending, and response synchronization require real account authorization and platform-policy approval before they can be verified.
- Hosted backup execution and point-in-time recovery are infrastructure-provider responsibilities; the repository documents the procedure but cannot exercise an unknown production database.
- The UI is not fully internationalized. Message drafting supports Dutch and English, while application chrome remains primarily English.
- Team collaboration is limited to user/admin authorization; there is no organization membership or delegated campaign ownership model.
- Automated retention deletion is intentionally absent. The UI records the policy target but requires an operator-controlled archive/delete decision.
