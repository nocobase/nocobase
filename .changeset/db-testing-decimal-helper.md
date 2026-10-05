---
'@nocobase/db-testing': patch
---

`withoutDecimalPadding(value)` reduces a decimal string to its value, without the trailing zeros PostgreSQL and MySQL pad it to its column's or its aggregate's scale, and does the same to every decimal string inside an array or an object, so one assertion on a decimal holds on every dialect. `@nocobase/app-testing/server` re-exports it.
