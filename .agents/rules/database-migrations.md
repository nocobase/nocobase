# Database Migration Development

Read this before writing or editing a migration or seed in a package, a plugin or a template.

## Database Migration Development

Database migrations are immutable historical records and must be self-contained. Write the exact, deterministic table, field, index, constraint, and metadata synchronization operations directly in each migration. Schema changes must likewise spell out the exact add, alter, rename, or drop operations that the migration performs.

Do not import or iterate over live collection schemas, field definitions, model definitions, registration lists, or other runtime application definitions from a migration. Those definitions continue to evolve, so referencing them can silently change the behavior and checksum of an already published migration. Reuse of such definitions is appropriate for runtime initialization and tests, but not for migration implementation.

When a migration needs to create a collection, call `builder.createCollection` with its fixed name and declare every field, relation, index, and constraint in the migration itself. Write `down` with the corresponding explicit reverse operations in a safe dependency order. For an existing schema, use explicit `builder.alterCollection`, field, index, constraint, or metadata operations rather than synchronizing from the current collection definition.

Add a migration-level test that executes `up` and, when reversible, `down` against a real test database and verifies the resulting physical schema and metadata. Outside the `@nocobase/db` packages, write it with `describeMigration()` — from `@nocobase/app-testing/server` in a plugin or an application, from `@nocobase/db-testing/vitest` in a library: it applies the migrations before this one, applies, rolls back and reapplies this one, checks after each step that metadata and tables agree and that rolling back restores exactly the tables that existed before, and runs on whichever dialect the environment selects.

### Choosing a data-access tool in a migration or seed

A migration's context carries three tools and they are not interchangeable. `builder` is the only one that changes structure. `query` is the default for data: it reads and writes rows through the Connection naming strategy and expresses exactly what it is given. `repository` is the narrow one — reach for it only where `query` would get the write wrong: cross-dialect field encoding and decoding, Collection-level naming overrides, and relation writes, including the junction rows behind a `belongsToMany`. Anything `query` expresses correctly stays on `query`.

A seed's context carries only the last two, because a seed never changes structure. There the default is reversed: installation data is written in Collection terms, so `repository` is the normal tool and `query` is for what it cannot express, such as reading a physical table that backs no Collection.

This does not loosen the rule above. `repository(name)` resolves the Collection from the database itself — the metadata a previous `builder` operation wrote — which is why it is available at all; importing or iterating an application's own collection definitions from a migration remains forbidden, and no amount of convenience justifies it. What it does mean is that a migration using `repository` is betting on a shape it did not declare in its own body, so three things follow:

- Say in a comment why `query` was not enough. A reviewer cannot tell a considered use from a reflex, and the comment is what makes the difference visible.
- Do not use it in `down`. By the time a rollback runs, the Collection has already moved past what `up` left behind, possibly several migrations past.
- Do not use it to walk a table. Selecting every row and updating each one through a Repository is the shape to avoid; a set-based `query` statement is both correct and bounded.

Both tasks get their Repository from the connection the task runs on, which inside a transaction is that transaction's connection. This is why the service container withholds the application's `DatabaseManager` from migrations and seeds: a Repository taken from it would write outside the task's transaction and survive a failure that should have discarded it.

### A plugin's migrations are laid out differently from an application's

An application keeps its tasks under `database/<connection>/migrations` and `seeds`, one directory per configured connection. A plugin declares a single `database/migrations` and `database/seeds` in its `defineServerPlugin` call, relative to the plugin's `baseDir`, and there is no connection segment because a plugin contributes only to the installing application's default connection. It cannot know which further connections an application defines, and cannot target one.

The loader flattens the application's sources and every registered plugin's into one list per connection, rejects duplicate migration names across all of them, and orders what remains by name alone. So a plugin's migration name has to be derived from its package rather than being a bare timestamp — a collision fails the run for the whole application — and a plugin's migrations interleave with the application's by name rather than applying as a block. Execution history records the owning package name, so attribution survives the shared run.

`packages/tools/create-plugin/template/AGENTS.md` carries this for generated plugins; change both together.

### Migrations change incrementally

Every package under `packages/` is published to npm, and `v3-develop` publishes a prerelease of every changed package, so a migration merged there reaches installed applications with the next release, and a beta release counts. Some plugins used to correct a merged migration in place while nothing outside this repository ran it; that is no longer allowed, and the existing migrations of those plugins are not an example to follow.

Before editing an existing migration, check its Git history and the status of the branch that introduced it. An existing migration may be corrected directly only while its introducing feature branch has not yet been merged. Once that branch has been merged into its target branch, never modify the migration again, not its operations, not its `down`, and not its name or filename; implement every correction or subsequent schema change in a new migration. Do not use hard-coded previous checksum hashes to make an edited migration appear compatible.

The reason is that an installation never runs a migration twice. One that already ran the old version records it as executed and skips the edited file, keeping the schema the old version produced, while a fresh installation runs the new version: the two now disagree, and nothing reports it beyond a checksum warning that `nocobase db repair` silences without changing the schema. A new migration is the only change both reach. Write it so that it brings an installation from what the earlier migrations left behind to the target, and so that it also holds on a fresh installation that runs every migration in order. Name it after the earlier one so it sorts after it, and cover the upgrade path in its `describeMigration()` test.

A correction that only reformats a migration or edits a comment changes no schema, but it still changes the checksum every existing installation recorded and warns each of them on the next run. Leave a merged migration's file untouched for those too.

The one exception is a released migration that has never succeeded on a supported database and that no later migration can get past, because the failing statement is the one that creates the table — for example a unique index declared on a `varchar(1024)`, which exceeds MySQL's key length, so the plugin cannot be installed there at all. Such a migration may be corrected in place, and only to the extent that makes it succeed. The changeset must say that it edits a released migration and why, and must tell operators of installations that already ran it to expect a checksum warning on the next `nocobase db apply` and to clear it with `nocobase db repair`.
