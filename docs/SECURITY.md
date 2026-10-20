# Security, Threat Model, and Privacy Impact

## Protected assets

Candidate identity/contact data, care-context criteria, message content, provider credentials/sessions, approval evidence, response content, audit records, and user account ownership.

## Trust boundaries

- Browser/Electron renderer to Express/tRPC.
- Hosted OAuth identity to current-user database ownership.
- Server to MySQL, LLM/storage proxies, Hetzner ingress, and public provider pages.
- Operator-reviewed draft to an external provider UI.
- Local Electron process to the per-user Windows data directory.

## Primary threats and controls

| Threat | Control |
| --- | --- |
| Cross-user object access | Current-user ownership checks and negative tests. |
| CSRF/cross-origin mutations | Same-origin enforcement for unsafe methods plus session cookie policy. |
| XSS/clickjacking | React escaping, CSP, `frame-ancestors`, and `X-Frame-Options`. |
| Secret leakage | Dedicated encryption key, AES-256-GCM, response omission, redaction, and no secret fields in exports/support bundles. |
| Desktop data exposure | Loopback binding, sandboxed renderer, generated per-install secrets, and removal of public-tunnel support. |
| False provider success | Unsupported sends throw; delivery requires approval and evidence. |
| Runaway outreach | Rate limits, cooldowns, quiet hours, bounded queues, readiness, and global emergency stop. |
| Duplicate/ambiguous action | Approval snapshots, send attempts, duplicate candidate review, existing-message checks, and manual evidence. |
| Path traversal | Normalized storage keys and backup/restore containment checks. |
| Dependency compromise | Frozen lockfile, overrides, CI on Windows/Linux, and release-only installer workflow. |

## Privacy impact

The tool may process health-adjacent and care-context personal data. Collection must be limited to what is needed to assess a care role and contact a candidate. Sensitive assumptions require human acknowledgement; candidates can be qualified, rejected, or routed to review. Data is not exported silently.

Operators can export current-user data and permanently delete the account. Exports exclude passwords, encrypted passwords, API keys, and session data. Deletion requires the global stop and an exact phrase. The retention target is recorded per user; automatic deletion is not enabled because destructive policy execution requires an organization-specific legal basis and retention schedule.

## Secret rotation

1. Pause outreach and stop workers.
2. Back up the database and local data where applicable.
3. Rotate OAuth/provider credentials at the provider first.
4. Rotate `JWT_SECRET`, which invalidates hosted sessions.
5. Rotate `CREDENTIAL_ENCRYPTION_KEY` only with a planned re-encryption migration; changing it alone makes stored credentials unreadable.
6. Rotate infrastructure tokens, then restart and run readiness/doctor checks.
7. Re-test each provider. Never mark a credential connected without a verified flow.

## Reporting

Do not include raw candidate data, message content, cookies, tokens, passwords, API keys, or database URLs in issue reports. Attach the Operations support bundle and describe the exact action, timestamp, campaign id, and visible error.
