# Bug and Risk Register

## Fixed in the current implementation

- Platform catalog no longer depends on a pre-seeded hosted database in local mode.
- Generic/blank navigation was replaced by the operational routes.
- Hosted startup no longer falls back silently to non-durable local persistence.
- Consequential outreach can now be stopped globally, including scheduler execution.
- Privacy export/delete and redacted support diagnostics are now reachable by the user.
- Browser mutation origin and security-header gaps are covered.
- Default tests no longer depend on a live third-party scraper request.
- Hardened Electron builds no longer try to use the disabled `ELECTRON_RUN_AS_NODE` fuse; the embedded runtime was packaged and smoke-tested.
- Production server cold start no longer incurs thousands of external package file lookups.
- Docker no longer transmits 816 MB of local installer/package caches, and pnpm 10 frozen install accepts the lock patch metadata.
- Desktop auto-login combined with ngrok now fails during configuration validation instead of merely declining the tunnel after the local server has started.
- Local Windows packaging now explicitly disables publishing, preventing Electron Builder from inferring an unintended GitHub release when a CI environment variable is present.

## Open risks

- **External:** real provider login/send/response behavior is not verified without owner credentials and platform approval.
- **Release:** unsigned local installers can trigger Windows reputation warnings.
- **Infrastructure:** hosted restore proof awaits a selected production database provider.
- **Coverage:** component-level frontend coverage and large-dataset soak coverage remain limited.
- **Legal metadata:** `package.json` declares MIT while prior README language said proprietary; the owner must choose the distribution license.

See `docs/FINAL_VERIFICATION_REPORT.md` for command results and `docs/GOAL_COMPLETION_MATRIX.md` for phase-level status.
