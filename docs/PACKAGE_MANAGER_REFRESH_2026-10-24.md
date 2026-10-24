# Package manager and parser follow-up

The stable migration draft now selects pnpm 12.15.0 in the package manifest,
both CI matrices, Windows installer workflow and container. The manifest uses
the npm-published SHA-512 in Corepack hexadecimal form; the regenerated boot
lock matches 12.15.0, retaining the complete project graph in the other YAML
document.

A full fresh audit identified GHSA-27r3-jxmh-p828 in body-parser 2.3.0 beneath
Express. The project lock now selects 2.4.0 within the declared parent range.
Only that exact security-fix release is added to the existing release-age
exclusions. The complete final lock audits with zero known findings. Direct
app dependency declarations, overrides, scripts, cases, build allow-list and
security gates are unchanged.

JSON/YAML, frozen lock and whitespace checks pass. Resolution ignored lifecycle
scripts. No local app suite, build, native SDK, database/provider operation or
deployment was run for this follow-up. Old hosted results do not qualify the
new head.

The preceding e77e566 installer failed its packaged Node security baseline.
That gate and the selected Electron version remain unchanged. Fresh current-head
qualification is required; a clean dependency audit does not clear the prior
runtime finding or establish complete native currency. Do not merge or release
based on the package-manager/parser update alone.
