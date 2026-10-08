---
'@nocobase/app-plugin-releases': minor
---

Add `@nocobase/app-plugin-releases`: release management for a NocoBase application. Apps (always running, or started on demand and stopped when idle), releases, environments, deployments and rollbacks, configuration with write-only secrets sealed by the secrets service, logs, upload tickets for CI, and deployment requests with approval. Deployment targets are pluggable drivers; the plugin ships the `host` driver, which deploys through App Hosts in process or in Docker containers (`@nocobase/app-host-docker`). The plugin knows nothing about projects, agents or roles: it declares what can be granted in `shared/access.ts` and the assembling application decides who holds what. CI reaches it with a scoped API key and the application's CLI (`release upload`, `release image`).
