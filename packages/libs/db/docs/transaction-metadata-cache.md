# Transaction metadata caching

PostgreSQL and SQLite transactions can reuse resolved Collection definitions and their naming index. Each transaction still binds its Repository, Query, schema inspector and metadata Store to its own client. Only the resolved data and the naming index are reusable. Registry callers continue to receive copies of definitions they can modify.

## Configuration and initialization

Reuse defaults to enabled on managed PostgreSQL and SQLite connections using the database metadata Store. Set `transactionCollectionCache: false` on a connection to restore physical inspection and per-Collection metadata reads in every transaction. This setting preserves schema notifications so other connections can still reuse their caches. External connections default to cold inspection because an external owner can apply DDL without a notification. Set `transactionCollectionCache: true` on an external connection only when every schema writer participates in the same notification protocol.

Use `connection.transaction(fn, { collectionCache: 'isolated' })` to opt out for one transaction and its savepoints. Migrator and Seeder use isolated transactions. SQL Server transactions resolve naming and definitions without reading the version row, so a writer holding that row in READ COMMITTED with RCSI disabled cannot delay an unrelated Collection read. MySQL, MariaDB, Oracle, and other dialects retain transaction-local Collection resolution. Custom Stores keep their existing `list()` semantics.

The connection prepares the metadata and version tables before its first outermost transaction. An already-open Knex transaction inherits completed initialization when available and never upgrades bookkeeping tables itself. Preparing outside BEGIN also lets a business transaction hold the only pooled connection. The existing version table name retains its UTF-8-safe prefix and eight-character hash. The PostgreSQL and SQLite version rows add a monotonic sequence and an independent count of active non-transactional schema changes.

## Reads and publication

- SQLite reads the version lazily on the first Collection or naming lookup, through the transaction's client. Its database snapshot ties that value to metadata and physical catalog reads, including while another replica commits in WAL mode. Savepoints reuse the enclosing transaction's probe when it is available.
- PostgreSQL READ COMMITTED probes on the first lookup of each Collection. A writer can commit DDL on `members` while a transaction is reading `tasks`, and that transaction's first `members` lookup then sees the new version. Repeated Query or Repository access to the same Collection shares the probe. A token change drops the local index, cached misses and definitions. PostgreSQL cold loads check the version again before publication because physical and metadata reads are separate statements.
- A missing or untrusted token, a positive active-change count, or conflicting UUIDs at the same sequence selects cold reads. An empty prepared transaction reads neither the version nor the catalog.
- The connection remembers the highest stable sequence it has observed. A transaction can publish matching candidates only after successful COMMIT, with its original local invalidation generation. A released savepoint contributes candidates to the parent. A rolled-back savepoint, a failed commit, or an older snapshot cannot fill or replace entries for a newer version. Transactions that write metadata or DDL stop sharing their resolved definitions.
- Non-transactional root registries retain process-local invalidation. Call `collections.invalidate()` to revoke shared reuse in that connection family after out-of-band edits. Other replicas rely on the database version protocol.

## Schema and metadata writes

Use the Collection Builder or `connection.schema.execute()` for DDL. If a native client is necessary, wrap the DDL in a notification and use the same connection's client:

```ts
await connection.notifySchemaChange(async () => {
  const knex = await connection.client<Knex>();
  await knex.schema.alterTable('orders', (table) => table.string('note'));
});
```

In PostgreSQL and SQLite transactions, the version change commits with the DDL. The notification invalidates local resolutions even in isolated transactions. On a root connection, registration commits before the first DDL statement and remains visible until completion. Each operation adjusts its own registration and advances the version when it finishes. Overlapping operations keep readers cold until they have all finished. A crashed writer or failed final registration update leaves the count positive, which keeps cache reuse disabled. Restore a failed registration only after confirming that no registered operation can still change the schema.

Migrator applies this protocol to each up or down operation, including the ledger update. A failed transactional migration publishes an invalidation after rollback releases its client. A non-transactional migration settles its registration on success or failure, since an early DDL statement can commit before a later one fails. Historical migration files stay immutable.

Database-backed metadata writes keep their existing revision checks and temporary and final UUIDs. Each UUID update also advances the PostgreSQL and SQLite sequence. The version row serializes metadata writers, and writes sharing one outer transaction queue across its savepoints. External Knex transactions and MySQL REPEATABLE READ can combine their own updates with older reads of other documents. These views stay local.

During a rolling upgrade, older writers send no schema notification and older metadata writers may only replace the UUID. Keep reuse disabled while older processes can change the schema, and enable it after the writers have been upgraded. A separate process-local cluster invalidation can still call `collections.invalidate()` on receipt.

## Regression coverage

`db-sqlite/tests/transaction-metadata-cache.test.ts` covers a warm root with 136 metadata documents, Repository and Query reads, nested transactions, a single-connection pool, physical DDL, explicit invalidation, rollback, commit callbacks, updates from another connection, and a WAL snapshot that remains older than the root connection's cached index. The shared `db-testkit/tests/integration/metadata/naming-cache*.test.ts` suites check Store-level reuse, naming configuration separation, savepoint rollback, deletion/recreation, legacy table initialization, failed validation, and invalidation during loading. They also cover concurrent initialization without transactional DDL, rollback after reading legacy metadata, preparation before metadata writes, and concurrent insert/update/delete operations with index reads and overlapping writes. Competing insertions through separate Stores, parent transactions, and multiple levels of savepoints verify stable conflict errors, queue recovery, and rollback. The public SQLite metadata update regression also covers concurrent parent/savepoint calls. SQLite WAL regressions check both reload orders after raw SQL and explicit invalidation, including later savepoints. The MySQL transaction-isolation suite checks a REPEATABLE READ transaction that writes one document after another connection has committed a change to a different document. It also checks both stale and current revision tokens after another connection inserts, updates, or deletes a document outside the transaction's read view.

The PostgreSQL metadata table naming suite covers ASCII and two-, three-, and four-byte characters in custom table names. It verifies initialization, reopening a Store, subsequent reads and writes, and recognition of the companion table as internal bookkeeping.

Oracle runs the same Store revision, transaction, and naming-cache contracts. Locking revision reads use the metadata name primary key without a SQL row limit, keeping `FOR UPDATE` on the top-level query so Oracle can execute both metadata insertions and updates.

Before resolved Collection reuse was added, in the isolated SQLite reproduction, ten transactions reading the same Collection five times each previously made ten full metadata reads and parsed 1,370 documents. After this change they make no full metadata reads and parse ten documents, one for the requested Collection in each transaction. They also make one version-row read per transaction's naming index. This measures the eliminated work, not an application-wide CPU, latency, or retained-memory improvement; those depend on the application's schema and workload.
