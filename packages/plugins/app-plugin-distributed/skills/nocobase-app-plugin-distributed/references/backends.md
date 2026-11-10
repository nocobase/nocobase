# Backend configuration

These shapes were checked against the NocoBase `v3-develop` source at `dca7088f7e88a75e22147f4c4fa8ddd1853836a4`. Verify the application's installed versions before applying them. Redis implementation options and compatibility belong to each installed commercial package; this public Skill does not bundle those implementations.

| Service     | Application configuration                                    | Redis runtime package                    | Local behavior                                                                        |
| ----------- | ------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Caching     | `caching.default`, `caching.providers.<name>.driver`         | `@nocobase/app-plugin-caching-redis`     | Memory is process-local.                                                              |
| Concurrency | `concurrency.default`, `concurrency.backends.<name>.adapter` | `@nocobase/app-plugin-concurrency-redis` | `mutex` coordinates one process only.                                                 |
| Jobs        | `jobs.default`, `jobs.backends.<name>.adapter`               | `@nocobase/app-plugin-jobs-redis`        | `memory` stores process-local jobs; local persistence is not a distributed scheduler. |
| Queue       | `queue.default`, `queue.backends.<name>.adapter`             | `@nocobase/app-plugin-queue-redis`       | `inMemory` processes work locally; local persistence is not a shared queue.           |
| Realtime    | `realtime.broker.adapter`, `realtime.namespace`              | `@nocobase/app-plugin-realtime-redis`    | An absent broker uses in-memory delivery on one instance.                             |

## Install before selecting

Use compatible versions of the required packages and explicitly register their documented Server contributions in the application's existing `server/plugins.ts`. Do not add Client or CLI registration unless those packages actually export a required contribution. Installing this Skills-only package does not install any of these runtime packages.

Commercial packages are obtained through the application's documented `https://pkg-v3.nocobase.com/` access workflow. Read their installed Skills, README and exported declarations for connection, authentication, TLS, namespace and lifecycle options. Never invent a universal Redis environment variable or copy one service's connection schema into another. Preserve the target application's existing registry configuration and keep credentials out of source and logs.

## Concurrency, Jobs and Queue

Each section accepts `default` and `backends`. A default names a backend entry, not an adapter or business task. Every entry declares its adapter. These services use different local adapter names: `mutex`, `memory` and `inMemory`, respectively. An unselected Redis definition does not activate Redis.

After installing and registering the matching adapter, add a named backend using that plugin's documented options, validate it and select its name as the section's `default`. Preserve other entries and examine consumers selecting explicit names. Concurrency's factory selects memory by default; the Jobs and Queue template factories omit `default`, retaining built-in local behavior. Setting a default does not rewrite explicit business selections.

Older direct entries such as `jobs.redis` must move into `jobs.backends.redis`; do not mix legacy and new formats. Update application-owned TypeScript configuration factories as well as YAML when necessary. Keep physical Redis destinations, namespaces, scopes, task names and queue identities stable when migrating the wrapper. A switch from local storage to Redis is a separate operational change and does not move pending work automatically.

## Caching

Caching uses `providers` and `driver`, not `backends` and `adapter`. Add the Redis provider according to its package contract and select its name in `caching.default`. Review consumers with explicit provider names and namespace requirements. Providers are resolved lazily, so successful startup alone does not prove the selected driver can be used. Exercise the required cache, counter or other supported capability on both instances.

## Realtime

Use `realtime.broker.adapter: redis` with the installed broker's connection options. Keep the service namespace, limits and authorization timers under `realtime`; do not introduce legacy `realtime.adapter` or `realtime.redis` fields. All replicas of one application must share the broker destination and namespace. Redis logical database numbers do not isolate Pub/Sub; use distinct namespaces and appropriate channel ACLs for isolation.

Redis Pub/Sub is not durable replay, global ordering or exactly-once delivery. A successful publish is broker admission, not proof of browser delivery. Clients must recover authoritative state through authorized APIs after reconnect or resynchronization. Test cross-instance publishing and reconnect recovery, not only a socket connected to its own instance. Do not silently fall back to Memory on a broker failure.
