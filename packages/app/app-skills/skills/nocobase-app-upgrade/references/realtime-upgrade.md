# Realtime upgrades

## Decide which changes apply

Use this reference when BASE → TARGET changes the Realtime contracts used by the application or its plugins. The declared-topic contract was introduced on the `@nocobase/app-server` 3.0.0 prerelease line: undeclared topics are rejected, server publication and subscription authorization are asynchronous, and publication returns an event receipt. Check the actual BASE and TARGET declarations and release notes; the application may already have adopted these contracts. Do not infer compatibility from the template version or require every `@nocobase/*` package to share the same major version.

Resolve the compatible package set from the target template, including `@nocobase/app-server`, `@nocobase/app-client`, `@nocobase/realtime`, the WebSocket adapter and affected plugins. Before installation, inspect `skills/nocobase-realtime/SKILL.md` and its references in the exact target `@nocobase/realtime` tarball, together with its README and `docs/distributed.md`. After installation and `pnpm nocobase skills sync`, use `.agents/skills/nocobase-realtime/SKILL.md` when available. A currently installed Skill can describe BASE; do not treat it as the authority for TARGET or edit synchronized copies. The target declarations govern exact signatures and options.

Apply only the differences the application still needs. A patch that fixes refresh internals without changing a consumed contract needs no source migration. This API migration does not itself require a database change; review any separate plugin migrations through the upgrade Skill's database workflow.

## Inventory application-owned consumers

Search the application's source and custom plugin/worker repositories, including test helpers and transport adapters. This initial search finds service imports, declarations, publication-result assumptions, readiness listeners and polling consumers; follow aliases and wrappers from the hits rather than treating a zero-result search as proof of compatibility:

```bash
rg -n '(@nocobase/(realtime|app-server/realtime)|realtimeServiceToken|realtimeClientToken|useRealtime|refreshRealtimeQueries|createRealtimeRefresh|defineTopic|registerTopic|subscriberCount|subscriptionCount|onTopicSubscriptionChange|onOpen|onReady|refetchInterval|setInterval)' . --glob '*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}' --glob '!node_modules/**' --glob '!dist/**' --glob '!pnpm-lock.yaml'
```

For each consumer, identify the topic and its declaration owner, publisher, audience/resource policy, authoritative snapshot or persisted cursor, and recovery path. Follow publication wrappers through transactions, jobs and failure handlers. Include owned packages outside this directory; report inaccessible external plugin code as an unverified compatibility dependency. Put required adaptations and any unresolved access policy in the upgrade plan before editing.

## Migrate server contracts

| Existing assumption or use                                          | Required adaptation when the target changes this contract                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Any valid topic string can be published or subscribed to            | Declare static topics with `defineTopic`/`registerTopic` and dynamic resource families with `defineTopicFamily` during provider boot, before subscriptions. Keep a single declaration owner and release its handles at shutdown. Validate existing dynamic IDs against the target's topic format.                                                                                                                                                                              |
| A topic name or signed-in socket proves resource access             | Preserve the intended audience. A user topic derives its subscriber from the authenticated principal; a resource family reuses the snapshot endpoint's access policy before subscription and delivery. `audience: 'public'` alone does not require authentication or resource permission. Do not remove restrictions to make a migrated subscription succeed.                                                                                                                  |
| Server operations finish synchronously                              | Await server `publish`, topic `publish`/`publishFor`, `subscribe`, `handleClientMessage`, `disconnectUser` and service `close` where owned; update adapters and mocks accordingly. Await `disconnectSession` if used. Host applications retain `realtimeServiceToken` from `@nocobase/app-server/realtime`; the host owns service setup/shutdown. Standalone services own `setup()` and `close()`. Topic-handle `close()` and browser subscription cleanup remain synchronous. |
| A surrounding synchronous `try/catch` handles announcement failure  | Await publication inside the handler or attach an explicit rejection handler. Publish after the transaction commits. A best-effort announcement failure must not turn an already committed write into a failed HTTP response or cause the business write to repeat. Use the domain's durable outbox/job when retries are required.                                                                                                                                             |
| `publish()` returns `{ topic, subscriberCount }` or proves delivery | Consume `{ eventId, topic }` for tracing. The promise means broker admission, not browser processing. Local subscription counts and `flush()` cannot prove remote delivery; remove local-subscriber guards that suppress cross-process publication. Use persisted revisions/cursors for business ordering and gap recovery.                                                                                                                                                    |
| Payloads are accepted whenever `JSON.stringify` succeeds            | Send finite, acyclic JSON with plain objects and dense arrays. Convert dates to ISO strings and domain objects to explicit data; reject or deliberately map `undefined`, non-finite numbers, functions, accessors, symbols and unsupported objects. Test representative payloads against target validation and size limits even with no subscribers.                                                                                                                           |

For concrete declarations, transaction boundaries and adapter options, follow the target Realtime Skill's server reference. Do not replace the host service with another instance merely because its implementation moved to `@nocobase/realtime/server`.

## Migrate browser recovery and test doubles

`subscribe(topic, listener)` still returns a cleanup function. Keep it where event-only consumption is sufficient; use `watch` or the host hooks when a consumer needs acknowledged readiness or per-topic errors. Read an authoritative snapshot after each topic's `onReady`, including the first subscription and reconnect. Keep `onOpen` for transport/identity work. Reconnect on sign-in, sign-out or session replacement, and clear account-bound caches; a replacement account must not reuse the former account's socket or data.

For query-backed pages, use the target's `refreshRealtimeQueries` with `useRealtimeRefresh` or `createRealtimeRefresh` where appropriate. Return the actual refresh promise so reads started before an event receive a follow-up read and failures remain observable. Preserve a usable snapshot during transient failures, clear protected data after HTTP 401/403, and keep subscription errors separate from snapshot errors. The query helper clears denied query snapshots; direct state readers must clear their own protected data and guard late responses.

When adopting the refresh scheduler, wire the existing Refresh/Try again action to its `retry()`. Retry exhaustion is not reset by another event. Topic readiness and manual retry can start a new attempt; foreground/online recovery applies to transient failures. Preserve failed work when batching later events. Follow the target Realtime Skill's client reference for retry options and cleanup rather than duplicating the scheduler in application code.

Update test doubles to return publication promises and correlate subscription acknowledgements/errors and heartbeat replies with their request IDs. An open fake socket without acknowledgements no longer proves subscription readiness. Test publication admission separately from delivery; `flush()` can wait for local queues in tests, while remote delivery needs an observed recipient.

## Redis implementation extraction

When TARGET removes the built-in Redis broker, install a compatible `@nocobase/app-plugin-realtime-redis` and explicitly add its `/server` definition to the existing Server plugin composition. Extraction alone retained the old configuration paths; when TARGET includes broker nesting, also apply the configuration migration below. Standalone consumers move createRedisRealtimeBroker and RedisRealtimeBrokerOptions imports to `@nocobase/app-plugin-realtime-redis/broker`; the core service and original realtimeServiceToken do not change. The public realtimeServiceOptions helper preserves its first two arguments and accepts an optional application-local registry; without one it supports only Memory. Custom factories register during register, before first service resolution.

For a required commercial package, follow the installed App development Skill's `references/plugins.md` commercial package workflow: automatically check that package's metadata at pkg-v3 with existing credentials and command-local global/scoped registry overrides, then install/register a compatible authorized version without prompting. If access is unavailable, leave a brief conversation notice and continue independent upgrade preparation without waiting for the user. Distinguish authorization denial from credentials/network/version issues. Keep the dependent rollout pending and preserve the working backend and rollback checkpoint; do not remove the OSS implementation before its required replacement is available.

Resolve real published peer lower bounds, not merely workspace manifest versions. Roll out additive OSS API, compatible commercial package and application registration before final OSS removal. An unregistered selected adapter fails rather than silently using Memory. Roll back packages, lockfile, registration and configuration together; do not mix Memory and Redis replicas. Server plugin registration and config-factory aggregation are separate; config check proves neither plugin enablement nor Redis connectivity.

## Broker configuration nesting

When TARGET selects brokers through `realtime.broker`, migrate every configuration source together. Old paths are errors, not compatibility aliases, including an old `adapter: inMemory` in code defaults. A new YAML broker merged with an old code default must fail rather than choose a hidden precedence.

Before:

```yaml
realtime:
  namespace: my-app
  authorizationTimeoutMs: 5000
  sessionCheckIntervalMs: 30000
  limits:
    maxConnections: 10000
  adapter: redis
  redis:
    setupTimeoutMs: 5000
    connection:
      host: redis.internal
      port: 6379
      commandTimeout: 5000
```

After:

```yaml
realtime:
  namespace: my-app
  authorizationTimeoutMs: 5000
  sessionCheckIntervalMs: 30000
  limits:
    maxConnections: 10000
  broker:
    adapter: redis
    setupTimeoutMs: 5000
    connection:
      host: redis.internal
      port: 6379
      commandTimeout: 5000
```

Keep namespace at the service level; it still defaults to app.name, then `default`. No broker.namespace, default broker selector, named brokers or Topic routing is introduced. All service limits and timer defaults are unchanged. Redis channels remain `nocobase:realtime:${namespace}` with the existing event/control formats; neither `broker` nor another configuration path enters the physical identity. Redis Pub/Sub ignores logical DB isolation; preserve channel ACLs and network isolation.

In `server/config/realtime.ts`, replace old `adapter` and `redis` defaults as well as YAML. Prefer an empty validated section for applications that should remain local until explicitly configured:

```ts
import { defineRealtimeConfig } from '@nocobase/app-server/realtime';

export default defineRealtimeConfig();
```

Add the import, `realtime: ReturnType<typeof realtime>` type entry and `realtime` value entry to the existing `defaultAppConfigs` map in `server/config/index.ts`. Default and Examples already supply this section. To intentionally select local-only operation, use `{ broker: { adapter: 'inMemory' } }`; intentionally configured Redis defaults use `{ broker: { adapter: 'redis', connection: { host, port }, setupTimeoutMs } }`, never a separate redis property. Install and register `@nocobase/app-plugin-realtime-redis/server` separately before selecting Redis; OSS templates do not depend on or register it.

An absent broker uses inMemory, but an explicit empty/null/array broker or a missing/empty/non-string adapter fails. The templates do not default broker.adapter, so incomplete user YAML cannot inherit it. Validation sees merged configuration, not each original source: if a custom App deliberately defaults a valid broker.adapter in code, YAML that omits that leaf can inherit it and is indistinguishable from a complete final broker. Remove that default when omission must fail. Connection stays optional, with existing SDK defaults and validation; this migration adds no connection whitelist, retry or lifecycle policy.

Update declared environment mappings and configuration-writing scripts using this path table. Environment variables are not auto-discovered; keep their existing names if needed but change their declared destination. Section-factory mappings use the relative path (for example, `broker.adapter`); an application-level environmentProvider mapping uses the full path. Keep passwords Server-only and mark their mappings secret.

| Old path                      | New path                       |
| ----------------------------- | ------------------------------ |
| realtime.adapter              | realtime.broker.adapter        |
| realtime.redis.connection     | realtime.broker.connection     |
| realtime.redis.setupTimeoutMs | realtime.broker.setupTimeoutMs |

For example, after removing the old keys from YAML and code defaults, change script writes to `pnpm nocobase config set realtime.broker.adapter=redis realtime.broker.connection.host=redis.internal realtime.broker.setupTimeoutMs=5000`. A secret write uses `pnpm nocobase config set --from-env realtime.broker.connection.password=REALTIME_REDIS_PASSWORD`. Do not leave old keys beside new keys; run config check and then a real startup/connectivity test. No new environment names are supplied by the core helper or Redis plugin.

Upgrade the OSS host, Redis plugin, application source defaults, YAML/environment mappings and lockfile as a coordinated cohort. The factory context shape stays `{ namespace, config, logger }`, with the entire service config under config and Redis options under config.broker; custom factories must update reads. The standalone SDK `createRedisRealtimeBroker({ namespace, connection, setupTimeoutMs, onError })` does not change. An old host may silently ignore a new broker selection; an old plugin under a new host may read missing config.redis and connect using SDK defaults. These package combinations are unsupported even if TypeScript compilation or peer ranges accept them. Resolve actual compatible published artifacts before deployment; do not represent an unmerged vendor source mirror as an installable dependency.

Merge the OSS implementation first, then update Pro's committed vendor pointer and synchronized settings/lockfile and rerun its checks before release. Make the matching Pro package available before deploying Redis applications on the new host. A wire-format equivalence test does not alone prove a rolling mixed-binary deployment; validate exact deployed versions before making that claim. Rollback restores matching packages, lockfile, composition and the old configuration, not just a binary. Existing default-local applications need no database or Redis data migration. This change does not modify WebSockets, authorization/session checks, subscriptions, resync, message semantics or Agents response streams.

## Preserve recovery during rollout

Keep recovery polling until all relevant producers announce changes and disconnected clients can reconcile from durable data. External changes, time-based expiry and failed best-effort announcements may still require a suitable reconciliation interval. Replacing every poll is not a prerequisite for this upgrade.

The default memory broker is local to one service. For an existing multi-process deployment, verify the target adapter and application namespace across web processes and workers; a shared namespace alone does not distribute events. If Redis fan-out is used, follow the target package's distributed guide and verify broker recovery. Pub/Sub supplies no replay. During a mixed-version rollout, old browsers may not understand `resync`; retain periodic reconciliation or arrange a client reload, and verify the actual client/server combination instead of assuming wire compatibility.

## Verify the migrated application

Run the upgrade Skill's package checks, then exercise affected application behavior. Select the cases that match the migrated consumers and record skipped or unavailable scenarios explicitly:

- **Declarations and access:** Known topics receive updates for authorized users; undeclared topics, anonymous callers to authenticated topics and unauthorized resource subscriptions are denied. Revoking resource access stops subsequent delivery. Existing grants and private payload boundaries remain intact.
- **Committed writes:** A rolled-back transaction announces no change. A successful write still succeeds when best-effort publication rejects, with the failure handled and recovery available. Valid production payloads pass, invalid or oversized payloads fail without unhandled rejections, including with zero subscribers.
- **Readiness and catch-up:** Change data while a client is disconnected, reconnect, and verify its snapshot after acknowledged readiness without requiring another mutation. Deliver an event while an earlier read is pending and verify that the final UI reflects the newer data.
- **Failure recovery:** A transient snapshot error recovers without a new event. After automatic retries are exhausted, the existing manual action recovers without restarting the business job. HTTP 401/403 stops automatic retries and clears protected snapshots; subscription refusal is reported separately.
- **Identity and cleanup:** Sign out and sign in as another account; neither old events nor cached private data appear. Navigating away releases watches/timers, and late reads cannot overwrite the new page or account.
- **Distributed use, when applicable:** A worker with no local subscribers reaches a browser on another process. Separate application namespaces remain isolated. After broker recovery, current clients reauthorize and catch up; the rollout's old-client fallback also recovers. Record which topology was actually exercised.

Report the contracts changed, custom consumers migrated, applicable checks and remaining compatibility gaps alongside the template version range and rollback plan. Type checking or a healthy WebSocket alone does not establish upgrade success.
