---
'@nocobase/dev-config': patch
---

The shared ESLint configuration treats calls named `test`, `it` and `describeMigration` as test blocks for `vitest/no-standalone-expect`, so assertions inside a `test` built with `test.extend()` — such as the one `createDatabaseTest()` from `@nocobase/db-testing/vitest` returns, or one a package exports from its own fixtures module — and inside the `up` and `down` callbacks of `describeMigration()` are no longer reported as standalone.
