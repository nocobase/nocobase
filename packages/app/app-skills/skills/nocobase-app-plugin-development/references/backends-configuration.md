# Concurrency, Jobs and Queue backend configuration

These three sections accept only `default` and `backends`. Keep adapter names unchanged: local Concurrency uses `mutex`, Jobs uses `memory`, and Queue uses `inMemory`. A backend name is a deployment selector, not a business resource, scope, task or queue name.

```yaml
concurrency:
  default: local
  backends:
    local:
      adapter: mutex
jobs:
  default: distributed
  backends:
    local:
      adapter: memory
    distributed:
      adapter: redis
      connection:
        host: redis.internal
        port: 6379
queue:
  default: local
  backends:
    local:
      adapter: inMemory
```

Redis requires the corresponding commercial Server plugin, explicitly installed and registered. Declaring an unused Redis backend does not select it or require a Redis connection. A selected Redis backend without its implementation fails; it never silently becomes local. Registered implementations retain their existing entry-level validation and lifecycle: Queue and Concurrency validate unused registered entries, while Jobs resolves adapter options on acquisition.

## Migrate an existing application

Move every old direct entry from `<section>.<name>` to `<section>.backends.<name>`; retain `<section>.default` at the section root with exactly the same selected name. Remove all old top-level entries, including unselected ones. Mixed formats and same-name duplicates are errors, even when a new default selects a valid backend. Merely adding `backends` alongside the old entries is not a migration. There is no compatibility shim.

Update both `config.yml` and application-owned TypeScript configuration factories. Updating a framework dependency does not rewrite an already-generated application's `server/config/concurrency.ts`, `jobs.ts` or `queue.ts`. Use `defineConcurrencyConfig()` for Concurrency. Move Jobs/Queue defaults into `backends` and register `validateAppJobsConfig` from `@nocobase/app-server/jobs` and `validateAppQueueConfig` from `@nocobase/app-server/queue` with `defineAppConfig({ defaults, validate })`. This validates the merged user YAML rather than only the factory defaults.

```ts
import { defineAppConfig } from '@nocobase/app-server/config';
import { validateAppJobsConfig, type AppJobsConfig } from '@nocobase/app-server/jobs';

export default defineAppConfig<AppJobsConfig>({
  defaults: ({ paths }) => ({
    backends: {
      local: { adapter: 'memory', persistence: { path: paths.storage('jobs') } },
    },
  }),
  validate: validateAppJobsConfig,
});
```

Run the application's `config:check` before restarting. Queue no longer discards the historical `connections`, `worker` and `jobs` fields or an invalid default with a warning and then starts on Memory. Migrate their backend configuration explicitly and move business worker/job options to their existing consumer APIs; deleting a warning is not sufficient. Invalid section, map or entry types, missing adapters, malformed defaults and defaults naming absent backends fail without a local fallback. Do not paste credentials into diagnostics.

## Selection and data compatibility

A structurally valid section without `default` keeps that service's existing built-in local behavior, even if `backends` declares entries. Concurrency's factory still selects `memory` by default; the Jobs/Queue template factories still do not set `default`. Concurrency rejects an unknown explicit backend name. Jobs and Queue retain their business-name behavior: an unknown explicit name tries the configured default, then the built-in local configuration when no default exists. No backend inherits options from another entry.

Only the wrapper changes. Preserve adapter, connection target and database, namespace, configured persistence paths, scopes, task names, queue names and resource names. Do not add the backend configuration name to Redis keys or local paths. Keep the same Redis destinations and key encodings during rolling upgrades; no Redis data migration or Realtime change is part of this migration.
