# Final Verification Report

Verification dates: 2026-08-09 and 2026-08-14.

## 2026-08-14 Revalidation

- Current remote state remained clean and mergeable; all existing Linux, Windows, and browser CI checks were green before the follow-up fix.
- A clean pnpm 10.34.5 frozen install, TypeScript check, production build, built doctor, production audit, full audit, and peer check passed. The full audit still contains only the documented low-severity Babel development-tool advisory.
- The full suite now passes 192 tests with 3 intentional skips. The added regression proves desktop auto-login and ngrok cannot be enabled together at startup.
- The in-app Browser connected but its local webview did not attach. No new visual claim relies on that failed run; the pushed commit's desktop/mobile browser CI remained green, and refreshed CI is required after this follow-up commit.
- Live HAI verification passed again: unauthorized 401, one aggregate operations item, no contact fields, stable cursor, zero unchanged incremental items, and a healthy token-holding proxy.
- The rebuilt Docker image used a 2.70 MB context. Liveness returned 200, an intentionally unavailable database returned readiness 503, memory was about 55 MiB, and graceful stop exited 0 without an OOM kill.
- The rebuilt Windows app reached readiness from a fresh profile, generated two 43-character secrets, kept the listener in the Electron main process, and used about 144 MiB in that main process.
- The refreshed unsigned NSIS installer is 112,369,434 bytes with SHA-256 `692E5724DA8A9BD15AEDD1588FA99A787D59099B73C308631442C27E5BCD4E2F`.
- Installer commands explicitly use `--publish never`, so a local or CI packaging run cannot infer an unintended GitHub release.

## Repository

- Branch: `codex/data-quality-overview`
- Starting commit: `bdd1c01fea575c22a40d9cc58d9832237eb94dff`
- Starting upstream: `origin/codex/data-quality-overview`
- Baseline main: `6ae40a242344c79ec221f91c21fcc48d1d09e662`
- Final commit and push: recorded after this report is committed.

## Delivered

- Approval-gated outreach workflow with persisted emergency stop, retention controls, privacy export/delete, redacted diagnostics, and worker enforcement.
- Operations UI with provider truth, queue health, runtime status, HAI status, and safe operator controls.
- Hosted fail-closed configuration, liveness/readiness separation, HTTP hardening, deterministic pnpm 10 supply-chain policy, backup/restore, Docker, CI, and release runbooks.
- Production static serving and ngrok operation without Vite at runtime.
- Read-only, token-protected, aggregate-only HAI feed and bounded local HAI proxy.
- Windows 11 Electron/NSIS installer with an embedded local server, generated local secrets, and no MySQL/OAuth requirement in desktop mode.

## Verification Ledger

| Gate                      | Result                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript                | Pass: `tsc --noEmit`                                                                                                                                          |
| Backend tests             | Pass: 21 files; 192 passed, 3 intentional skips, 0 failed                                                                                                     |
| Browser workflow          | Pass: desktop Chrome and Pixel-sized mobile, 2/2 in 17.3 seconds, no console errors                                                                           |
| Browser plugin            | In-app Browser was attempted first but its webview did not attach; Playwright with installed Chrome was used as the documented fallback                       |
| Production build          | Pass: Vite 7.3.6, 1,809 modules; lazy frontend routes; split bundled server output                                                                            |
| Startup optimization      | Cold official server on the loaded host improved from about 210 seconds to 11.38 seconds; packaged desktop reached readiness before the first one-second poll |
| Built doctor              | Pass                                                                                                                                                          |
| Frozen install            | Pass with declared pnpm 10.34.5; Docker frozen install also passed                                                                                            |
| Dependency audit          | Production: zero known vulnerabilities. Full toolchain: one low-severity Babel advisory with no published installable fix                                     |
| Peer dependencies         | Pass: no issues                                                                                                                                               |
| Backup/recovery           | Pass: two-file backup verified, restored bytes matched, tampering rejected                                                                                    |
| HAI connector             | Pass: unauthorized 401; one initial aggregate item; zero unchanged incremental items; stable direct/proxy cursor; healthy proxy; no personal-data pattern     |
| Docker                    | Pass: current context 2.70 MB instead of 816 MB; image builds and starts; unavailable DB yields readiness 503 while liveness remains 200                      |
| Docker resources          | About 55 MiB in the refreshed smoke; graceful stop in 1.45 seconds, exit 0, no OOM kill                                                                       |
| Windows unpacked app      | Pass: embedded server owned by Electron main process, readiness 200, fresh 43-character secrets, approximately 144 MiB main-process working set               |
| Windows installer         | Pass: NSIS x64 installer, 112,369,434 bytes; SHA-256 `692E5724DA8A9BD15AEDD1588FA99A787D59099B73C308631442C27E5BCD4E2F`                                       |
| Installer signature       | Unsigned (`NotSigned`); functional local artifact verified, public trust requires the owner certificate                                                       |
| Compose and patch hygiene | Pass: Compose interpolation with synthetic secrets; `git diff --check`                                                                                        |

## Resource Findings

- Server dependencies are bundled into split ESM output while native/optional integrations stay external and lazy. This removed thousands of cold filesystem lookups without eagerly loading Crawlee, Vite, or ngrok.
- The desktop app embeds the HTTP runtime in Electron's main process, avoiding a redundant server process and the disabled `ELECTRON_RUN_AS_NODE` path in hardened Electron builds.
- Docker ignores Electron, Electron Builder, npm, QA, browser, and local-data caches. The build context fell by more than 99%.
- Frontend pages remain route-split; the shared application chunk is 412.64 kB (128.16 kB gzip), and the Operations route is 16.07 kB (5.44 kB gzip).
- Queue and scraper concurrency, request body size, scheduler batch size, API reads, and HAI responses are bounded and configurable.

## External Gates

- Real provider authentication, direct delivery, and response synchronization require owner-controlled accounts, provider authorization, and compliant durable evidence. Assisted/manual send remains the supported mode.
- A live ngrok deployment still needs the owner's token/domain, OAuth registration, durable MySQL, and production secrets.
- HAI integration code is verified, but registering the connected source in the owner's running HAI deployment is an operator action.
- Public Windows distribution needs a code-signing certificate; the verified artifact is unsigned.
- Hosted backup/PITR evidence needs the selected database provider and an isolated infrastructure restore rehearsal.
- `package.json` declares MIT while older project language was proprietary; the repository owner must resolve the license before public distribution.

No external gate is represented as implemented or verified.
