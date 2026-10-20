# Troubleshooting and Error Catalog

| Symptom | Meaning | Action |
| --- | --- | --- |
| Readiness 503 | Config or hosted database is unavailable | Run `pnpm doctor:built`; inspect config booleans/support bundle. |
| Global pause message | Operator emergency stop is active | Resolve the stored reason; inspect Audit before resuming. |
| Campaign readiness blocked | Missing platforms/criteria/credential or policy issue | Open campaign readiness details and Platforms. |
| Public search only | Provider authentication automation is not implemented/approved | Use public discovery and assisted send. |
| Approval blocked on dry-run | Safety invariant | Create a non-dry-run campaign after review. |
| Approval blocked by response | Candidate opted out/is unavailable | Do not contact; reopen only with documented new evidence. |
| Send evidence required | Tool cannot verify external delivery itself | Check provider UI and enter provider evidence. |
| Ambiguous send | Provider outcome cannot be established | Do not retry; inspect provider history first. |
| HTTP 403 cross-origin | Browser origin did not match app host | Use the configured Hetzner application URL and check reverse-proxy host forwarding. |
| Installer starts then closes | Server/build/local-data startup failure | Reinstall; preserve the displayed redacted log tail. |
| Backup verification failure | File missing or hash changed | Do not restore; create a new backup or recover the original. |
| Crawlee live test timeout | Third-party site/network unavailable | Run default tests; retry opt-in live lane later without claiming provider readiness. |
