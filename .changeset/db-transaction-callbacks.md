---
'@nocobase/db': minor
'@nocobase/app-server': patch
---

`DatabaseConnection` gains `afterCommit(callback)` and `afterRollback(callback)`. A commit callback runs after the outermost transaction commits, in registration order, once the transaction's Collection metadata changes are applied, and `transaction()` resolves only after every commit callback has finished. Registered inside a nested `transaction()`, it waits for the outer commit and is dropped if that savepoint rolls back; outside a transaction it starts at once. Rollback callbacks receive the error after the transaction or savepoint rolls back, including when the commit itself fails. A callback that throws does not change the transaction's outcome: the error goes to the new connection option `onTransactionCallbackError(error, phase)`, or becomes a process warning whose `code` is `TRANSACTION_CALLBACK_FAILED` and whose `cause` is the error. The `COLLECTION_METADATA_INVALIDATION_FAILED` warning now carries its code the same way. Registering either on a transaction connection after its transaction has finished throws. Policy-bound connections forward both methods.

Collection metadata changed inside a nested `transaction()` now reaches the connection's Registry when the outer transaction commits; before, only the outer transaction's own changes did, so the root connection could keep serving the old schema. If `onTransactionCallbackError` itself throws, that error becomes a warning too and the transaction's outcome is still unchanged.

`@nocobase/app-server` ignores `onTransactionCallbackError` when deciding whether two connections point at the same database.
