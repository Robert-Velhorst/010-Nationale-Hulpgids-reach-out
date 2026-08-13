# Changelog

## Unreleased

### Added

- Server-enforced per-user emergency stop and Operations control center.
- Secret-free privacy export, full user-data deletion, and redacted support bundle.
- Hosted readiness, same-origin mutation protection, CSP and browser hardening headers.
- Doctor, local backup/verify/restore, Docker, CI, Windows installer workflow, and desktop/mobile E2E smoke.
- Complete audit, acceptance, security, runbook, traceability, and verification documentation.
- Read-only aggregate HAI feed and token-holding local HAI proxy.

### Changed

- Hosted production now requires durable `DATABASE_URL` storage and a dedicated credential-encryption key.
- Live provider scraping is an explicit opt-in test lane; deterministic tests remain in the default suite.
- Product documentation now reports assisted/manual provider behavior and external blockers directly.
- Server production output is split-bundled for fast cold starts while optional/native integrations remain lazy.
- Electron now owns the local HTTP runtime directly, avoiding the hardened RunAsNode incompatibility and a redundant process.
- Docker context and pnpm lock metadata are deterministic across Windows and Linux.
- Unsafe desktop-plus-ngrok configuration now fails before the local server starts.
- Windows installer commands now explicitly build without publishing artifacts.
