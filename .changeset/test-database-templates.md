---
'@nocobase/db': patch
'@nocobase/db-sqlite': patch
'@nocobase/db-testing': minor
---

Let a test suite migrate its databases once: `createTestDatabase({ template: true })` migrates and seeds once per process into a template and gives each call a copy of it, where the dialect's test provisioner can copy a database. `TestDatabaseProvisioner` gains an optional `clone({ source, name, env })`, which the SQLite provisioner implements by copying the file; other dialects keep migrating each database as before.
