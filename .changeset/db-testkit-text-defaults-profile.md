---
'@nocobase/db-testkit': patch
---

A dialect's integration profile can declare `schema.textDefaults: 'unsupported'` when a TEXT column cannot keep a default in the table, as on OceanBase, so the shared contract that inserts a row without a text column's value skips that dialect. It is `supported` when omitted. `schema.textAlterations: 'unsupported'` likewise skips the case that redefines an existing text column, which Oracle refuses for a CLOB.
