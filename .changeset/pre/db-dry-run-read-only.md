---
'@nocobase/db': patch
---

A dry run of a migrator's `rollback` or `repair`, or of a seeder's `repair`, only reads. It no longer takes the task lock, creates the history or lock table, or upgrades legacy checksums, so `nocobase db rollback --dry-run`, `db redo --dry-run` and `db repair --dry-run` leave the database as their output says they do. Before, on a database no migration or seed had run on, they created `__nocobase_migrations`, `__nocobase_migration_lock`, `__nocobase_seeds` and `__nocobase_seed_lock`. A database without a history table now has an empty history, as `history()` already reported. A dry run also no longer waits for a run that holds the lock, so its preview can be overtaken by that run.
