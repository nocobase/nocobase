---
'@nocobase/db': patch
'@nocobase/app-plugin-database-explorer': patch
---

Reuse validated Collection naming metadata across database transactions after checking a transactional version marker, avoiding repeated full metadata reads while preserving transaction-local physical schema inspection, savepoint isolation, and cache invalidation.

Keep transaction read views out of the shared cache, revoke cache reuse for transactions spanning explicit invalidation, and preserve metadata conflict errors for concurrent insertions within one transaction.

Document and verify the Database Explorer initialization boundary for metadata and cache-version bookkeeping tables.
