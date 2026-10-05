---
'@nocobase/db': minor
'@nocobase/db-sqlite': minor
'@nocobase/repository-input': minor
'@nocobase/app-server': patch
---

Repository writes can now be observed. `connection.onRepositoryMutation({ collections, keys?, values?, id? }, { inTransaction?, afterCommit? })` subscribes to the rows Repository writes change and returns a function that unsubscribes. Every write method emits one event per call that wrote at least one row, listing each row it created, updated or deleted — nested relation targets, foreign keys and through rows included — with its key and the fields written; a subscription matches when any of those rows belongs to one of its Collections. Subscriptions belong to the root connection and are shared with its transactions and policy-bound connections.

`inTransaction(event, connection)` runs inside the call's transaction once its writes are done; throwing fails the call with that error and rolls back an implicit transaction. `afterCommit(events, connection)` runs once per outermost commit with that transaction's matching events and the root connection, and drops them when the transaction or savepoint rolls back; its errors go to the new connection option `onRepositoryEventError(error, { subscriptionId, operationIds })`, or become a process warning whose `code` is `REPOSITORY_EVENT_LISTENER_FAILED` and whose `cause` is the error. Writes made through the connection either listener receives emit events with `parentOperationId`, nested at most `repositoryEventMaxDepth` levels (a new connection option, default 8) before they fail with the new `RepositoryError` code `REPOSITORY_EVENT_RECURSION`. A subscription matches an event by its root Collection or any Collection among its row changes.

A connection without subscriptions runs every write exactly as before. When a subscription asks for keys (the default), `updateMany` and `deleteMany` lock the matching rows and write them by key, and `createMany` keeps its single statement when every row supplies its key, otherwise uses one multi-row `INSERT … RETURNING` where the dialect runtime declares the new `insertManyReturning` flag (`@nocobase/db-sqlite` does) or inserts row by row. Subscriptions declaring `keys: false`, and Collections whose rows have no primary key or non-null unique key, keep the single statement and receive a `count` event. `connection.explainRepositoryEvents({ collection, operation })` reports the strategy, granularity and whether an implicit transaction is opened.

The write methods accept a `meta` option built with the new `defineRepositoryEventMeta<T>(namespace)` handle, whose `read(event)` returns the typed value; `values: true` subscriptions also receive the written values. Writes made through `query`, `client()`, migration and seed tasks, and rows changed by database cascades emit nothing, and events are delivered only in the process that wrote.

`@nocobase/app-server` ignores the two new connection options when deciding whether two connections point at the same database, and answers `REPOSITORY_EVENT_RECURSION` as a server error.
