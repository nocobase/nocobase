# Durable approval task dependency synchronization

The approval plugin provides `approvalTaskDependencyCoordinatorToken`, resolved once from the application's container. Register each approval definition and its dependency adapter during host provider boot, before providers enter `ready()`. The plugin provider initializes persistence, starts a bounded polling worker, and stops it on shutdown. Apply migration `202610200001_approval_task_dependencies` before enabling this integration. No existing index table is changed.

## Register authoritative adapters

```ts
import {
  approvalTaskDependencyCoordinatorToken,
  approvalTaskContributorToken,
  type ApprovalDependencyAdapter,
} from '@nocobase/app-plugin-approval/server';

const coordinator = app.container.resolve(
  approvalTaskDependencyCoordinatorToken,
);
const contributor = app.container.resolve(approvalTaskContributorToken);
coordinator.configure({ clock: authoritativeClock, batchSize: 100 });

// The host owns its versioned dependency tables, directory and title mapping.
const adapter: ApprovalDependencyAdapter = {
  async read(tx, at) {
    const snapshot = await dependencies.readFromTransaction(tx.handle);
    return {
      version: snapshot.version,
      directory: snapshot.directory,
      configuration: {
        contributor,
        describe: () => ({ subject: 'leave', title: 'Leave request' }),
      },
      nextBoundary: snapshot.nextFutureBoundary(at),
    };
  },
  async scan(tx, after, limit) {
    // Enumerate active AND future dependencies using stable keyset pagination.
    // Return normalized changes with immediate scopes and BOTH time boundaries.
    return dependencies.scanChanges(tx.handle, after, limit);
  },
};
coordinator.register(leaveApproval, runtime, adapter);
```

`dependencies` above is a host-owned adapter, not a plugin service. `read()` must load current local authoritative data, a nonempty version of at most 128 characters, and a transaction-bound directory from the supplied transaction. The directory may query individual people, roles and delegations asynchronously on demand; constructing it does not require loading the organization. The coordinator memoizes point lookups for each prepared snapshot, including concurrent requests, and replaces the cache when that snapshot is invalidated. It runs after the source lock. A directory captured earlier, an unversioned remote cache, or a separately opened database connection violates the contract. External systems must reliably ingest their version stream into local tables using the same change boundary. External ingestion remains eventually consistent.

`nextBoundary`, when present, is the earliest relevant future boundary as an absolute timestamp. Configure a shared authoritative clock with `configure({ clock })` during host boot; the default uses system time, which requires synchronized application hosts. The coordinator samples its clock after acquiring the source fence; projection eligibility uses that clock, separately from the lifecycle's business event clock. A batch or online projection crossing that boundary persists a source-wide compensation request in the same transaction. Every dependency mutation and initialization scan must also persist its normal future timers; compensation does not replace timers.

Registrations reject duplicate source names or definition objects and require `userTasks` on the approval definition. Snapshot configurations must use the shared contributor. Transactions from another database owner, completed handles, and source names missing their coordination record are rejected.

## Capture dependency writes

```ts
await runtime.transaction(async (tx) => {
  await coordinator.change(
    tx,
    {
      id: changeId,
      type: 'delegation',
      key: delegationId,
      version: newVersion,
      occurredAt: changedAt.toISOString(),
      scopes: [
        { source: leaveApproval.name, assigneeIds: oldAndNewPrincipals },
      ],
      boundaries: [
        {
          source: leaveApproval.name,
          kind: 'starts',
          at: startsAt,
          assigneeIds: newPrincipals,
        },
        {
          source: leaveApproval.name,
          kind: 'ends',
          at: endsAt,
          assigneeIds: newPrincipals,
        },
      ],
    },
    async () => {
      await dependencies.write(tx.handle, newValue);
    },
  );
});
```

The event and callback are trusted host inputs. Acquire all relevant sources before reading dependencies to calculate old/new ranges, using `await coordinator.acquire(sourceNames, tx)`; acquisition uses sorted source names. The callback writes through this transaction, and any failure must abort the enclosing transaction. Projection contexts remain bound to their own transaction handles, while cache invalidation spans the root transaction and all savepoints. Dependency writes invalidate those contexts before and after the callback; savepoint rollback invalidates them again, including when an already released child is rolled back through an ancestor. Initial assignment, action authorization, approval involvement queries and index projection use the same prepared directory. `involvementOf()` acquires the relevant source fences before reading facts and uses the projection clock for current delegation eligibility, even when the lifecycle clock is older. It does not use personal index entries as evidence of participation or repair the index; historical actual actors retain their involvement after delegation expires. Do not catch a synchronization/change failure and commit a partially performed business operation. Multi-source transactions must use one database and acquire their entire source set before their first fact read. Keep the same ordering with any other host coordination locks.

Scopes identify original task assignees, including the union of old and new principals when a delegation changes owner or applicability. For user deactivation and organization membership changes, perform the host's reverse dependency lookup. If it cannot identify all affected principals, omit `assigneeIds` to scan the entire affected source. `assigneeIds: []` explicitly affects no tasks. Business display changes use the same event contract. Source scans intentionally include historical tasks to preserve history and repair semantics.

Events contain stable identities, bounded dependency references and versions, and absolute times. They never contain final recipients or business bodies. Job identities include the event, dependency version, source, principal, boundary and execution instant. Repeated deliveries do not reset cursors or completed jobs. New events receive separate scopes and restart from the beginning, so new changes cannot disappear behind an old running cursor. Old timers are retained and recompute current eligibility; they never replay expired recipients.

For a small synchronous change, call the contributor's `synchronize` or `synchronizeBatch` after `change()` in the same transaction. Registered sources automatically discard the caller's projection clock and directory in favor of the locked adapter snapshot. Dependency capture and future timers are still required.

## Persistence and concurrency

`approvalTaskDependencySources` holds a revision fence, initialization phase, stable scan cursor, start/end capture watermarks, readiness watermark and initialization diagnostics. `approvalTaskDependencyJobs` is both the transactional outbox and durable timer/job store, with bounded task cursor, processed count, attempts, next attempt, failure classification and claim generation. Completed jobs are retained as deduplication records; pruning them requires a host retention policy covering its replay window.

A conditional revision increment acquires an exclusive source row lock held until the outer transaction ends. Online approval fact reads/writes, direct contributor repairs, initialization and worker batches all participate. A stale repeatable-read snapshot fails the fence comparison and must retry in a new outer transaction. A worker retains the database lock throughout the batch: this is a transaction-owned execution lease, rather than an expiring application lease. A crashed connection rolls back both index and cursor. The job generation is checked with the cursor update before commit; another worker cannot independently advance it.

Each batch uses a fresh runtime transaction and existing contributor logic. Index changes, crossed-boundary compensation and job progress commit together. Version conflicts, deadlocks and other failures leave the last committed task cursor intact. Failed jobs record bounded error classifications rather than potentially sensitive messages, exponential retry dates and attempts; exhausted jobs require `retry()`. Polling resumes pending and overdue jobs after process restart. The configured host can supply an `onError` callback when constructing the coordinator directly; this callback must not affect transaction outcomes.

Personal lists and counts read Task Center. Approval action and record read paths acquire dependency fences before using the authoritative directory; they do not maintain statistics or repair the index on GET.

Personal lists and counts read Task Center. Approval action and record read paths acquire dependency fences before using the authoritative directory; they do not maintain statistics or repair the index on GET.

The source lock serializes same-source online operations with batches. Keep `batchSize` small (default 100, maximum 1000). The default polling interval and initial retry delay are one second, with ten failed attempts per batch. A long-running host transaction keeps its lock until commit, including after a nested contributor savepoint returns. Monitor online lock waits as well as job lag.

## Initialization and recovery

Reliable incremental capture must be installed before scanning existing data. All same-database dependency writers must already use `change()`. Otherwise pause them in a maintenance window while scanning and switching capture on. A remote adapter needs its own reliable snapshot/change-stream handoff; a callback or auto-increment ID maximum is insufficient.

Initialization persists phase `scan`, then enumerates dependencies in bounded stable-key batches. Each batch commits replacement timers and its cursor atomically. Source revision increments serialize with dependency writes and therefore provide commit-ordered capture positions with no uncommitted ID holes. Every captured change is already expanded transactionally into its jobs; there is no separate unacknowledged message window. Scanning does not replace or delete newer jobs.

After the last dependency page, the coordinator records `catchupThrough`, enters `catchup`, and creates a complete current-state source backfill, including tasks left behind by expired or deleted delegations. Captured changes behind the scan cursor remain separate jobs. Readiness requires that all currently due jobs, including failed jobs and the complete backfill, have completed; future jobs stay durable. The ready watermark is recorded under the same source fence. Events after that check retain normal eventual-consistency latency. Provider startup alone does not mean a source is ready.

`initializeBatch(source)` and `runBatch(source)` expose deterministic bounded steps for custom workers and tests. `tick()` performs one of each per source. A failed initialization retains its cursor and diagnostics; after the configured attempt limit its phase becomes `failed`. Use `reinitialize(source)` to restart scanning after correcting the adapter or repairing missing scheduling data. Full backfill runs again, and previously committed jobs remain intact.

## Operations and verification

Use `status(source)` for phase, initialization cursor/failures, capture/readiness watermarks, pending/failed/overdue counts and the oldest pending due time. Use `jobs(source, afterId?)` for a bounded keyset page of durable job references and progress, `retry(source, jobId)` to replay an exhausted job from its committed cursor, and `reinitialize(source)` to rebuild scheduling and current-state coverage. These are trusted server APIs, not public HTTP endpoints; the host must authorize any administrative UI or route exposing them. Personal task lists/counts remain index-only and do not trigger synchronization.

The database tests exercise persisted delegation adapters, replacement and late timers, future-delegation initialization, scan resume, dependency/outbox rollback, failed-batch rollback and manual retry, stale supplied contexts, completed history, boundary compensation, changes behind initialization cursors, source-wide reverse-dependency fallback, duplicate delivery and actual polling-worker shutdown/restart. A barrier-controlled stale transaction test runs on server databases, including the MySQL repeatable-read fixture when `APPROVAL_TEST_REPEATABLE_READ=1`. Run that fixture against a provisioned server database; SQLite results do not establish server isolation semantics. The host must additionally validate its real user/organization adapters, authenticated personal-task reads and approval actions in its application's composition.

For local services with an empty password, run the server suites sequentially (each provisions isolated test databases or schemas):

```bash
NOCOBASE_TEST_DB_DIALECT=mysql MYSQL_HOST=127.0.0.1 MYSQL_PORT=3306 \
  MYSQL_ADMIN_USER=root MYSQL_ADMIN_PASSWORD='' APPROVAL_TEST_REPEATABLE_READ=1 \
  pnpm --filter @nocobase/app-plugin-approval exec vitest run \
  tests/database.test.ts tests/server/task-dependency-migration.test.ts

NOCOBASE_TEST_DB_DIALECT=postgres POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=5432 \
  POSTGRES_USER="$(id -un)" POSTGRES_PASSWORD='' POSTGRES_DATABASE=postgres \
  APPROVAL_TEST_REPEATABLE_READ=0 \
  pnpm --filter @nocobase/app-plugin-approval exec vitest run \
  tests/database.test.ts tests/server/task-dependency-migration.test.ts
```

The user-task service retries deadlocks and serialization failures only when it owns the outer database transaction. When supplied a transaction by an approval or host operation, it propagates the failure so that the host can retry its complete unit of work in a new transaction. Preserve action request IDs across such retries to retain replay protection.

Initial local verification on 2026-10-20 passed all 64 non-benchmark cases in these three files against MySQL 8.2 with repeatable-read sessions and PostgreSQL 15.10; the two opt-in benchmarks were skipped. The PostgreSQL concurrent first-delivery and snapshot-rebuild cases also passed after adding service-owned transaction retries. Server tests use explicit barriers for the stale-snapshot interleaving rather than timing assumptions.
