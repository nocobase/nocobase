# @nocobase/repository-input

## 0.1.0-beta.2

### Minor Changes

- 7dbc54b: Repository writes can now be observed. `connection.onRepositoryMutation({ collections, keys?, values?, id? }, { inTransaction?, afterCommit? })` subscribes to the rows Repository writes change and returns a function that unsubscribes. Every write method emits one event per call that wrote at least one row, listing each row it created, updated or deleted — nested relation targets, foreign keys and through rows included — with its key and the fields written; a subscription matches when any of those rows belongs to one of its Collections. Subscriptions belong to the root connection and are shared with its transactions and policy-bound connections.

  `inTransaction(event, connection)` runs inside the call's transaction once its writes are done; throwing fails the call with that error and rolls back an implicit transaction. `afterCommit(events, connection)` runs once per outermost commit with that transaction's matching events and the root connection, and drops them when the transaction or savepoint rolls back; its errors go to the new connection option `onRepositoryEventError(error, { subscriptionId, operationIds })`, or become a process warning whose `code` is `REPOSITORY_EVENT_LISTENER_FAILED` and whose `cause` is the error. Writes made through the connection either listener receives emit events with `parentOperationId`, nested at most `repositoryEventMaxDepth` levels (a new connection option, default 8) before they fail with the new `RepositoryError` code `REPOSITORY_EVENT_RECURSION`. A subscription matches an event by its root Collection or any Collection among its row changes.

  A connection without subscriptions runs every write exactly as before. When a subscription asks for keys (the default), `updateMany` and `deleteMany` lock the matching rows and write them by key, and `createMany` keeps its single statement when every row supplies its key, otherwise uses one multi-row `INSERT … RETURNING` where the dialect runtime declares the new `insertManyReturning` flag (`@nocobase/db-sqlite` does) or inserts row by row. Subscriptions declaring `keys: false`, and Collections whose rows have no primary key or non-null unique key, keep the single statement and receive a `count` event. `connection.explainRepositoryEvents({ collection, operation })` reports the strategy, granularity and whether an implicit transaction is opened.

  The write methods accept a `meta` option built with the new `defineRepositoryEventMeta<T>(namespace)` handle, whose `read(event)` returns the typed value; `values: true` subscriptions also receive the written values. Writes made through `query`, `client()`, migration and seed tasks, and rows changed by database cascades emit nothing, and events are delivered only in the process that wrote.

  `@nocobase/app-server` ignores the two new connection options when deciding whether two connections point at the same database, and answers `REPOSITORY_EVENT_RECURSION` as a server error.

- 21d274c: Every `RepositoryError` now carries a `status`, the canonical error status its code maps to through the new `repositoryErrorStatuses` table exported by `@nocobase/db` (`INVALID_ARGUMENT`, `PERMISSION_DENIED`, `NOT_FOUND`, `ABORTED` or `INTERNAL`). The table is typed over every `RepositoryErrorCode`, so a new code does not compile until it has a status.

  `@nocobase/app-server` reads that status instead of keeping its own list of codes, so a code added to the Repository reaches an `/api` caller with the status chosen for it. Two answers change:

  - `RELATION_TARGET_NOT_FOUND` is `400 INVALID_ARGUMENT` instead of `404`: the missing target is one the request body names, not the resource in the URL.
  - `INVALID_WRITE_POLICY` is an opaque `500 INTERNAL` instead of `400`: write policies are server-owned, so an invalid one is a server misconfiguration.

  Every Repository error a caller sees now carries its `path` and `details` in `metadata`, not only the write-forbidden codes, and an `INVALID_ARGUMENT` one also names its path in `fieldViolations`.

## 0.1.0-beta.1

### Patch Changes

- ceb356b: Support exact BIGINT and DECIMAL string filters, validate plain integer writes before SQL execution, and preserve numeric atomic-update operands without floating-point promotion. Reject SQLite int64 arithmetic overflow before storage and retain native PostgreSQL/MySQL read and aggregate behavior.
- ceb356b: Unify aggregate result types using native PostgreSQL/MySQL behavior. COUNT returns a safe integer number and rejects values above Number.MAX_SAFE_INTEGER. SUM/AVG of integer, BIGINT and DECIMAL fields return database-formatted strings; FLOAT/DOUBLE SUM/AVG return numbers. MIN/MAX preserve field result types. Do not strip trailing zeros. Preserve nulls, numeric filtering, ordering, grouping, aliases and relation aggregates.

  Remove PostgreSQL AVG input casts and accept native computation and rounding. SQL Server promotes integral SUM/AVG inputs to DECIMAL(38,0), retains native DECIMAL precision rules, and preserves exact outputs before driver conversion. SQLite retains exact aggregates for integral/decimal fields while floating fields use native aggregation. Prepare aggregate field information only on adapters that need it, once per execution; PostgreSQL/MySQL do not load collections for numeric adaptation. Broaden shared SUM/AVG TypeScript results to string | number | null.

- c960d07: Add the Repository Policy read model: policy types, scope normalization, scope
  pushdown into the query, and field and relation allowlists enforced across
  every read surface — select, filter, sort, distinct, cursor, aggregate and
  group by, including the returning select of a write and each relation branch,
  which is judged by its own collection's allowlist and narrowed by its own
  scope.

## 0.1.0-beta.0

### Minor Changes

- 90a4903: Add portable Repository AST and mutation input builders shared by browser and server clients. Support synchronous builder callbacks and complete JSON options helpers for all nine remote Repository actions, including nested selections, relation mutations, and numeric updates. Preserve relation create client keys through an explicit JSON envelope and reject unserializable builder inputs before sending requests.

### Patch Changes

- 90a4903: Add server-owned writePolicy for single and bulk creates/updates, root upserts and
  mutation preflight. Internal Repository calls default to true. Explicit policies
  restrict scalar fields, each relation operation, nested create/update/upsert branches
  and through payloads before any writes. Add buildWritePolicy, buildUpsertWritePolicy
  and synchronous callback input, frozen snapshots and structured policy errors.

  Replace defineRepositoryApiRoutes action arrays with configuration objects and move
  maxLimit to actions.findMany. API create/update actions default to writePolicy false
  and require explicit allowlists; true and client-supplied policies are rejected.
  Return HTTP 403 for forbidden writes and migrate the Repository example's routes,
  fixtures and integration guidance to field and relationship policies.

## 0.0.1

### Patch Changes

- Add shared, portable Repository input contracts and JSON builders.
