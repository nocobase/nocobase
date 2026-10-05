---
'@nocobase/db': patch
'@nocobase/db-testing': patch
---

The in-process check of a migration or seed lock is kept per Database Connection instead of per connection name. Two Database Managers in one process — two applications a host embeds, or two tests — each have a connection called `main` on databases of their own, and one migrating while the other did failed with `TaskLockBusyError` ("already held for connection \"main\"") although the two never shared a database. Two managers on the same database still take turns through the lock row. `@nocobase/db-testing` no longer runs the migrations and seeds of its test databases one after another, which it did only to avoid that error.
