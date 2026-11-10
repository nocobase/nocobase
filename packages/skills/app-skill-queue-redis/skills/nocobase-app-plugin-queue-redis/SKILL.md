---
name: nocobase-app-plugin-queue-redis
description: Configure the NocoBase 3 Redis Queue backend, explicitly register its Server-only plugin, migrate Queue backend factories and identity imports, and diagnose missing Redis implementation without changing Jobs.
---

# Redis Queue integration

Before installing or configuring the plugin, read [Installation and version selection](references/installation.md). This public Skill can be installed without the commercial runtime package.

Use the installed package's README and public `@nocobase/app-plugin-queue-redis/server` and `/config` declarations. This plugin is Server-only; do not add an empty Client or replace the application-owned `queueServiceToken`.

1. Confirm the application supplies compatible `@nocobase/app-server`, `@nocobase/service-provider` and `@nocobase/queue` production peers with the implementation registration API. Preserve existing application composition.
2. Register the default Server plugin in `server/plugins.ts`. Keep the host `QueueServiceProvider` before plugin Providers. Registration does not connect; business handlers register in boot and publication starts only after host start.
3. Add `redisQueueConfig({ connection, namespace, ...options })` from `/config` to the existing `queue` configuration section, then explicitly select its key as `queue.default` or a queue's second argument. Do not add a parallel plugin configuration section. Never read or expose connection credentials in diagnostics.
4. Missing implementations fail for selected/default Redis entries; an unselected legacy Redis declaration can coexist with Memory. Common options and every registered backend's options are validated even when unused, without connecting.
5. Replace old `QueueService.registerBackend()` calls with application Provider registration of `new RedisQueueImplementation({ name: factory })`; do not also enable the default Redis plugin. `queueBackend` names that factory. Import `redisQueueIdentity` from this plugin's Server entry, never from OSS Queue.
6. Preserve target/database, namespace, queue names, BullMQ version and version-1 envelope during migration and rollback. Do not drain, clear, rename, rebuild or automatically move historical Redis data. Redis must persist data and use noeviction; Cluster and keyPrefix are not supported.
7. Verify publication, local handlers, host shutdown and production build/start against installed artifacts. Cross-process consumers compete; handlers are not broadcast across instances. Concurrency/cancel/pause are local, rateLimit and drain are shared. Omitted rateLimit leaves it untouched and null removes it. Never promise exactly-once; use idempotent handlers.

Jobs, schedules, realtime, caches and locks are separate services. Do not change them as part of Redis Queue setup. Coordinate compatible OSS API, commercial plugin and final OSS removal releases; rollback must restore a compatible composition, not merely uninstall the plugin.
