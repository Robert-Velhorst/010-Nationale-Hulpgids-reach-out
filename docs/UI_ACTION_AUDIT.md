# UI Action Audit

| Surface | Action | Backend/state effect | Failure/next step |
| --- | --- | --- | --- |
| Dashboard | Open next action/campaign | Route only; summary is server-derived | Empty state links to Campaigns/Platforms. |
| Campaigns | Create campaign | `campaigns.create` | Validation names invalid criteria/policy. |
| Campaigns | Pause/resume | `campaigns.pause/resume` | Resume is blocked by global stop or archived state. |
| Campaigns | Delete | Archives campaign and preserves ledger | Archived campaigns block outreach. |
| Campaign detail | Discover | `candidates.discover` + readiness + queue | Exact readiness/global-stop blocker shown. |
| Campaign detail | Bulk draft | `messages.bulkOutreach` | Existing/stopped/unqualified candidates are counted as skipped. |
| Campaign detail | Export ledger | `campaigns.exportLedger` | Personal-data acknowledgement required. |
| Candidates | Filter/search/page | Server-bounded candidate queries | Empty/error states preserve filters. |
| Candidates | Import | `candidates.importManual` | Personal-data and source acknowledgement required. |
| Candidate detail | Qualify/review | `candidates.recordQualification` | Sensitive assumptions require acknowledgement. |
| Data quality | Review completeness | Aggregated server metrics | Links to candidate/platform remediation. |
| Duplicate review | Merge/not duplicate | Audited resolution procedures | Current queue acknowledgement for batch decisions. |
| Messages | Edit draft | `messages.update` | Contacted messages are immutable; approval resets after edits. |
| Messages | Approve/reject | Approval snapshot + status | Global stop, dry-run, response, qualification, and sensitive checks. |
| Messages | Bulk approve | Bounded status/approval updates | Compliance, size, and sensitive acknowledgements. |
| Messages | Record delivery | `messages.recordSendAttempt` | Cannot claim sent without approval and evidence. |
| Responses | Record/classify | Response record + follow-up cancellation | Negative/unavailable response stops outreach. |
| Responses | Reopen | Audited manual exception | Reason required; does not send anything. |
| Follow-ups | Prepare | Draft message + scheduled follow-up | Duplicate/negative response/qualification checks. |
| Follow-ups | Approve/skip | Approval snapshot or skip audit | Approval uses same safety gates as messages. |
| Platforms | Save/test credential | Encrypted storage + lifecycle audit | Public-only providers never show connected. |
| Queue | Cancel | Durable and live cooperative cancellation | Active message jobs cannot be ambiguously cancelled. |
| Audit | Search/filter | User-owned campaign/entity event reads | No mutation. |
| Operations | Pause/resume all outreach | Persisted high-risk audited control | Stored reason is returned to blocked actions. |
| Operations | Save retention target | Persisted policy metadata | Does not silently delete records. |
| Operations | Support bundle | Redacted JSON download | Reports config presence, never values. |
| Operations | Privacy export | Current-user JSON download | Explicit acknowledgement; secret fields excluded. |
| Operations | Delete account data | User-root cascade/local owned-data removal | Requires pause plus exact typed phrase. |
| User menu | Sign out | Clears session cookie | Local desktop recreates only an empty local account. |

Manual browser evidence is recorded in `FINAL_VERIFICATION_REPORT.md`. No visible action is documented as provider automation unless it has an implemented verified provider path.
