---
'@nocobase/db': patch
---

`builder.dropConstraint()` drops a unique constraint that exists as a partial unique index — one declared with a `predicate`, which no database attaches to a constraint — as that index. It was dropped as a constraint, which PostgreSQL refuses (`constraint … does not exist`), so a migration whose `down` dropped one could not be rolled back there; `@nocobase/app-plugin-notification`'s `202609080001_create_notification_idempotency` was one. Constraints a definition resolved from the database lists by the name of an index are dropped the same way.
