---
'@nocobase/create-plugin': minor
---

A plugin generated with the `database` capability tests its database with `@nocobase/db-testing`, declared as a devDependency, so its tests run on whichever dialect `NOCOBASE_TEST_DB_DIALECT` selects. `tests/database.test.ts` checks that the migrations and seeds load, and once the example migration is enabled runs `describeMigration()` on it, applying, rolling back and reapplying it and asserting on the Collection it creates. The generated `AGENTS.md` explains how a plugin's tests take a database without choosing a dialect.
