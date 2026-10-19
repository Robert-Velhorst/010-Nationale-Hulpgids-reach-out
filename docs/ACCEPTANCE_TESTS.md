# Acceptance Tests

| ID | Scenario | Expected result | Evidence |
| --- | --- | --- | --- |
| A01 | Fresh install and build | Frozen install, type-check, tests, build, and doctor pass | CI and final report |
| A02 | Local desktop launch | Loopback app loads with local user and no hosted credentials | E2E + installer run |
| A03 | Hetzner hosted startup without required config | Startup fails before listening and names missing variables | deployment tests |
| A04 | Cross-user campaign/message access | Resource is not returned or changed | router tests |
| A05 | Dry-run approval | Approval is rejected and audited | message tests |
| A06 | Sensitive message approval | Explicit acknowledgement is required | message tests |
| A07 | Message delivery | Status cannot be set to sent directly; approval and evidence are required | message tests |
| A08 | Negative response | Follow-ups cancel/block; audited reopen is required | message tests |
| A09 | Duplicate outreach | Existing active/contacted message blocks another draft | message tests |
| A10 | Provider failure | No mock candidates/session/success is returned | scraper tests |
| A11 | Global stop | Discovery, resume, approval, send, and scheduler fail closed | operations tests |
| A12 | Privacy export | Current-user data downloads; credential secrets and sessions are absent | operations tests |
| A13 | Account deletion | Exact phrase and active global stop required; owned data cascades | operations tests |
| A14 | Support bundle | Runtime/config booleans and counts present; secrets absent | operations tests/manual |
| A15 | Web mutation from foreign origin | HTTP 403 | HTTP security tests |
| A16 | Browser hardening | CSP, frame, MIME, referrer, permissions headers present | HTTP security tests |
| A17 | Readiness | Desktop is ready; hosted mode requires config and database query | readiness tests/manual |
| A18 | Local backup | Copy plus SHA-256 manifest verifies | runbook/manual |
| A19 | Local restore | Missing confirmation or invalid hash fails; valid restore is atomic per file | runbook/manual |
| A20 | Responsive navigation | Desktop and Pixel-size smoke route through primary pages | Playwright |

The external-provider acceptance set is intentionally separate: real login, consent, public-discovery policy, direct-send authorization, provider receipt, rate-limit response, and response synchronization must be run with owner-supplied accounts and may not be simulated as production evidence.
