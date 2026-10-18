# Task Graph

```mermaid
flowchart TD
  A["Repository and prompt audit"] --> B["Baseline checks"]
  B --> C["Data ownership and operator controls"]
  C --> D["API enforcement and privacy"]
  D --> E["Runtime security and readiness"]
  E --> F["Operations UI"]
  F --> G["Tests and browser smoke"]
  E --> H["Doctor, backup, Docker, CI"]
  C --> I["Migration 0009"]
  G --> J["Acceptance and security evidence"]
  H --> J
  I --> J
  J --> K["Fresh-clone and installer verification"]
  K --> L["Commit, push, and final report"]
```

Critical dependencies:

- Privacy deletion depends on complete ownership/cascade mapping.
- Emergency stop depends on persistence plus enforcement in API and scheduler paths.
- Browser acceptance depends on build, local production startup, and desktop auto-login isolation.
- Hosted readiness depends on startup configuration and a database query.
- Release completion depends on deterministic tests, build, doctor, no-secret search, migration review, and manual browser evidence.
