---
'@nocobase/app-cli': minor
'@nocobase/app-server': minor
'@nocobase/app-skills': minor
'@nocobase/db': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Refresh the Collection cache when migrations change a schema

`database/<connection>/collections/` went stale after every migration until someone ran `collections generate`. It is now refreshed where the schema changes:

- `db apply`, `db redo`, `db rollback` and `db reset` regenerate it for each connection whose migrations they executed, rolled back or rebuilt. `--no-collections` skips it, and a built `dist/` never writes it. A failed refresh is a warning, not a failure: the migrations stay applied and the command still exits 0. With `--json`, the result gains a `collections` field listing each refresh; it is absent when nothing was refreshed.
- `pnpm dev` does the same after the startup migrations of the application it started. `nocobase dev` names that application's root in `NOCOBASE_COLLECTIONS_REFRESH`, which `DatabaseProvider` compares against its own root, so a Hub's in-process applications and production never write the cache.
- `refreshAppCollectionsArtifact()` in `@nocobase/app-server/database` is the shared implementation: given a database run's result, it regenerates the cache of every connection whose schema changed.

Seeds and `db repair` or `db unlock` do not trigger a refresh. After editing an external connection's `metadata/`, or when another system changes its schema, run `collections generate` yourself.
