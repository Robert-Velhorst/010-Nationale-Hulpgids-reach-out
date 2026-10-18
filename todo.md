# Current Roadmap and Blocked Items

The core approval-gated assisted-outreach workflow is implemented. Remaining work must not be presented as available until its acceptance gate passes.

## External provider gates

- Obtain owner-controlled test accounts and written confirmation of allowed discovery/auth/send behavior for each provider.
- Re-verify Nationale Hulpgids authenticated login against the current site and account consent flow.
- Implement direct send only if a compliant API or explicitly authorized browser flow returns durable provider evidence.
- Add response synchronization only after provider authorization; manual/imported response capture remains the supported path.
- Run `pnpm test:live-scrapers` in an approved low-rate window and record provider/date/account scope.

## Product follow-ups

- Add full application UI translation for Dutch and English; message content already supports both.
- Add organization membership and delegated campaign permissions only when multi-operator use is required.
- Expand component-level frontend tests beyond utility and E2E coverage.
- Add a controlled large-dataset soak fixture and performance budget in CI.
- Add an organization-approved retention executor only after legal basis, retention periods, and restore window are defined.
- Resolve the package `MIT` metadata versus the previous proprietary README statement before distribution.

## Release gates

- Configure a Windows code-signing certificate and use `pnpm installer:win:signed` for public distribution.
- Select the hosted MySQL provider, enable encrypted snapshots/PITR, and complete an isolated restore rehearsal.
- Configure production OAuth, ngrok domain/token, database, session secret, and credential-encryption secret.
- Complete real provider acceptance without test/mock evidence being used as production proof.
