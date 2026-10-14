# Transaction metadata caching

Database-backed Collection metadata shares validated naming summaries and their resolved naming indexes between a connection and its transactions. A transaction still owns its Registry, metadata Store, physical schema inspector, and Collection resolution cache. Physical schema inspection and individual metadata reads therefore continue to use the transaction's client and database snapshot.

## Version checks

The database Store initializes a companion bookkeeping table alongside the metadata table. Its name consists of the first 45 characters of the metadata table name, `_cache_`, and an eight-character hash of the full name. It lives in the same schema, contains one version row, and is excluded from Collection listing and scanning. Existing metadata documents and their revisions are left unchanged when the companion table is initialized.

Each metadata insertion, update, or deletion replaces the version with a fresh UUID in the same database transaction as the document write. A write outside an existing transaction opens one for these operations. Updating the version row serializes metadata writers; ordinary Repository data writes do not update or lock it. UUIDs avoid reusing a cache identity when a document is deleted and recreated with revision 1.

On the first naming lookup in a Registry, the Store reads this version through its own client. An unchanged version reuses a validated snapshot and naming index. A new version loads the metadata pages and verifies the version again before publishing the snapshot. If metadata keeps changing during loading, the reader falls back to an uncached listing after three attempts. Only two versions are retained per connection family, so rolled-back transactions cannot accumulate unbounded cache entries. Naming configurations have separate indexes, and temporary validation overrides never replace a shared index.

## Transactions and invalidation

Savepoints read the enclosing transaction's database view. An uncommitted version may be cached, but another transaction can reuse it only if its own version query sees that exact UUID. Rolling back restores the preceding database version; committing exposes the new version to subsequent transactions. A transaction with an older database snapshot never substitutes the root connection's newer version. Cache misses execute through the transaction client, including with a single-connection pool; readers never wait on an in-flight query owned by a parent Store.

Metadata services and Collection Builder operations retain their existing Registry invalidation and commit/rollback propagation. `collections.invalidate()` also clears shared naming snapshots and prevents an older in-flight load from republishing them. `collections.refresh(name)` retains its existing per-Collection semantics. Custom metadata Stores keep their existing `list()` behavior and do not need to implement a new public interface.

All database metadata writers must use the version-aware Store to participate in automatic cross-connection detection. Raw SQL edits and writers running an older package version do not update the version row: invalidate the affected connection families explicitly, or restart them after such edits. Coordinate metadata-changing operations during a rolling upgrade. Physical DDL is still inspected in each transaction, so a physical schema change does not depend on the naming cache version.

## Regression coverage

`db-sqlite/tests/transaction-metadata-cache.test.ts` covers a warm root with 136 metadata documents, Repository and Query reads, nested transactions, a single-connection pool, physical DDL, explicit invalidation, rollback, commit callbacks, updates from another connection, and a WAL snapshot that remains older than the root connection's cached index. The shared `db-testkit/tests/integration/metadata/naming-cache.test.ts` suite checks Store-level reuse, naming configuration separation, savepoint rollback, deletion/recreation, legacy table initialization, failed validation, and invalidation during loading.

In the isolated SQLite reproduction, ten transactions reading the same Collection five times each previously made ten full metadata reads and parsed 1,370 documents. After this change they make no full metadata reads and parse ten documents, one for the requested Collection in each transaction. They also make one version-row read per transaction's naming index. This measures the eliminated work, not an application-wide CPU, latency, or retained-memory improvement; those depend on the application's schema and workload.
