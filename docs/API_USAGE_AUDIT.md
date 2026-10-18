# API Usage Audit

The application exposes tRPC at `/api/trpc`, liveness at `/api/health`, readiness at `/api/readiness`, and OAuth routes under `/api/oauth`. Protected procedures consume a per-user API limit and enforce current-user ownership at resource boundaries.

## Frontend-used procedures

| Router | Procedures used by UI | Notes |
| --- | --- | --- |
| `auth` | `me`, `logout` | Public session discovery/logout. |
| `platforms` | `list` | Public capability catalog only. |
| `campaigns` | `list`, `create`, `pause`, `resume`, `delete`, `getOperatingLedger`, `listOperatingSummaries`, `exportLedger` | Campaign ids are rechecked against current user. |
| `candidates` | `list`, `discover`, `importManual`, `dataQuality`, `getLedger`, `searchForPicker`, `recordQualification`, `getDuplicateReviewQueue`, `mergeDuplicate`, `resolveDuplicatePair`, `resolveDuplicatePairsBatch` | Discovery and imports are bounded. |
| `messageSnippets` | `list`, `create` | User-owned drafting aids; archive remains API-supported. |
| `messages` | `listPage`, `bulkOutreach`, `approve`, `reject`, `recordSendAttempt`, `recordResponse`, `reopenOutreach`, `update`, `bulkUpdateStatus` | No procedure may directly fake provider delivery. |
| `responses` | `list`, `recordCandidateResponse`, `updateClassification` | Response ownership follows candidate/campaign ownership. |
| `followUps` | `getDue`, `getSuggestions`, `prepare`, `approve`, `skip` | Preparation and approval are separate. |
| `platformCredentials` | `getStatus`, `list`, `save`, `testConnection` | List/status omit stored secrets. |
| `queue` | `getStats`, `getJobs`, `getDurableJobs`, `getHealth`, `cancelJob` | Durable rows are current-user scoped. |
| `audit` | `getForCampaign` | Candidate/message variants are available for detail views/tests. |
| `operations` | `overview`, `setControl`, `exportMyData`, `supportBundle`, `deleteMyData` | High-risk controls and privacy workflows. |

## Internal, compatibility, and test procedures

- `system.health` is a template-compatible tRPC health probe; infrastructure should use `/api/health` and `/api/readiness`.
- `system.notifyOwner` is admin-only and not part of the operator workflow.
- `queue.recordJob` supports controlled diagnostics/tests and is globally pause-gated.
- Campaign detail/stats/readiness/next-action procedures are retained for route compatibility and tests even where the current UI uses the combined operating ledger.
- Message list/generate compatibility procedures remain useful for focused clients; the current review UI uses bounded `listPage` and bulk drafting.
- Real-network scraper testing is not an API endpoint and runs only through `pnpm test:live-scrapers`.

## Error behavior

tRPC returns typed error codes (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`, `PRECONDITION_FAILED`, `TOO_MANY_REQUESTS`) and user-facing messages. HTTP origin failures return 403 with a generic JSON error. OAuth errors do not echo tokens. Readiness returns only check booleans, never configuration values.

## Orphan and unsafe endpoint review

No public data mutation procedure was found. Public procedures are session/logout health and platform catalog reads. Consequential mutations are protected, current-user scoped, bounded, and audited where they affect outreach, credentials, provider evidence, privacy, or global controls.
