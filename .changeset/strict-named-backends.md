---
'@nocobase/jobs': minor
'@nocobase/queue': minor
'@nocobase/app-plugin-concurrency': minor
'@nocobase/app-server': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
'@nocobase/app-plugin-knowledge': patch
'@nocobase/app-plugin-mail': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-scheduler': patch
---

**Breaking configuration migration:** Concurrency, Jobs and Queue now declare named configurations under `backends`, with `default` selecting a name in that map. Move all direct entries into `backends` in both YAML and application-owned configuration factories. Legacy, unknown and mixed top-level fields are rejected even when unused; Queue no longer ignores `connections`, `worker`, `jobs` or invalid defaults with a Memory fallback. Preserve existing adapter names, connections, namespaces, persistence paths and business resource names; no Redis data migration is required.
