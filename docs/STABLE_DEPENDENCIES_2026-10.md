# October 23, 2026 stable dependency refresh

All 88 original direct package declarations were compared with the official npm `latest` metadata and pinned exactly. Ten versions change: dotenv 18.0.9, jose 6.2.13, mysql2 3.24.6, Hook Form Resolvers 6.0.0, React Query 5.104.5, Electron 45.0.0, Lucide React 1.61.0, Resizable Panels 4.14.8, Streamdown 2.7.1 and Vite 8.3.5. `@electron/fuses` 2.1.3 is added for an isolated packaged runtime check.

Override targets were also compared with public stable releases and refreshed, including major versions of Babel, Mermaid, File Type, JS-YAML, Minimatch, Fast URI and UUID. Passing source and browser tests are required to establish compatibility. A successful package resolution is insufficient. The generated lock records pnpm's exact release-age exclusions; the refresh does not disable the release-age policy globally.

Node's baseline is 24.22.1 within 24.x or 26.12.1 within 26.x. Hosted builds use Node 26.12.1 and pnpm 12.14.0. The Docker build and runtime use the official pinned Trixie Node image. Runtime OS packages update during build, and unused npm/Yarn are removed. Only source inputs enter the build context. `pnpm audit --audit-level=low` retains all known severities as blockers. This is not a full image vulnerability scan.

## Desktop gate

Electron 45 is the latest stable npm release at this refresh. Its embedded Node must independently meet the patched baseline. The Windows job builds the actual installer payload, verifies the packaged executable's RunAsNode fuse without changing it, then reads its real version in Node-only mode. It never launches the GUI as a fallback and accepts no arbitrary executable path. An older embedded Node fails release acceptance; a passing installer build cannot waive this gate. Upstream backport coverage requires separate evidence, and a version mismatch alone is not a finding of a specific exploitable vulnerability.

## Hetzner and data boundary

Hetzner remains the production target under `DEPLOYMENT_TARGET.md`. Compose remains bound to loopback with required hosted OAuth, JWT/encryption secrets and an operator-provided MySQL/TiDB URL. No operator database or deployment is changed by this refresh. Before cutover, inventory the actual database server/version, test the application's Drizzle migrations on an isolated copy, prove backup restoration and rollback, verify OAuth/TLS and per-user access controls, and record the accepted image and database versions. Do not run `db:push` against real data as a version check.

The container smoke runs only synthetic local mode, with no network, no capabilities, a read-only root and temporary data. It proves compiled assets and local readiness, not hosted database acceptance. Browser smoke retains real production assets and local backend; live scraper tests remain opt-in, and no messages or external provider actions are authorized by this CI.

Deprecated transitive dependencies still reported by the latest parent packages remain follow-up work. This refresh does not claim every transitive package or external database has reached the latest public stable version. Full hosted checks, browser checks and packaged runtime evidence determine which release gates pass.
