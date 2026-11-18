---
name: Dropping a column on SQLite cascades into child tables
description: On SQLite, a migration down that drops a column from a parent table (such as mailAccounts) rebuilds it and deletes every child row through ON DELETE CASCADE.
type: project
modified: 2026-11-18
---

On SQLite, `collection.dropField()` in a migration rebuilds the table: it creates a copy and drops the original. With foreign keys on, dropping the original runs `ON DELETE CASCADE` on every table that references it. Adding a column is a plain `ALTER TABLE` and is safe. A test that rolled back a new `mailAccounts` column found every mail message gone. PostgreSQL does not show this, so tests on that dialect alone miss it.

**Why:** The data loss is silent. The migration succeeds and the next `down` in the batch sees empty tables, which is how it surfaced in `packages/plugins/app-plugin-mail/tests/database/imap-locations-migration.test.ts`.

**How to apply:** When a migration adds a column to a table that other tables reference with a cascade, its `down` must refuse while those child tables hold rows, as `packages/plugins/app-plugin-mail/database/migrations/202611180001_mail_account_sync_folders.ts` does, or detach the incoming foreign keys first, as `packages/plugins/app-plugin-mail/database/migrations/202610250001_mail_imap_message_locations.ts` does. Cover the rollback with seeded child rows on SQLite.
