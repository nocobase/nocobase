# Backend configuration

Verify the application's installed versions before applying these configuration paths. Each commercial package owns its precise options, compatibility and operational commands; this public Skill does not bundle implementations. Read the corresponding `nocobase-app-plugin-<suffix>` Skill after installation/synchronization, or its installed README and public declarations. Do not copy private implementation code or assume local source compatibility proves a compatible release is available.

| Service     | Application configuration                                          | Commercial runtime package               | Local behavior                                                                               |
| ----------- | ------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| Caching     | `caching.default`, `caching.providers.<name>.driver`               | `@nocobase/app-plugin-caching-redis`     | Memory is process-local.                                                                     |
| Concurrency | `concurrency.default`, `concurrency.backends.<name>.adapter`       | `@nocobase/app-plugin-concurrency-redis` | `mutex` coordinates one process only.                                                        |
| Jobs        | `jobs.default`, `jobs.backends.<name>.adapter`                     | `@nocobase/app-plugin-jobs-redis`        | `memory` stores process-local jobs; local persistence is not a distributed scheduler.        |
| Queue       | `queue.default`, `queue.backends.<name>.adapter`                   | `@nocobase/app-plugin-queue-redis`       | `inMemory` processes work locally; local persistence is not a shared queue.                  |
| Realtime    | `realtime.broker.adapter`, `realtime.namespace`                    | `@nocobase/app-plugin-realtime-redis`    | An absent broker uses in-memory delivery on one instance.                                    |
| Snowflake   | `snowflake.mode`, `snowflake.workerIds`, `snowflake.releasePolicy` | `@nocobase/app-plugin-snowflake-worker`  | Manual worker allocation requires unique IDs and safe reuse across all generating processes. |

## Install before selecting

Follow the target App's existing commercial-package access workflow, as directed by this Skill's entry, for each required package. Keep registry overrides command-local and credentials out of source and logs. Installing this Skills-only package does not install any runtime backend. Keep unused services and existing verified alternatives unchanged rather than installing all six.

Keep original host providers and service Tokens; the commercial plugins extend existing services, not parallel business-owned services. Register supported Server exports explicitly in `server/plugins.ts`. Keep the OSS Concurrency plugin before Concurrency Redis. Backend registration must precede acquisition, and resources must be initialized before use; Caching Redis must precede authentication and other consumers accessing the cache during startup. The five Redis plugins need Server registration; Snowflake worker also needs its CLI export registered in `cli/plugins.ts`.

Merge target configuration into existing App-owned factories and runtime settings without replacing database, keys or business sections. Never invent a universal Redis environment variable or copy one service's connection schema into another. Environment variables require explicit mappings; `${...}` strings in YAML are not automatically substituted. Supported TLS, Cluster/Sentinel, timeouts, reconnect behavior and connection ownership differ by plugin; check the installed contract rather than inferring support from ioredis or BullMQ.

## Concurrency, Jobs and Queue

Each section accepts `default` and `backends`. A default names a backend entry, not an adapter or business task. Every entry declares its adapter. The local adapter names are `mutex`, `memory` and `inMemory`, respectively. An unselected Redis definition does not activate a consumer on Redis. Add a named backend with the plugin's documented options, validate it and select its name; retain original service APIs.

Review consumers with explicit names, including `scheduler.jobs`, `notification.jobs`, `mail.jobs`, `knowledge.jobs` and backend arguments in business calls. Setting a default does not rewrite explicit selections. Keep Scheduler when selecting Jobs Redis; it does not require a separate Redis Scheduler. Retain `attempts: 1` for Scheduler's Jobs backend and follow its installed guidance. Queue remains independent of Jobs; Queue Redis consumers compete rather than broadcasting every message to every replica.

Older direct entries such as `jobs.redis` must move into `jobs.backends.redis`; do not mix legacy and new formats. Update application-owned TypeScript factories as well as YAML. Consult the installed plugin development Skill's `references/backends-configuration.md` when present. Preserve physical Redis destinations, namespaces, scopes, task names and queue identities when migrating the wrapper. Switching local storage to Redis does not move pending work automatically.

Jobs and Queue concurrency is per worker/instance, not a global ceiling; reassess aggregate database/mail-service load when adding replicas. Queue rate limits are shared for the same shared queue, whereas consumption pause/cancel controls are not automatically global. Do not automatically retry an uncertain enqueue or claim exactly-once effects: accepted work may be replayed during crash recovery.

Concurrency Redis coordinates the same namespace/database/resource name even across differently named configuration entries. TTL is a renewable lease, not a maximum business execution time. Lock expiry does not forcibly stop a runner or fence stale writes. Retain database constraints, transactions and duplicate-effect protection; if these need a new architecture, follow [adaptation boundaries](adaptation-boundaries.md) before implementing it.

## Caching

Caching uses `providers` and `driver`, not `backends` and `adapter`. Add an appropriate Redis provider and select it through `caching.default` or explicit consumers; do not change a Memory entry's driver while retaining memory-only options. Preserve intentionally process-local optimization where its consistency is acceptable. Match endpoint/database/keyPrefix across cooperating instances and separate environments; prefixes are not access controls.

Core driver resolution is lazy, but the installed Caching Redis plugin initializes all configured Redis providers at boot, including unused ones. An invalid or unreachable staging definition can therefore fail startup even when Memory is default. Startup readiness does not prove every required Redis command is authorized or that future commands will succeed. Exercise Cache, Counter and BloomFilter capabilities actually used by the business.

Redis caching accepts strict JSON rather than arbitrary Date, Buffer or class values. Preserve the caller's contract through tested representation conversion where needed. Check TTL, counter creation/expiry and invalidation semantics; do not treat caches as permanent storage or probabilistic Bloom membership as exact. Local loader coalescing is not a distributed lock. Do not blindly retry an uncertain counter increment or assume automatic reconnect/command replay; use the installed lifecycle contract.

## Realtime

Use `realtime.broker.adapter: redis` with the installed broker's connection options. Keep the namespace, limits and authorization timers under `realtime`; do not introduce legacy `realtime.adapter` or `realtime.redis` fields. Register the host's `defineRealtimeConfig()` factory in the App's configuration if absent. All replicas use the same broker destination and namespace. Redis logical database numbers do not isolate Pub/Sub; use distinct namespaces and appropriate channel ACLs for isolation.

Keep existing business topics and client APIs. Redis Pub/Sub is not durable replay, global ordering or exactly-once delivery. A successful publish is broker admission, not proof of browser delivery. Clients must recover authoritative state through authorized APIs after reconnect or resynchronization. Test cross-instance publishing, user/session controls and reconnect recovery, not only a socket connected to its own instance. Do not automatically resend an ambiguous publish or silently fall back to Memory on broker failure.

## Snowflake worker allocation

Manual OSS Snowflake allocation can remain when worker uniqueness and safe reuse are demonstrably managed. For automatic allocation, register the commercial Server and CLI contributions, replace rather than layer the original Snowflake factory with `defineSnowflakeWorkerConfig()` from the package's `/config`, retain the host ID provider and explicitly select `snowflake.mode: auto`. Registration alone leaves manual behavior unchanged.

Automatic coordination uses the shared default database, not Redis; IDs are still generated locally. SQLite auto falls back to manual and must not be reported as automatic allocation. The current pool has 32 worker IDs, covering all ID-producing processes, rolling-update overlap and management processes that generate records. Keep clocks synchronized, and review manual/automatic pool separation before switching.

Follow the installed worker Skill for inspection, allocation and safe release. The default manual release policy does not recycle allocations left by abnormal exits automatically. A suspect allocation or expired heartbeat does not prove its old process permanently stopped. Do not automatically release workers or enable timeout recycling to make an exhausted pool pass; disconnected generators and clock skew can still cause collisions. Reuse rules and cooldown are not fencing guarantees.
