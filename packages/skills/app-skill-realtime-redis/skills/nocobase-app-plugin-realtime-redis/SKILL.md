---
name: nocobase-app-plugin-realtime-redis
description: Install, register and configure the commercial Redis realtime broker; migrate standalone factory imports and verify cross-instance recovery without changing business topics.
---

# Realtime Redis integration

Before installing or configuring the plugin, read [Installation and version selection](references/installation.md). This public Skill can be installed without the commercial runtime package.

## Prerequisites

Use a compatible app-server exposing realtimeBrokerRegistryToken and the application's single core RealtimeProvider. Read the installed package declarations and README. Do not infer compatibility from a template version or a successful config check. No Client or CLI entry exists.

## Application setup

Install this package and explicitly add the default export from `@nocobase/app-plugin-realtime-redis/server` to the existing Server plugin list. Do not replace realtimeServiceToken or create another service. Register custom factories in register before anyone resolves the host service. A custom WebSocket transport must explicitly compose the core Provider and adapt its transport.

Keep private configuration under realtime: adapter redis, a stable namespace shared across replicas, and redis.connection. Namespace defaults remain app.name then default. No new environment variables or automatic configuration factory are contributed. Unselected Redis settings do not require this implementation; selected missing/invalid/unreachable Redis fails instead of reverting to Memory.

## SDK migration

Import createRedisRealtimeBroker and RedisRealtimeBrokerOptions from `@nocobase/app-plugin-realtime-redis/broker`. Import createRealtimeService and generic contracts from `@nocobase/realtime/server`. Inject the broker and await setup/close. Do not share a broker between services or independently close host resources.

## Verification and limitations

Verify zero-local-subscriber publication, namespace and user isolation, both disconnect controls, Redis outage, resync and authorized API catch-up. Run required integration cases on exclusively owned loopback Redis; missing configuration must fail rather than count skipped tests as passed. Same-process services do not prove multi-process browser behavior.

Standalone Redis only; no Cluster/Sentinel failover claim. Pub/Sub ignores logical DB isolation and a namespace is not protection from another credential holder. Use Redis channel ACLs and network isolation. Never promise replay, global ordering, permanent deduplication or browser delivery. Ambiguous publish outcomes must not trigger automatic resend. onReady should refresh authoritative data; persisted session validation recovers missed controls.

## Upgrade and removal

Deliver additive OSS API, compatible commercial package, application registration, then final OSS Redis removal. Resolve actual published peer floors before release. Roll back the complete package, lockfile, Server composition and configuration cohort. Do not uninstall while selecting redis or mix Memory and Redis replicas. No database migration is involved; business recovery remains owned by each business plugin.
