# Critical Path

## User outcome

An operator can define a care requirement, discover or import candidates, inspect source quality and match reasoning, draft messages, explicitly approve safe content, perform the send manually on the provider, record delivery evidence, capture a response, prepare a follow-up, and inspect outcome metrics without the application inventing provider success.

## Workflow

1. **Requirement:** create a campaign with target platforms, criteria, rate/cooldown policy, and optional schedule.
2. **Discovery:** run public discovery only after campaign readiness and the global operator stop pass. Manual import remains available with personal-data acknowledgement.
3. **Match:** calculate compatibility and retain factor-level reasoning; questionable identities and missing data are routed to review.
4. **Draft:** generate an individual or bounded bulk draft. Drafting does not mean approval or delivery.
5. **Review:** edit content, inspect sensitive-data warnings, qualification state, duplicates, response locks, and dry-run state.
6. **Approve:** create an immutable approval snapshot. Global pause, dry-run, archived campaign, negative response, qualification, and sensitive-content checks fail closed.
7. **Queue/Send:** the tool does not claim direct provider sending. The operator sends in the provider UI and records an external id/URL or a detailed confirmation.
8. **Response:** record/import the reply, classify it, and cancel follow-ups after terminal negative responses.
9. **Follow-up:** prepare and separately approve a follow-up; stopped candidates cannot be contacted until an audited reopen decision.
10. **Metrics:** inspect campaign ledger, queue health, responses, follow-ups, data quality, next actions, and audit history.

## Smoke test

Run:

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm doctor:built
pnpm test:e2e
```

Manual evidence:

1. Start `pnpm start:local` and open `http://127.0.0.1:3000`.
2. Confirm Dashboard, Campaigns, Candidates, Data quality, Messages, Responses, Follow-ups, Audit, Platforms, and Operations open.
3. Create a dry-run campaign and confirm discovery may run but message approval is blocked.
4. Create a normal campaign, import one test candidate with acknowledgement, generate a draft, and approve it.
5. Confirm a message cannot be marked sent through status update; record send evidence instead.
6. Record a negative response and confirm active follow-ups are cancelled/blocked.
7. Pause outreach in Operations and confirm discovery, campaign resume, approval, send recording, and scheduled execution are blocked with the stored reason.
8. Download the support bundle and privacy export; verify neither contains passwords, encrypted values, API keys, or sessions.
9. Keep outreach paused, type the deletion phrase, and verify current-user records are removed.

## External acceptance gates

Real provider authentication, automated send, and response synchronization are not accepted until a real account, explicit authorization, platform-policy approval, and provider-returned evidence are available. Until then, the supported production workflow is public discovery plus approval-gated assisted send and manual response capture.
