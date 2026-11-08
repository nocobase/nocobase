---
name: nocobase-app-plugin-jobs-redis
description: Configure NocoBase 3 distributed Jobs and recurring Schedule execution with the commercial Jobs Redis Server plugin; migrate existing OSS Redis Jobs, fix JobsBackendNotRegisteredError, preserve pending jobs and scheduler identities, and distinguish Jobs Redis from Queue Redis.
---

# Jobs Redis

Before installing or configuring the plugin, read [Installation and version selection](references/installation.md). This public Skill can be installed without the commercial runtime package.

## When to use

Use when an application needs multiple processes to share ordinary background tasks or recurring schedules, or when upgrading an existing Redis Jobs deployment to the commercial backend. Do not use for Redis Queue, caching, WebSocket transport, or implementing business handlers.

## Public surfaces and prerequisites

The application must supply a compatible Jobs service with `registerImplementation(name, implementation)` and the `JobsImplementation` contract from `@nocobase/jobs`. Install the authorized commercial package and register `@nocobase/app-plugin-jobs-redis/server` in every producer and consumer Server composition root. There is no Client registration, API endpoint, permission set or separate registration token.

Business plugins continue to resolve `jobExecutorServiceToken` from `@nocobase/app-server/jobs`. They register handlers/rules before calling the executor's `setup()` in their provider's `start()`, and close executors at shutdown. Do not create private application Jobs services or register adapters from each business plugin.

## Procedure

1. Inspect the application's existing Server plugin declaration and configuration factory without reading credentials. Confirm the framework supports the backend API before changing selection.
2. Add the commercial Server declaration once. Its provider calls `app.container.resolve(jobExecutorServiceToken).registerImplementation('redis', new RedisJobsImplementation())` during `register()`; registration is synchronous and opens no Redis connection. The service requires no setup, registration freeze or boot-time preflight. Register before acquiring a Redis executor; configuration and missing implementation errors are reported on acquisition. Duplicate names reject and existing executors cannot be replaced.
3. Define a named `jobs` entry with `adapter: redis` and plain `connection` options in the application's configuration, then select it with `jobs.default` or the consumer's existing named Jobs selector. Templates supply only Memory; they do not predefine Redis.
4. Preserve connection/database, namespace, scope, task names and handler sets when migrating existing data. Ordinary queues remain `jobs/<base64url(JSON.stringify([scope]))>` and recurring queues remain the scope, with namespace as BullMQ prefix. Do not delete queues, rewrite historical migrations or change BullMQ `6.3.6` during this migration.
5. Move Redis-specific type imports to `@nocobase/app-plugin-jobs-redis/config`. `./implementation` exports `RedisJobsImplementation` for explicit standalone composition through `service.registerImplementation('redis', new RedisJobsImplementation())`, followed directly by executor acquisition and startup, not for replacing the application's service.
6. Verify an ordinary task and recurring firing through the real application, including named selection, restarts and separate instances. Use isolated generated test data and authorized local Redis, not existing business data.

## Configuration and operational constraints

`concurrency` is per worker. `attempts` is the ordinary failure budget; explicit aborted interruptions and stalled recovery retain their prior semantics. Retention defaults remain `{ count: 1000 }` for completed jobs and `{ age: 604800 }` for failures. Redis must persist its data and use `maxmemory-policy noeviction`; account for every queue and worker connection.

A selected Redis backend without registration fails with `JobsBackendNotRegisteredError`; it never degrades to Memory. An unused Redis entry does not require this plugin. A lost enqueue reply may follow acceptance in Redis, and crash recovery can replay work. Make effects idempotent with stable business/job/occurrence IDs; do not claim exactly-once effects or automatically retry uncertain submissions.

The application owns deployment configuration and handlers; the plugin owns its adapter and Redis connection lifecycle. Queue Redis is unchanged. There is no added HTTP authorization surface; existing business API permissions remain authoritative.

## Verification and upgrades

Verify ordinary task execution and recurring firing through the target application's public APIs using an isolated task-owned Redis. Include named selection, worker restarts, separate producer/consumer instances, failure retries and idempotent business effects. Run the application's scoped checks and production build; source tests in a commercial development checkout are optional maintainer tools, not installation prerequisites.

Upgrade the framework and plugin to a compatible pair actually available through the customer's registry. Preserve queue identities and data, and roll back the complete compatible package, configuration and lockfile set rather than falling back to Memory.
