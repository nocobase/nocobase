---
'@nocobase/jobs': major
'@nocobase/app-server': minor
'@nocobase/app-skills': patch
'@nocobase/lifecycle': patch
'@nocobase/app-plugin-scheduler': patch
'@nocobase/app-plugin-knowledge': patch
'@nocobase/app-plugin-mail': patch
'@nocobase/app-plugin-notification': patch
'@nocobase/app-plugin-demo-mode': patch
'@nocobase/app-plugin-jobs-example': patch
'@nocobase/app-plugin-lifecycle-example': patch
'@nocobase/app-plugin-office-flows-example': patch
'@nocobase/app-plugin-realtime-example': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

**Breaking:** Move ordinary and recurring Redis Jobs out of the open-source runtime into the commercial `@nocobase/app-plugin-jobs-redis` Server plugin. Redis deployments must install and register a compatible plugin on every producer and consumer as part of the framework upgrade; selecting an unregistered backend now fails explicitly instead of falling back to Memory. Move Redis-specific type imports from `@nocobase/jobs` to `@nocobase/app-plugin-jobs-redis/config`.

Add application-owned, paired backend registration through `jobsBackendRegistryToken` and public `@nocobase/jobs/backend` contracts while keeping the existing Jobs service token, lazy executors and Memory behavior. Default and Examples templates now declare only Memory. Preserve existing Redis connection, namespace, scopes and job identities; no database or Redis data migration is required. Queue Redis is unchanged.

Existing YAML overrides that relied on template defaults must explicitly declare `adapter: redis` for each Redis Jobs configuration; `connection` alone no longer selects Redis. Updated template examples document the commercial Server plugin installation and registration prerequisite.

Selected configurations with missing, empty or non-string adapters are rejected instead of silently using Memory.

Release the framework first and verify its exact version is downloadable from the customer registry before pinning and releasing the compatible commercial plugin. Redis users must wait through any publication gap and upgrade the framework and plugin together.
