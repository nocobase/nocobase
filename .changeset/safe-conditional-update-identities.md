---
'@nocobase/db': patch
'@nocobase/db-sqlite': patch
'@nocobase/db-postgres': patch
'@nocobase/db-kingbase': patch
'@nocobase/db-oracle': patch
'@nocobase/db-dameng': patch
'@nocobase/db-mssql': patch
---

Preserve primary-key deferrability, index validity, partial-index restrictions, and index comparison compatibility during schema inspection and resolution. Keep optimistic single-row updates on the cardinality-checking path for generated or cascading locating keys, deferred or invalid constraints, unsafe partial or invalid indexes, and incompatible or unknown index collations. Roll back conditional writes that unexpectedly affect multiple rows or cannot reload their result, including inside caller transactions. Preserve SQL Server nullable unique identities whose index predicates only exclude null keys, and keep restricted unique indexes droppable through the Builder.
