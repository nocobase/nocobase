---
'@nocobase/db': patch
'@nocobase/db-sqlite': patch
'@nocobase/db-postgres': patch
'@nocobase/db-kingbase': patch
'@nocobase/db-oracle': patch
'@nocobase/db-dameng': patch
---

Preserve primary-key deferrability and index comparison compatibility during schema inspection and resolution. Keep optimistic single-row updates on the cardinality-checking path for generated locating keys, deferred constraints, and incompatible or unknown index collations, preventing unintended multi-row writes and committed updates reported as missing.
