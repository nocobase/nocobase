---
name: nocobase-app-plugin-caching-redis
description: Configure shared Redis Cache, Counter and BloomFilter through the application's original cachingToken; diagnose driver registration, named providers, lifecycle, limits and safe removal. Not for queues, Jobs, Realtime or distributed locks.
---

# Redis caching integration

Before installing or configuring the plugin, read [Installation and version selection](references/installation.md). This public Skill can be installed without the commercial runtime package.

## Prerequisites

Use a compatible host with instance-level `Caching.registerDriver`. Install the plugin plus host production peers, register its `/server` default export in server composition, and retain core CachingProvider before the plugin and draining consumers after it. Package installation and configuration alone do not register the driver. Do not import plugin internals or create a second service/Token.

## Configure

The App owns the original `caching.default` and `caching.providers`. Add a named provider with `driver: redis`, `connection: { host, port, db, username?, password? }` and a deployment-specific `keyPrefix`. Import config types and pure `validateRedisCacheProviderConfig` from `@nocobase/app-plugin-caching-redis/config`. Map secrets explicitly in the App config factory; never send them to browser configuration or logs. URL, TLS, Cluster and Sentinel are unsupported. Do not infer support from ioredis capabilities.

## Use and verify

Resolve the original `cachingToken` from `@nocobase/app-server/caching`. Obtain Cache, Counter or BloomFilter with the intended namespace/provider. Verify a write in one authorized replica and a read in another against the same endpoint/database/prefix; use a unique disposable namespace. The installed Redis plugin initializes every configured Redis provider during boot, even when Memory is the default, and waits for connection/authentication/database selection. An invalid or unavailable unused Redis definition fails startup. Getters reuse prepared connections; boot success does not prove every data command has ACL permission or that Redis will remain available. Without the Redis plugin, core driver resolution remains lazy and a missing driver fails when its provider is first selected; unknown named providers never silently fall back.

Redis Cache accepts strict JSON, not arbitrary Memory values. Positive fractional millisecond TTL rounds up; absent is persistent. Counter's explicit TTL applies only on first creation and does not renew. Bloom needs reserve and is probabilistic, not exact membership. Local wrap coalescing is not a distributed lock. Bounded batches may partially write; read result budgets can fail even with small requests. Do not retry an uncertain take or increment automatically.

Cache batch reads and writes use bounded explicit GET/SET pipelines, not transactions. GET keeps WRONGTYPE as failure rather than MGET's non-string-as-missing behavior. Each SET retains its own TTL. Per-command errors stop subsequent groups, but earlier writes and successful siblings are not rolled back or replayed. deleteMany uses one deduplicated DEL.

An operation failure does not disconnect or replace the initialized client. Healthy connections remain usable after command, decoding or loader errors. Automatic reconnect and command replay are disabled; a connection that actually ends requires an application rebuild, not a transparent retry. Shutdown and failed-start cleanup remain responsible for explicitly disconnecting resources.

## Shutdown and removal

Close the whole application. Core Caching.dispose is non-owning for Redis and does not disconnect the plugin. Shutdown rejects new work, waits admitted wrap/loaders and closes its private connections without deleting data. Timeout is failure, not proof of cancellation; the host does not automatically retry its first shutdown. Do not add lifecycle wrappers to core or change Memory semantics.

Before removing the package and registration, change the default to a present provider and drain dependent work. Multi-replica fallback to Memory loses shared behavior; reduce to one replica or restore an accepted shared backend. Prefix/protocol changes and earlier experimental artifacts need separate migration planning. Do not scan other keys or use FLUSHDB/FLUSHALL.

## Completion checks

Confirm effective named routing and cross-replica behavior, absence of credential leakage, resource cleanup, compatible published peers and actual production artifact identity. Confirm that the installed framework supports instance-level driver registration and satisfies the chosen plugin release's actual peers; the existence of this public guide does not establish that a compatible runtime is published. Read the package README for exact limits, support scope, upgrade and failure behavior.
