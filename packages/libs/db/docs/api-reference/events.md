# 9. Events

[Contents](./README.md) · [Previous: Transactions](./transactions.md) · [Next: Testing](./testing.md)

Repository mutation events observe writes performed through application Repository handles. Register listeners on a full connection.

## Subscriptions and delivery boundaries

`onRepositoryMutation(options, listeners)` returns an unsubscribe function. Listeners are `inTransaction` and `afterCommit`; use `explainRepositoryEvents()` to inspect matching subscriptions and execution strategy. Events carry operation identities, row changes or counts, metadata and ancestry. Listener connections retain the event parent and recursion limit. Subscriptions belong to the root connection, even when registered through a transaction. Delivery is local to the process performing the Repository write. Raw SQL, QueryAdapter writes, migration/seed task writes and database-side effects such as cascading deletes do not produce these events. Full [event contracts](./signatures/events.md) include phases, strategies, options and error contexts.

## Listener phases and errors

`inTransaction` listeners execute within the write's transaction; listener failure can reject the write. `afterCommit` listeners execute after the write commits; their failure does not undo the committed write. Configure `onRepositoryEventError` to receive after-commit listener failures; otherwise the connection reports a `REPOSITORY_EVENT_LISTENER_FAILED` process warning.

Transaction completion callbacks have their own registration and error handling, documented in [Transactions](./transactions.md#completion-callbacks-and-failures).

## Event payloads and typed metadata

`RepositoryMutationEvent` describes the operation, Collection and mutation ancestry. Row-level events use `RowChange` with the change kind, row key and optional written-field names. With `values: true`, they also include the logical values written by the call. These are not before/after row images: previous values and database-generated values that the call did not read back are absent. Count-level events use mutation counts. Subscription options and execution strategy determine the available granularity.

`defineRepositoryEventMeta()` defines typed metadata carried by mutation option `meta`. `RepositoryEventMeta`, `RepositoryEventMetaEntry` and `RepositoryEventMetaBag` describe definition, entries and access. See the [complete event signatures](./signatures/events.md) for exact payload variants and [event examples](../zh-CN/repository/events.md).

Known issue in this checkout: the accepted namespace `__proto__` loses its value during metadata normalization. Use another namespace until [review finding F5](./release-review.md#f5-event-metadata-loses-the-proto-namespace) is resolved.

## Execution strategy and listener writes

`explainRepositoryEvents()` reports matching subscriptions and how a mutation would run, including implicit transactions and bulk-row discovery where required. Listener connections preserve the event parent and apply `repositoryEventMaxDepth` to nested listener writes. Events describe writes observed by this connection; they are not a durable cross-process event stream.

[Contents](./README.md) · [Previous: Transactions](./transactions.md) · [Next: Testing](./testing.md)
