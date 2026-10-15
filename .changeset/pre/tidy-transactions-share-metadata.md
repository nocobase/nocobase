---
'@nocobase/db': patch
'@nocobase/app-plugin-database-explorer': patch
---

Reuse validated Collection naming metadata across database transactions after checking a transactional version marker, avoiding repeated full metadata reads while preserving transaction-local physical schema inspection, savepoint isolation, and cache invalidation.

Keep transaction read views out of the shared cache, revoke cache reuse for transactions spanning explicit invalidation, and preserve metadata conflict errors for concurrent insertions across a parent transaction and its nested savepoints. Check current metadata revisions even when a supplied transaction retains an older repeatable-read snapshot.

Keep locking revision reads at the top SQL level so metadata writes also work on Oracle.

Limit cache table name prefixes by UTF-8 bytes so multibyte custom metadata table names initialize correctly on PostgreSQL.

Document and verify the Database Explorer initialization boundary for metadata and cache-version bookkeeping tables.
