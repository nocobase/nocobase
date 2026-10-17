---
'@nocobase/app-plugin-scheduler': patch
'@nocobase/queue': minor
'@nocobase/db': minor
'@nocobase/db-oracle': patch
---

Add a transaction-safe physical row upsert API and use it through a unified Queue adapter accepting DatabaseConnection, with the upstream Knex client bridge kept private. Fix scheduler startup across database dialects while preserving schedule execution history.

Preserve the outer Oracle transaction when a nested savepoint completes, allowing inserted rows to roll back with their owning transaction.

Retry deadlocks with bounded backoff when a physical row upsert owns its transaction; preserve caller-owned transaction boundaries and propagate failures requiring the caller to retry.

Recognize Dameng unique-key conflicts during concurrent upserts and preserve the outer transaction when knex-dm finishes a nested savepoint.

Declare Knex as a Dameng runtime dependency so nested transaction support also works in registry installations.
