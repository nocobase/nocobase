---
'@nocobase/app-server': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Supply plugin migration and seed sources to database planning directly instead
of through the database configuration.

`AppDatabaseConfig.taskSources` is removed. It held the application's package
name and the migration and seed directories contributed by registered server
plugins — values the runtime derives from resolved plugins rather than values
anyone configures. Carrying them in the `database` namespace put them where a
`config.yml` deep-merges: `database.taskSources.migrations: []` silently
dropped every plugin's migrations, and the application still started.

They now travel as an `AppDatabaseTaskContributions` value alongside the
configuration. `planAppDatabaseTasks`, `runAppDatabaseTasks`, `runAppMigrations`
and `runAppSeeds` take an options object carrying it, with `paths`, `drivers`
and the task selection, in place of their positional parameters.
`createAppPluginDatabaseConfig` and `resolveAppPluginDatabaseConfig` are
replaced by `createAppDatabaseTaskContributions`, which maps resolved plugins to
that value. `contributions` is required, so a call site that has not been
updated fails to compile rather than quietly planning without its plugins.

An application's `server/config/database.ts` keeps only what it configures —
drivers and connections — and no longer calls into the plugin resolver. Its
`cli/database-command.ts` builds the contributions from the runtime it already
resolves; `cli/commands/migrate.ts` and `cli/commands/seed.ts` are unchanged.
