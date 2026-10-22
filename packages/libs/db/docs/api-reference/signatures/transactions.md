# Transactions: signatures

Transaction methods are declared on DatabaseManager, DatabaseConnection and RestrictedDatabase. This page contains the shared callback phase contract; the chapter explains propagation, savepoints and completion callbacks.

[Chapter](../transactions.md) · [Contents](../README.md) · [All exports](../exports.md)

Signatures below are extracted from declaration output. Generic parameters, overloads, optional properties and JSDoc describe the declared contract. Type-only exports cannot be imported as runtime constructors. Supporting contracts are reachable from signatures but are not package-entry exports; do not deep-import them. Private members are omitted; protected hooks are shown only for exported runtime classes.

| Declaration                                           | Access              |
| ----------------------------------------------------- | ------------------- |
| [TransactionCallbackPhase](#transactioncallbackphase) | `@nocobase/db` type |

## TransactionCallbackPhase

[Source](../../../src/database/internal/transaction-callbacks.ts)

Import: `import type { TransactionCallbackPhase } from '@nocobase/db'`.

Which kind of transaction callback failed.

```ts
/** Which kind of transaction callback failed. */
export type TransactionCallbackPhase = 'afterCommit' | 'afterRollback';
```
