# HAI Connector

Reach-Out exposes a disabled-by-default, read-only feed compatible with HAI's
allowlisted `json-feed` connected source. The feed contains only operational
control and campaign summaries. Candidate names, contact details, campaign
descriptions, message bodies, credentials, and sessions are excluded.

## Reach-Out configuration

Generate a separate random token of at least 32 characters and configure:

```powershell
$env:HAI_CONNECTOR_ENABLED="true"
$env:HAI_CONNECTOR_TOKEN="replace-with-a-separate-random-token"
$env:HAI_CONNECTOR_USER_ID="1"
pnpm start:local
```

For hosted or ngrok operation, `HAI_CONNECTOR_USER_ID` is required and must be
the one user whose aggregate campaign context may be exported. Do not reuse the
session, OAuth, credential-encryption, or ngrok token.

The protected endpoint is:

```text
/api/integrations/hai/feed
```

It accepts `Authorization: Bearer <token>` or `X-HAI-Connector-Token`. Reads are
recorded in the Reach-Out audit log. The response is capped at one operations
record and 100 campaign records and uses stable external IDs for HAI upserts.

## HAI local proxy

HAI's generic JSON feed deliberately does not store authorization headers.
Run the bundled proxy beside Reach-Out so the token stays in process
environment rather than in HAI's source URL:

```powershell
$env:REACHOUT_HAI_URL="http://127.0.0.1:3000/api/integrations/hai/feed"
$env:REACHOUT_HAI_TOKEN=$env:HAI_CONNECTOR_TOKEN
pnpm connector:hai
```

The proxy listens on `127.0.0.1:39411` by default and exposes `/feed` and
`/health`. It follows no redirects, times out after eight seconds, caps the
response at 1 MiB, and validates the bounded HAI feed contract.

Create an HAI connected source with:

- connector: `json-feed`
- sync target: `http://127.0.0.1:39411/feed` for native HAI, or a deliberately
  reviewed host-reachable address for HAI in Docker
- project key: `nationale-hulpgids`
- permissions: `metadata,read`

For Docker Desktop, exposing the proxy beyond loopback is an explicit operator
decision. Prefer a private Docker network or a firewall-scoped host port; never
publish this proxy through ngrok. The Reach-Out upstream endpoint remains token
protected in every mode.

## Trust boundary

This connector cannot create or change campaigns, approve or send messages,
retrieve candidate personal data, change the global stop, or invoke tools in
either application. HAI remains advisory and Reach-Out remains the authority
for outreach review, approval, evidence, and audit history.
