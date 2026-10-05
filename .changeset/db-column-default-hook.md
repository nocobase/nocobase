---
'@nocobase/db': patch
---

A dialect's schema runtime can give a column's default as an expression through `schema.columnDefault({ client, column, altering })`, used in place of the literal `defaultValue` when a table is created or a column is added or altered. MySQL needs it for a TEXT column, which takes a default only as `default ('…')`.
