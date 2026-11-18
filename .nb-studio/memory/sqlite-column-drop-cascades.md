---
name: Dropping a column on SQLite cascades into child tables
description: On SQLite, a migration down that drops a column from a parent table (such as mailAccounts) rebuilds it and deletes every child row through ON DELETE CASCADE; the owner accepts that loss on rollback.
type: project
modified: 2026-11-18
---

On SQLite, `collection.dropField()` in a migration rebuilds the table: it creates a copy and drops the original. With foreign keys on, dropping the original runs `ON DELETE CASCADE` on every table that references it. Adding a column is a plain `ALTER TABLE` and is safe. PostgreSQL does not show this.

**Why:** On PM-1635 the owner (Drol) rejected a `down` that refused to run while account data existed: losing data when rolling back on SQLite is acceptable, and only SQLite has the problem.

**How to apply:** In a `down` that drops a column, just drop it; do not add a "table contains data" guard for the SQLite cascade (see `packages/plugins/app-plugin-mail/database/migrations/202611180001_mail_account_sync_folders.ts`). In a test that rolls back with seeded child rows on SQLite, expect those rows to be gone and roll back only the migration under test, so earlier migrations' own guards do not run.
