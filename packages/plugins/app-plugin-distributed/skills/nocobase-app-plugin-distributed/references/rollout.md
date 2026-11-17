# Shared infrastructure and rollout

## Before adding a second instance

Use the same compatible application build, database schema and plugin versions across replicas. Keep database connections pointed at the same intended shared database; independent SQLite files or per-container databases are not one application's shared data. Plan migrations as a coordinated operation using the installed deployment guidance.

Keep the application's encryption keys and authentication secrets consistent across replicas and restarts. Preserve existing keys during rollout; do not generate unrelated keys on each node. Align public origin, cookie and trusted-origin settings with the external URL. Preserve authorization boundaries; disabling authentication, CSRF or origin checks is not a scaling fix.

Inspect every file table and its selected drive. Files written to one instance's local disk are not automatically available on another. Use a supported shared storage solution and verify uploads and downloads across instances. Review local temporary files, caches and persistence directories separately rather than mounting one directory and assuming every service supports concurrent access.

Configure the load balancer for the application's actual base path, public host and protocol, cookies and WebSocket upgrades. Keep per-process API rate limiting distinct from a shared ingress limit. Sticky sessions alone do not provide shared queues, locks, storage or cross-instance events.

## Observable acceptance checks

Use isolated test resources and two actual application processes with the same intended shared configuration. Maintain ordinary application authorization in all probes. Use business operations already implemented by the application; do not invent health endpoints or bypass service APIs.

| Required capability         | Evidence to collect                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Database and authentication | A record created through instance A is readable through B by an authorized user; login works across both without changing keys.      |
| File storage                | A file uploaded through A can be downloaded through B with the expected access checks.                                               |
| Caching                     | A value written through A's selected shared provider is observable through B; invalidation behaves as the provider promises.         |
| Concurrency                 | Two processes contend for the same resource through the service; their critical sections obey the configured coordination behavior.  |
| Jobs                        | Replicas share the intended schedule/job state; a real scheduled action follows the Jobs plugin's execution and recovery contract.   |
| Queue                       | Work enqueued through A can be consumed on B; retry and duplicate handling follow the queue contract and business idempotency rules. |
| Realtime                    | A client on B receives an authorized event published on A, then recovers authoritative state after a disconnect.                     |

Test only the capabilities the application requires, and report untested ones explicitly. A YAML check, a package installation or a same-process mock is not cross-instance acceptance evidence. Test Redis loss and recovery in an isolated environment using the owning adapter's supported semantics; do not inject faults into a production service without authorization.

## Rollout and rollback

Record the previous application build, lockfile, plugin registrations, configuration and data backup. Drain or reconcile existing local jobs and queue work before selecting shared backends. Define how to avoid replaying side effects; moving a selector cannot provide exactly-once business execution.

Roll out a compatible cohort and verify shared behavior before increasing traffic. Do not mix Memory and Redis replicas while claiming they coordinate. If a coordinated stop is needed to prevent split processing, include it in the deployment plan rather than promising an unconditional zero-downtime switch.

Rollback the application build, plugin versions, registrations and configuration together. Account for work already written to Redis and database/schema changes before restoring a local backend. Shared coordination does not remove the need for backups, domain-level idempotency and recovery procedures.
