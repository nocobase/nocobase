# 8. Transactions

[Contents](./README.md) · [Previous: Permissions](./permissions.md) · [Next: Events](./events.md)

This chapter owns transaction propagation, savepoint and completion-callback semantics. Manager, connection and permissions chapters list the entry points and link here.

## Entry points and handle propagation

| Entry                                     | Callback handle                               | Signature owner                                                               |
| ----------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| `db.transaction(fn, name?)`               | `DatabaseConnection` for the named connection | [DatabaseManager](./signatures/database-manager.md#databasemanager)           |
| `connection.transaction(fn)`              | Transaction-bound `DatabaseConnection`        | [Connection](./signatures/connection.md#databaseconnection)                   |
| `restricted.transaction(fn)`              | `RestrictedDatabase` with the same policies   | [RestrictedDatabase](./signatures/policies.md#restricteddatabase)             |
| Policy-bound connection `transaction(fn)` | Policy-bound transaction connection           | [ScopedDatabaseConnection](./signatures/policies.md#scopeddatabaseconnection) |

Use `db.transaction()` or `connection.transaction()` for a database transaction. The callback receives a transaction connection; take repositories, queries and builders from it. Restricted database transactions pass another `RestrictedDatabase` with the same policies. Nested transactions use savepoints as supported by the connection.

```ts
import type { DatabaseManager } from '@nocobase/db';

declare const db: DatabaseManager;

await db.transaction(async (transaction) => {
  const projects = transaction.repository('projects');
  await projects.updateOne({
    filter: { id: 'p1' },
    values: { name: 'Updated' },
  });
});
```

Handles obtained from the root connection do not acquire the callback's transaction binding. Consume lazy Repository queries before the transaction finishes.

Known issue: transaction callbacks currently receive the full connection interface, including lifecycle methods. Calling `reconnect()` can replace the transaction client with an independent connection, allowing subsequent writes to survive the outer rollback. Do not reconnect or close a transaction-bound connection; let the transaction owner complete it. [Review finding F1](./release-review.md#f1-transaction-lifecycle-methods-can-detach-writes-from-the-transaction) records the reproduction and required runtime/type guards.

## Nested transactions and savepoints

A transaction invoked on a transaction connection uses a savepoint as supported by the dialect. Releasing a savepoint does not commit the outer transaction. Restricted database transactions preserve their policy map while deriving the transaction-bound repositories.

## Completion callbacks and failures

`afterCommit()` waits for the outermost commit. A savepoint rollback drops its commit callbacks; released savepoints' callbacks remain attached to the enclosing transaction. `afterRollback()` receives the rollback error. Outside a transaction, commit callbacks start immediately and rollback callbacks are ignored. Callback failure reporting does not retroactively change a committed transaction.

`transaction()` waits for registered commit callbacks to finish. The transaction connection is already finished when `afterCommit()` runs; follow-up database work uses the root connection or a new transaction. A callback error goes to configured `onTransactionCallbackError`, or becomes a `TRANSACTION_CALLBACK_FAILED` process warning. The shared [TransactionCallbackPhase](./signatures/transactions.md#transactioncallbackphase) identifies the phase.

Rollback callbacks receive the failure of the transaction or savepoint, including commit failure. Released savepoints retain rollback callbacks for an enclosing rollback. Outside a transaction, `afterCommit()` starts immediately without being awaited by registration, and `afterRollback()` is ignored.

## Transactions in migrations and seeds

`MigrationTransactionMode` and `SeedTransactionMode` configure runner-managed transactions. Use handles supplied by the task context. Their options and contexts are documented in [Migration and Seed](./migration-and-seed.md).

`CollectionBuilder.transaction(fn)` currently invokes `fn` with the same builder and does not start a database transaction. `BuilderExecOptions.transaction` is reserved. Use a real transaction connection's builder for transaction participation, subject to the dialect's DDL behavior.

## Relation to mutation events

Transaction callbacks are lifecycle callbacks. Repository listeners observe mutation events and choose `inTransaction` or `afterCommit` delivery; those contracts are documented in [Events](./events.md).

[Contents](./README.md) · [Previous: Permissions](./permissions.md) · [Next: Events](./events.md)
