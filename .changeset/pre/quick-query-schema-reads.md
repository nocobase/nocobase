---
'@nocobase/db': patch
'@nocobase/db-postgres': patch
'@nocobase/db-sqlite': patch
---

Reduce query result mapping and timestamp decoding overhead, batch PostgreSQL schema inspection into one statement, and read SQLite index metadata without per-index queries while preserving transaction-local schema inspection.
