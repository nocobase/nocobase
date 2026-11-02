# Realtime implementation verification

The implementation is split into query correctness, subscription/read recovery, business notifications, bounded/distributed delivery and integration guidance. This checklist records executable acceptance boundaries; production capacity and deployment topology remain deployment-specific.

| Area                        | Acceptance evidence                                                                                                                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Query snapshots             | App Client tests hold pre-event reads, including first load and prefix matches, verify a subsequent read, preserve inactive invalidation and ignore removed/replaced cache entries.                                                                                |
| Refresh recovery            | Scheduler tests cover serialization, trailing changes, transient retry/exhaustion, permanent refusal, manual retry, hidden documents and cleanup. The Realtime example independently covers initial-load races and a failed HTTP read with no subsequent event.    |
| Subscription recovery       | Core client tests cover acknowledgement correlation, transient retries, permanent errors, heartbeat/foreground recovery, stale replies and resynchronization after a broker recovery signal.                                                                       |
| Business state coverage     | Mail tests cover empty synchronization completion, failure, retry and cancellation. Knowledge tests cover space rechunking and external indexer callbacks. Office Flows tests cover event-during-read and no frequent quiet-page polling.                          |
| Authorization and isolation | Core/server/authentication/authorization tests cover resource revocation, session validity, cancellation, personal audiences, topic declaration and payload/buffer limits.                                                                                         |
| Bounded delivery            | Core tests hold one topic while another proceeds, preserve same-topic order, bound a 100-event backlog, retain capacity for cancellation-ignoring callbacks and coalesce only opt-in latest snapshots.                                                             |
| Redis                       | Implementation-specific Redis tests are owned by @nocobase/app-plugin-realtime-redis. Core fake-broker tests retain recovery/control contracts; same-process, real multi-process, authenticated browser and external artifact checks are distinct evidence levels. |
| Business examples           | Real client/service fixtures exercise tasks, inbox and exports; snapshot retry, write denial, accepted writes followed by failed refresh, CSV ownership, persistence, quoting, row cap and retention remain covered.                                               |
| Integration guidance        | Skill frontmatter validation, reference resolution, tarball contents and identical synchronization into both templates are checked.                                                                                                                                |
| Packaging                   | Scoped lint, type checks, tests and builds cover modified implementation packages and affected consumers. Both template configurations and type checks are checked; production builds verify their deployable server dependencies.                                 |

## Local verification commands

```bash
pnpm --filter @nocobase/realtime check
REALTIME_TEST_REDIS_PORT=6379 pnpm --filter @nocobase/realtime test
pnpm --filter @nocobase/app-server test
pnpm --filter @nocobase/app-client test
pnpm --filter @nocobase/app-plugin-realtime-example check
pnpm --filter @nocobase/app-plugin-mail test
pnpm --filter @nocobase/app-plugin-knowledge test
pnpm --filter @nocobase/app-plugin-office-flows-example test
```

Run database integration suites separately through their owning dialect package. Redis cases are skipped unless `REALTIME_TEST_REDIS_PORT` identifies an isolated test instance: they deliberately disconnect Pub/Sub clients. Do not point them at a shared production Redis service.

## Limits of the evidence

Functional burst and fairness tests do not establish a production throughput or latency target. Redis Cluster/Sentinel failover, cross-region behavior and rolling-version recovery require deployment-specific validation. Pub/Sub has no durable replay or exactly-once delivery. The CSV example uses the application's local jobs backend, so cross-process export coordination is not claimed. Time-based and external-system polling retained in [the inventory](polling.md) remains part of recovery.
