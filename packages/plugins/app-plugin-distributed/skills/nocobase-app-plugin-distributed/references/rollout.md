# Shared infrastructure and rollout

Use this reference for deployment preparation or an authorized release, not as a mandatory sequence for every development task. For an existing App's first multi-instance cutover, complete the full applicable assessment; for later releases, review changed areas and shared effects against a valid baseline. A readiness review produces findings and a plan only. Task scope, architecture approval and authorization for production operations remain separate.

Identify the target environment before applying these checks. Local development configuration is not production evidence, and deployment manifests describe intent until their application is verified. Unknown destinations, credentials or release details leave the dependent configuration or cutover pending; they need not block independent code preparation. Use [task scope and environment evidence](task-context.md) to resolve only the operational facts needed now.

## Before adding a second instance

Use the same compatible application build, database schema and plugin versions across replicas. Keep database connections pointed at the same intended shared database; independent SQLite files or per-container databases are not one application's shared data. A database-engine change or data migration requires explicit scope and a release plan, not just a backend selector change.

Keep encryption keys and authentication secrets consistent across replicas and restarts. Preserve existing keys rather than generating unrelated keys on each node. Align public origin, base path, cookie and trusted-origin settings with the external URL. Review independent `@nocobase/session` storage if used; Caching Redis does not automatically configure it. Preserve authorization boundaries; disabling authentication, CSRF or origin checks is not a scaling fix.

Inspect every file table and its selected drive. Use supported shared storage for business files and attachments needed by other instances or background tasks, and verify cross-instance access. Changing the default disk neither moves historical files nor changes explicit selections. Review local temporary files, caches and persistence directories separately; keep instance-local working directories distinct from shared business-file storage rather than assuming every service can share one directory.

Configure the load balancer for the application's actual base path, public host and protocol, cookies and WebSocket upgrades. Keep per-process API rate limiting distinct from shared quotas or ingress limits. Sticky sessions do not provide shared queues, locks, storage or cross-instance events. PM2 cluster mode and Compose replica counts manage processes, not business-state coordination; replicas on one host do not protect against host failure.

For Jobs and Queue Redis, verify persistence and `maxmemory-policy noeviction`, capacity, access controls and connection budgets, not only a reachable port. Review database, Redis and file-storage availability separately from application replica count. Use consistent namespaces/prefixes within an App/environment and separate other environments; namespaces do not replace network isolation or service permissions.

## Preserve pending work

Inventory existing persistent data, active/pending Jobs and Queue work, files and temporary attachments before planning the switch. Memory state files are not a shared queue even when mounted in the same directory. Switching to Redis does not import them. Stop new submissions and drain existing work, or obtain approval for a business-specific migration/recovery plan. Do not delete pending tasks, clear queues or flush Redis to make startup succeed.

For existing shared backends, preserve endpoint/database, namespace/prefix, scope, task/queue names and protocol compatibility. Renaming a configuration entry is not permission to rename its physical data. Keep replicas on compatible handlers and payload formats so an older release does not claim work it cannot understand. Do not mix Memory and Redis replicas while claiming they coordinate.

Define how to avoid replaying business side effects; moving a selector cannot provide exactly-once execution. If the existing correctness model needs to change, follow [adaptation boundaries](adaptation-boundaries.md) before implementing that change. Preparing code or configuration does not authorize production writes, downtime, migrations or traffic switching.

## Observable acceptance checks

Follow [cross-instance verification](verification.md) for isolated two-process checks of login/permissions, cache/counters, Jobs, Queue, Realtime, Concurrency, Snowflake and files, plus shutdown/restart and failure recovery. Use implemented business operations and original service APIs; do not bypass authorization or invent diagnostic endpoints.

Test only required capabilities, mark unused ones with evidence and report untested ones explicitly. A YAML check, package installation, healthy process or same-process mock is not cross-instance acceptance evidence. Redis fault injection and abnormal process stops require isolated test resources and authorization, not arbitrary production disruption.

## Rollout and rollback

Follow the target App's installed deployment Skill for build artifacts, target-platform configuration, release and rollback. Record the previous build, lockfile, registrations, effective configuration, database/file backups and restore path. Apply shared migrations and required seeds once in the release procedure before replicas start; disable per-instance automatic execution for the affected connections. Stop the rollout if updates fail.

Roll out a compatible cohort and verify shared business behavior before increasing traffic. Include rolling-update overlap in worker allocation and resource budgets. If a coordinated stop is needed to prevent split processing, include it in the deployment plan rather than promising unconditional zero downtime. Keep dependent rollout pending when commercial package access, shared services, data preservation or acceptance remains unresolved.

Rollback code, packages, registrations and configuration together. Uninstalling a selected backend or returning to Memory while replicas still run is not a valid rollback. Account for work already written to Redis, historical files, database/schema changes and external effects; a code rollback does not undo them. Shared coordination does not remove the need for backups, domain-level idempotency or recovery procedures.
