# External connections

Read this before working with the `externalCrm` connection or adding another `external` connection.

`database/<connection>/collections/` holds what the database currently resolves each Collection to — `collection.json`, `metadata.json` and `schema.json` per Collection plus a `_manifest.json` — written by `pnpm nocobase collections generate`, which `db apply`, `db redo`, `db rollback`, `db reset` and `pnpm dev` run for every connection whose migrations they change. Every file there is derived, for every connection: the directory is gitignored, safe to delete, and never read back. Edit a managed connection's metadata through migrations or the Collection Metadata Service. An `external` connection's metadata is written by hand in `database/<connection>/metadata/<name>.json` — one metadata document per Collection, committed and read at startup — and regenerating picks it up. Never import any of these files from a migration. `pnpm nocobase collections generate --check` fails when they are out of date.

An `external` connection such as `externalCrm` reads a database another system owns: write its supplemental metadata by hand in `database/<connectionName>/metadata/<name>.json` (`database/<connectionName>/collections/` is the generated cache), never write migrations for it, and expose it read-only unless the owning system has agreed otherwise.

Configuring connections is covered by [database connections](../skills/nocobase-app-development/references/database-connections.md).
