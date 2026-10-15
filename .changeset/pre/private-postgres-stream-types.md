---
'@nocobase/db-postgres': patch
---

Keep the private query-stream constructor boundary independent of PostgreSQL native type declarations so strict workspace consumers can typecheck application imports without undeclared pg types.
