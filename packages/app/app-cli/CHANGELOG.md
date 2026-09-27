# @nocobase/app-cli

## 1.0.0-beta.8

### Major Changes

- 46ce11f: A build is no longer tied to a mount path. `createAppViteConfig` builds with a relative base, and the application server rewrites the relative URLs in `index.html` — the `./assets/` chunks and every `public/` file the page references — to the path it is mounted at, so one `dist/` runs at any `APP_BASE_PATH`. The development server still needs an absolute base and refuses to start without `APP_BASE_PATH`, which `pnpm dev` always passes; `DEFAULT_APP_BASE_PATH` in `@nocobase/app-server/support` is the `/main` it falls back to. In proxy mode, `createDevClientConfigPlugin` from `@nocobase/app-cli/dev/proxy` renders the remote application's client configuration into the local page, and says which status or redirect it met when the remote does not serve one.

  `pnpm build` records `nocobase.relocatable: true` in `dist/package.json` in place of `nocobase.basePath`, and no longer copies `APP_BASE_PATH` into `dist/.env`. app-installer chooses the mount path with `install --base-path` and keeps it in `app.env`, and a Hub archive keeps `/hub` unless the flag says otherwise; an archive from an earlier build runs only at the path it records, and `install`, `upgrade` and `rollback` refuse it elsewhere with `BASE_PATH_MISMATCH`. The Hub refuses such an archive unless it was built for `/<appId>`. The template Dockerfiles no longer take `APP_BASE_PATH` as a build argument: the image defaults to `/main`, `/hub` for the Hub, and `docker run -e APP_BASE_PATH` moves it.

### Patch Changes

- Updated dependencies [46ce11f]
- Updated dependencies [46ce11f]
- Updated dependencies [46ce11f]
  - @nocobase/app-server@1.0.0-beta.29
  - @nocobase/dev-config@0.1.0-beta.14
  - @nocobase/db@1.0.0-beta.16

## 1.0.0-beta.7

### Minor Changes

- a4ee8aa: `pnpm build` records the base path compiled into the client and when the build started in `dist/package.json`, as `nocobase.basePath` and `nocobase.builtAt`, beside `nocobase.buildTarget`. An installer reads them to mount the application where its client expects to be served and to tell two builds of the same version apart.

### Patch Changes

- Updated dependencies [a4ee8aa]
  - @nocobase/app-server@1.0.0-beta.28

## 1.0.0-beta.6

### Major Changes

- ec92b20: Commands are written against `AppCommand`, exported from the package root, which replaces the `./plugins` entry. `defineCliPlugin`, `defineCliPlugins` and the hook types move to the root too: import them from `@nocobase/app-cli`.

  - `this.rootDir` is the application root the runner located, and `this.withApp(async ({ app, env }) => …)` creates the application, runs the callback, and always shuts it down and destroys its runtime, including a half-built one a failing `createApp` left behind. The application is created, not started. A failure to shut down afterwards is a warning: it never turns work that succeeded into a failure, or replaces the failure the work ended in.
  - `appPath({ description, default })` declares a path flag whose value arrives absolute: a typed value resolves from the current directory, and the default from the application root.
  - `run()` returns the command's result and throws `CommandError` (`code`, `suggestions`, `details`, `exit`) on failure. `--json` comes from `AppCommand`, and every command prints the same envelope: `{ schemaVersion: 1, ok, command, status, result | error, warnings }`, where `status` is `success`, `success-noop`, `partial-success` or `failure`. `NOCOBASE_CONTENT_TYPE=json` enables it for every command.
  - **Breaking for anything that parses `--json`.** Fields commands printed at the top level are now under `result`; failures carry `error.code`, `error.suggestions` (`{ message, run? }`) and `error.details`; `operation` is replaced by `command` (`release upload`, not `release:upload`). `config init`'s `unchanged` is `success-noop`, and a failed `config check` lists its findings in `error.details.findings`. Every `--dry-run` answers `success-noop` — `plugin register --dry-run` for an uninstalled plugin with `result.state: "requires-installation"` — and so does a `db` command that found nothing to do. `release upload` and `release deploy` report a bad argument as `INVALID_USAGE`, like every other command, instead of `INVALID_ARGUMENTS`. Exit codes are unchanged, except that invalid usage now exits 2 consistently.
  - `this.exit()` and `this.logJson()` are refused in an `AppCommand`, and warnings go to `warnings` under `--json` instead of being dropped. An oclif error a command raises itself, such as `this.error()`, reports `COMMAND_FAILED` rather than invalid usage.
  - A suggestion's `run`, and `config init`'s `nextCommands`, name the command line the way it runs where the command ran: `pnpm nocobase` in a source checkout, `node <dist>/cli/index.js` by absolute path in a built `dist/`, which has no pnpm. `this.cliCommand(args)` gives an `AppCommand` the same for its own suggestions. A failure outside any command — an unknown command, a broken plugin entry — still answers `--json` with one document.
  - The runner closes a runtime a command left open and names the command on stderr. What an application logs while a command runs goes to stderr, so stdout carries only the command's output, and `this.logToStderr()` keeps writing progress to stderr under `--json` instead of going silent.
  - A `CommandError`'s `cause` is no longer printed under "Caused by"; `NOCOBASE_CLI_DEBUG=1` prints the error chain behind any command's failure, with stacks, redacted the way log files are, from a source checkout or a built `dist/`. `release upload` and `release deploy` use it instead of printing their own causes.
  - `@nocobase/app-cli/testing` exports `bindAppCommand(Command, { rootDir, loadRuntime?, createApp?, id? })` and `runAppCommand(Bound, argv)` for testing commands without the runner.
  - `db apply`, `db rollback`, `db redo` and `db reset` take `--dry-run`, which returns the plan in `result.plan` without changing anything (`db repair --dry-run` gains the same `plan` and now answers `success-noop`). A refusal without `--force` outside a terminal carries that plan in `error.details.plan` and suggests the `--force` and `--dry-run` forms, and a held task lock fails with `DATABASE_LOCKED`, naming the holder and whether unlocking needs `--force`. Help examples lead with `--dry-run` rather than `--force`.
  - `release upload` and `release deploy` report progress on stderr: the upload starting, and each change of deployment status while `--wait` waits.

- 02d5402: `@nocobase/app-cli` is now the whole application command line: it provides the `nocobase` bin and absorbs `@nocobase/nb3-cli` (command assembly, the plugin contract, plugin and Skill management) and `@nocobase/app-tools` (`dev`, `build`, `start`, `server-deps`). Neither of those two packages is published any more, and there is no compatibility period.

  - **Commands.** Standard commands leave the `app` topic: `nocobase db apply`, `nocobase config init`, `nocobase collections generate`. `app db doctor` is now `collections doctor`, `app i18n:check` is now `locales check`, and `app upload`/`app deploy` are `release upload`/`release deploy`, registered only when `package.json` sets `nocobase.cli.publishing: true`. New commands `dev`, `build`, `start`, `dist retarget` and `dist check` replace the application's `scripts/*.mjs`. `plugin skills sync` and `plugin cli-hooks` are removed; use `skills sync`. `app` now holds only an application's own commands.
  - **Discovery.** Commands are found by path: an application's `cli/commands/orders/sync.ts` answers to `nocobase app orders sync`, with no index to maintain. The bin finds the application from the nearest `package.json` (`nocobase.templateKind` for a source checkout, `nocobase.buildTarget` for a built `dist/`), or from `NOCOBASE_APP_ROOT`; applications no longer have a `cli/index.ts`. A built-in command runs without importing the application's plugins.
  - **Plugins.** A plugin's topic is its package name without the scope and `app-plugin-` prefix, so the scheduler's commands move from `schedule` to `scheduler` and the CLI example's from `demo` to `cli-example`. `defineCliPlugin` accepts `devCommands`, which a built `dist/` leaves out; the workflow plugin's `check` and `build` are development commands. Plugins declare `@nocobase/app-cli` as their peer instead of `@nocobase/nb3-cli`.
  - **Deployment.** `nocobase build` writes `dist/cli/index.js`, so `node dist/cli/index.js db apply` runs from any directory without pnpm; `dist/package.json` keeps only the `start` and `nocobase` scripts. The `migrate` and `seed` scripts it used to generate pointed at commands that no longer existed and are gone. Development tooling (`typescript`, `tsx`, `vite`, `prettier`, `tar`, `@nocobase/dev-config`) is an optional peer, so a deployment installs none of it.
  - **Templates.** Scripts are reduced to `postinstall`, `dev`, `build`, `start` and the quality checks; every other command is `pnpm nocobase <topic> <command>`. `scripts/`, `cli/index.ts` and `cli/commands/index.ts` are removed.

  Upgrading an existing application requires moving to the new layout in one step: see "Shared application scripts and commands" in the `nocobase-app-upgrade` Skill (`packages/app/app-skills/skills/nocobase-app-upgrade/references/edge-cases.md`) for the full procedure. Messages that named `nocobase app db repair` and similar commands now name the new ids.

- ae43f41: Tidy the `release upload` and `release deploy` commands and make `--json` output consistent across the CLI.

  - The JSON document's `operation` is now `release:upload` or `release:deploy`, matching the command id, instead of `app.upload` or `app.deploy`. Scripts that match on the old values need updating.
  - `release upload` and `release deploy` are no longer registered in a built `dist/`. They publish the archive `nocobase build --tar` writes beside the sources, so run them in the source checkout or in CI.
  - A path given to `--file` or `--config` now resolves from the current directory rather than from the App root. Without `--file`, upload still reads `storage/exports/dist.tar.gz` in the App root.
  - An argument error names the flag that is missing, invalid or unknown, such as `Missing required flag --release-id.`, and still never repeats a value. A failure with no known cause suggests `NOCOBASE_CLI_DEBUG=1`, which prints that cause to stderr.
  - Both commands have a description and examples in `--help`, and `--hub` is described the same way on both.
  - `plugin register`, `plugin unregister`, `plugin update`, `plugin inspect`, `package remove` and `skills sync` print a `--json` failure on stdout, as a success already was and as every other command already did. A caller reads one stream and checks the exit code.
  - The Hub publishing guidance moves from the `nocobase-app-development` Skill to `nocobase-deployment`, the CLI reference describes the stdout-only `--json` contract and path resolution, and the Hub API key Skill states the new path rule.

### Minor Changes

- ec92b20: `nocobase commands` lists every command registered where it runs — the built-in ones, the application's `app` commands and each registered plugin's — and `--json` returns them as data for agents and scripts: `{ commands, topics }`, each command with its `id` (`db apply`), `summary`, `description`, `source` (`builtin`, `app` or `plugin`, with the plugin's `package`), `developmentOnly`, whether it takes `--json`, `--dry-run` and `--force`, its `args`, its `flags` (`name`, `char`, `type`, `description`, `required`, `multiple`, a static `default` — with `defaultRelativeTo: "application-root"` when it is an `appPath()` default — and `options`) and its rendered `examples`. In a built `dist/` it lists no development command.

  Invalid usage answers with what was probably meant. A nonexistent flag suggests the closest flags (`Did you mean --connection?`) and the command's `--help`; an unknown command suggests the closest command ids with the command to run each, or the help of the topic a single misspelled word was meant to be, and `pnpm nocobase commands --json`. The message names the command's own flags, arguments and allowed values and never repeats a value that was typed, since a mistyped command line can leave a secret anywhere in oclif's wording; it no longer ends with oclif's "See more help with --help". A value a flag's parser rejects is reported as `INVALID_USAGE` with exit code 2 instead of `UNEXPECTED`, and every usage failure keeps exit code 2. Without `--json` the suggestions print under "Try this:". With `NOCOBASE_CLI_DEBUG` set, a failure's diagnostics print once, and oclif's own raw stack no longer replaces the message and its suggestions.

  The application Skills point agents at `pnpm nocobase commands --json` for the whole command tree.

  Piping a command's output into a reader that stops early, such as `| head`, no longer ends the run with exit code 13 and an "unsettled top-level await" warning: the runner stops waiting for stdout once the reader has closed it.

- 8c06293: The application templates no longer carry forwarding files in `cli/`: `cli/database-command.ts`, `cli/hub-publishing.ts`, `cli/commands/i18n-check.ts` and `cli/standard-commands.ts` are gone, and `cli/commands/index.ts` now calls `createAppCommands` itself. `@nocobase/app-cli` drops the `./database-command` and `./commands/i18n-check` subpaths that existed only for those files; `./hub-publishing` remains. An existing application generated from an earlier template re-exports those subpaths, so upgrading `@nocobase/app-cli` requires the same change there: delete `cli/database-command.ts` and `cli/commands/i18n-check.ts`, and move the `createAppCommands` call from `cli/standard-commands.ts` into `cli/commands/index.ts`. The helpers behind the two removed subpaths are no longer public.
- 05af1d4: Refresh the Collection cache when migrations change a schema

  `database/<connection>/collections/` went stale after every migration until someone ran `collections generate`. It is now refreshed where the schema changes:

  - `db apply`, `db redo`, `db rollback` and `db reset` regenerate it for each connection whose migrations they executed, rolled back or rebuilt. `--no-collections` skips it, and a built `dist/` never writes it. A failed refresh is a warning, not a failure: the migrations stay applied and the command still exits 0. With `--json`, the result gains a `collections` field listing each refresh; it is absent when nothing was refreshed.
  - `pnpm dev` does the same after the startup migrations of the application it started. `nocobase dev` names that application's root in `NOCOBASE_COLLECTIONS_REFRESH`, which `DatabaseProvider` compares against its own root, so a Hub's in-process applications and production never write the cache.
  - `refreshAppCollectionsArtifact()` in `@nocobase/app-server/database` is the shared implementation: given a database run's result, it regenerates the cache of every connection whose schema changed.

  Seeds and `db repair` or `db unlock` do not trigger a refresh. After editing an external connection's `metadata/`, or when another system changes its schema, run `collections generate` yourself.

- 4adcf24: Keep hand-written Collection metadata apart from the generated `collections/` cache

  `database/<connection>/collections/` used to hold two opposite things: a generated snapshot for a managed connection, and, for an external connection, `metadata.json` files that were the hand-written metadata source. The two now live in separate directories, so a directory is either written by people or generated, never both.

  - `DirectoryCollectionMetadataStore` reads a directory of `<name>.json` files, each holding one Collection metadata document with no wrapper. It refuses a directory in the generated `<name>/metadata.json` layout and says how to move it.
  - An external connection with no configured `metadataStore` reads `database/<connection>/metadata/<name>.json`. A `metadataStore` string names a directory in that layout, and may not point at a generated `collections/` directory. An application that still keeps metadata at `database/<connection>/collections/<name>/metadata.json` fails at startup with the steps to move it, rather than silently resolving its Collections without metadata. `resolveAppMetadataDirectory()` is exported beside `resolveAppCollectionsDirectory()`.
  - `collections generate` treats `collections/` as a cache for every connection, external ones included: it writes all three files there and never touches `metadata/`. The `orphans` result field is gone; a hand-written document whose Collection the database no longer has is reported as `unusedMetadata` and left in place. `_manifest.json` now records `generated: true`.
  - `nocobase build` copies `database/<connection>/metadata/` into `dist` instead of the `metadata.json` files under `collections/`.
  - The templates and generated applications ignore `/database/*/collections/` with one line instead of naming each managed connection. The Examples template moves its external CRM metadata to `database/externalCrm/metadata/`.

  To upgrade an application with an external connection, write each `"document"` from `database/<connection>/collections/<name>/metadata.json` to `database/<connection>/metadata/<name>.json`, point any `metadataStore` string at the new directory, delete the old `collections/` directory and regenerate it. Replace the per-connection `collections/` lines in `.gitignore` with `/database/*/collections/`. The `nocobase-app-upgrade` Skill lists the steps.

### Patch Changes

- dbf5631: `plugin inspect --json` suggests commands that exist again: `pnpm nocobase plugin register <name>` and `pnpm nocobase skills sync --package <full package name>`, with the `--dir` or `--workspace-root`/`--app` that located the application, instead of the removed `pnpm plugin:register` and `pnpm skills:sync` scripts. Hints printed by `plugin register`, `package remove` and `skills sync` name the commands the same way.

  `@refinedev/cli` and `tsc-alias` are declared as optional peers. `nocobase build` runs both, and every template already provides them in `devDependencies`; an application that does not have them now sees that from the manifest instead of from a failed build.

- Updated dependencies [02d5402]
- Updated dependencies [05af1d4]
- Updated dependencies [4adcf24]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
- Updated dependencies [ec92b20]
  - @nocobase/app-server@1.0.0-beta.27
  - @nocobase/db@1.0.0-beta.16
  - @nocobase/logging@0.1.0-beta.6
  - @nocobase/dev-config@0.1.0-beta.13

## 0.1.0-beta.5

### Minor Changes

- f6c3cd8: Let a configuration section declare validation and the fields the browser may read, and use it to hide sign-up when the server has disabled it.

  `defineAppConfig` in `@nocobase/app-server/config` now also takes an object, `{ defaults, validate, public }`, where `defaults` is an object or a function of the runtime; the function form keeps working unchanged. `validate` may be async and reports with `ctx.error(path, message, { fix })` and `ctx.warning(path, message)`. It runs when the application starts, where an error stops the start with every problem listed, on `AppConfig.reload()`, which refuses a configuration that breaks a rule and keeps the running one, and in `pnpm config:check`, which reports each problem with code `invalid`. `defineAppDatabaseConfig` now checks that `database.default` names a configured connection and that every connection sets a dialect. `checkConnections` moved from `@nocobase/app-cli` into `@nocobase/app-server/database`.

  `public` lists leaf fields, relative to the section, that are sent to the browser in a separate `public` block of the page's runtime configuration. The browser reads them with `config.public.get('<section>.<field>')` at the same path as on the server; `config.get` never returns them and, in development, throws when asked for one, and `config.public.get` warns with the published paths when asked for one that is not. Anything not listed is never sent, and an object, function or instance cannot be listed. `i18n.defaultLocale` is now always published this way; the client still falls back to `client.i18n.defaultLocale`. `pnpm config:check` lists the published values, and its `--json` result carries them under `public`.

  `@nocobase/app-plugin-authentication` adds `defineAuthConfig` for the `auth` section, which validates the `emailAndPassword` switches and publishes `emailAndPassword.enabled` and `emailAndPassword.disableSignUp`, and `useSignUpAvailable()` on the client. The templates declare `auth` with it, their `PasswordLoginForm` hides the sign-up link and `/register` redirects to `/login` while the server refuses sign-up. An existing application keeps working but must switch `server/config/auth.ts` to `defineAuthConfig({ defaults: { ... } })` for this to take effect; until then the plugin logs a warning at startup. Copy the updated `password-login-form.tsx` and `pages/auth/register.tsx` from the new template version to get the same behavior.

- d18e964: Declare environment variables on the configuration section they set, list them with `pnpm config:env`, and stop shipping environment variables nothing reads.

  `defineAppConfig` takes `env`, a map from variable to a mapping relative to the section, such as `{ APP_SERVER_PORT: envInteger('port') }`. The runtime loads these above the configuration file once the sections are known, and refuses one variable declared for two different fields. `defineAuthConfig` maps `AUTH_SECRET` itself, and the templates declare the rest in `server/config/session.ts`, `server.ts`, `app.ts`, `i18n.ts`, `snowflake.ts` and `spa.ts`. `server/environment.ts` is gone and `server/config.ts` loads only the configuration file. An existing application that keeps its own `server/environment.ts` still works, since a variable mapped twice to the same field is harmless; to move over, copy the `env` of each section file from the new template version and delete the mapping file.

  `pnpm config:env`, also in a built `dist/`, lists every variable the application reads — those its sections declare, with the configuration path each sets, and those the runtime reads itself, `APP_BASE_PATH`, `APP_CONFIG_FILE` and `NOCOBASE_STRICT_STARTUP` — and whether each is set, never its value. `--json` prints the same list. `RUNTIME_ENVIRONMENT_VARIABLES` in `@nocobase/app-server/config` names the runtime-read ones.

  `APP_NAME` is gone from the Hub's `.env.example` and from the `.env` that `create-app` writes for a Hub, which used to set it to the project directory's name: nothing read it, and an application's name follows from `APP_BASE_PATH`. The commented `API_CLIENT_*` lines are gone for the same reason. The Hub template gains a test that every variable `.env.example` names is one `config:env` lists. `pnpm build` no longer copies `DB_*`, `QUEUE_*`, `REDIS_*`, `SMTP_*`, `API_CLIENT_*` and the notification provider variables into `dist/.env`; nothing reads any of them.

### Patch Changes

- Updated dependencies [f6c3cd8]
- Updated dependencies [f3917b6]
- Updated dependencies [d18e964]
  - @nocobase/app-server@1.0.0-beta.26

## 0.1.0-beta.4

### Minor Changes

- 4e58fe3: Add `nocobase app config check` and `nocobase app config set`, run in an application as `pnpm config:check` and `pnpm config:set`, so a configuration is written by `config:init`, changed by `config:set` and verified by `config:check`.

  `config:check` loads the configuration through the application itself — its files, its environment and its code defaults — without starting it. A file that fails to parse, or a database driver that is not installed, fails here for the same reason it would fail a start. It then reports what loading alone does not show: a secret missing or still the placeholder, a `session.secret` that is regenerated at every start and so ends every session with the process, a top-level section nothing reads with the name that was probably meant, and a `${NAME}` written where it is not expanded and would be used as literal text. Databases other than SQLite are connected to, one connection each taken from the pool and handed back, without running SQL or migrating anything; `--connect` includes SQLite and `--no-connect` stays offline. Each finding carries the key and, where there is one, a command that fixes it, and the command exits non-zero on any error, or on any warning with `--strict`.

  `config:set` sets `key=value` assignments in the file the application reads, keeping its comments, and writes it once. A key under a section the application does not know is refused with the nearest known one, so a typo fails instead of being written where nothing reads it. With `--from-env` each value names an environment variable to read, so a secret stays out of the command line. After writing it loads the configuration again and reports any key an environment variable overrides.

  `config:init` now returns its `nextCommands` and, for a database other than SQLite, the `requiredSettings` still at a placeholder. On a terminal it asks for them, reading the password without echo, and tries the connection before writing. Run on an application that is already configured it leaves the file alone and reports `unchanged`, failing only when `--dialect` asks for a different database than the one configured.

  A built `dist/package.json` carries `config:check` and `config:set` scripts, and its `pnpm-workspace.yaml` sets `verifyDepsBeforeRun: false`, so running one of a deployment's own scripts never makes pnpm install first. `create-app` includes `pnpm config:check` in the `nextCommands` it returns.

  `AppConfig` gains `layers()`, which returns the code defaults and the values the application's own sources supply as separate read-only copies — the distinction a check needs to tell a known section from a misspelled one.

- 4e58fe3: Add `nocobase app config init`, which writes the configuration file an application starts from, and run it in an application with `pnpm config:init`.

  It generates `config.yml` from the application's `config.example.yml` so the example's comments reach the file people edit, fills in `auth.secret` and `session.secret`, and points `database.connections.main` at the selected dialect while leaving every other connection alone. The dialect defaults to the installed driver when there is exactly one, is asked for on a terminal when there are several, and must be given with `--dialect` in a script.

  The command installs nothing. Which dialects an application can run on is decided by the driver it depends on, so a missing one is reported with the `pnpm add` that supplies it — pinned to the range the installed `@nocobase/app-server` declares for that driver, because the newest release is not necessarily one the runtime was built against — rather than installed behind the user's back — in a deployment, where adding a driver to a built `dist` would be undone by the next build, it reports that the application has to be built again instead. Everything is validated before anything is written, so a run that reports a problem leaves the directory untouched and can simply be repeated once the driver is there.

  The three application templates now declare `@nocobase/db-sqlite`, the driver their own `server/config/database.ts` defaults to, so a new application can be configured and started without installing one first.

  `@nocobase/app-server` exports `OFFICIAL_DIALECTS` and `OfficialDialect` from `@nocobase/app-server/database`, so tooling that has to name the dialects reads the same list the runtime loads drivers from.

  The application development and deployment Skills describe the new step: how an application is configured, that the driver decides which dialects it can run on, and that a deployment writes its configuration with `pnpm config:init` inside `dist/`, from the `config.example.yml` the archive carries. The database Skill shipped with `@nocobase/db` now points at `pnpm config:init` rather than at a creation flag that no longer exists.

### Patch Changes

- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
- Updated dependencies [4e58fe3]
  - @nocobase/app-server@1.0.0-beta.25
  - @nocobase/db@1.0.0-beta.15
  - @nocobase/nb3-cli@1.0.0-beta.11

## 0.1.0-beta.3

### Minor Changes

- 8f1ead4: Add `nocobase app db doctor`, which compares stored Collection metadata with the schema behind it and deletes the records whose table is gone.

  The physical schema and the Collection metadata are two records of what exists, and they can disagree: a table dropped outside a migration leaves its metadata record behind, and from then on resolving that Collection fails — including inside the migration that would recreate it, which is how the state becomes self-sustaining. Until now nothing reported it and nothing fixed it, so the only way out was deleting rows from `__nocobase_collection_metadata` by hand, which the documentation forbids for good reason.

  `ConnectionCollections.diagnose()` walks every metadata record, reports the ones whose physical table is missing as `COLLECTION_TABLE_MISSING`, and for the rest reports whatever resolving them reports. Only a missing table is marked `orphaned`, because deleting the record is then a complete fix; every other issue means the table is there and something in it no longer matches, which a migration has to reconcile.

  `db doctor` prints what disagrees per connection and exits non-zero while anything remains. `--fix` deletes the orphaned records and leaves the rest alone, `--connection` and `--all` select connections as they do elsewhere, and `--json` carries the result. The three templates gain a `db:doctor` script.

  `runAppCollectionsDoctor` is exported for hosts that run it themselves, and the connection selection the artifact generator already had is now shared rather than duplicated.

  The migrations reference also records why `onChecksumMismatch` defaults to `warn` and when to set `error` for a connection. The default was an implicit choice in the code, leaving a reader no way to judge whether to flip it: a checksum hashes the migration's file contents, so formatting the directory changes it and `error` would then stop the application from starting; startup runs migrations, so refusing to run turns drift into an outage on an upgrade where the compiled representation hashes differently. Nothing about the behaviour changes.

- a1a8690: Expire a task lock whose holder was killed, and add `nocobase app db unlock` to inspect and release one.

  A run that is hard-killed — SIGKILL, a stopped container, a lost machine — runs no cleanup, so its lock row survived it and every later run waited out the acquire timeout and then failed, until somebody deleted the row by hand. A holder now refreshes a `heartbeat_at` column every five seconds while it works, and a lock that has not been refreshed for thirty seconds is taken over by the next run, which then continues normally. The takeover is reported through `onStaleLock` and logged by the application, because it means a previous run did not shut down cleanly. A working run is never taken over: several missed beats are tolerated, so a slow database does not hand the lock to a second run.

  The lock table gains `heartbeat_at`, added in place when the table predates it. It cannot be a migration: the lock is what every migration runs inside.

  `db unlock` reports who holds each lock — the owner, when it was taken, and its last heartbeat — and releases the ones that have stopped beating. A lock that is still beating is reported rather than released; `--force` releases it anyway, which lets a second run start beside the first. It covers the migration and the seed lock together, takes `--connection` / `--all` / `--json` like the other database commands, and needs no migration or seed directory, since startup and plugins take the same locks. The three templates gain a `db:unlock` script.

  `Migrator` and `Seeder` gain `lock()`, which reads the lock without creating its table, and `unlock(options)`. `AppDatabaseTaskOperation` gains `'unlock'`, and a task result carries `lock`, `released` and `lockReason`. The exhausted-wait message now names the last heartbeat and points at `db unlock` rather than at deleting a row by hand.

### Patch Changes

- 77d34b6: Stop a dependency install from restarting the development server mid-way, refuse a second development server for one application root, and shorten the development shutdown budget so a restart is not force-killed.

  `package.json` was handed to the file watcher as an `--include`, so an install restarted the server on its first write and again on the later ones. The server came back against a half-installed `node_modules`, and a write arriving while it was still shutting down is where the watcher escalates SIGTERM to SIGKILL — which skips releasing the migration lock. The manifest, the lockfile and the package manager's install state are now watched here instead, and the restart waits for all of them to stay quiet, so one install produces one restart.

  A second `pnpm dev` for the same application root is refused, naming the first one's process id. Nothing else caught it: the port check advances to the next free port, and the duplicate then failed on the migration lock the first server holds, before it bound anything — an error that names neither cause nor remedy. `NOCOBASE_DEV_ALLOW_MULTIPLE=true` starts one anyway, a run that only proxies a remote backend does not take the lock, and a lock left by a killed run is taken over rather than reported.

  `APP_SHUTDOWN_TIMEOUT_MS` sets the total shutdown budget: the force exit lands on it and the HTTP drain a second earlier. `pnpm dev` supplies four seconds, inside the five the watcher waits before force-killing, so a development restart shuts down on its own and releases its locks. A deployment keeps the 30 second drain and 35 second force exit, which suit a load balancer. `resolveNodeShutdownTimeouts` is exported and `StandaloneServer` carries the resolved `shutdownOptions`.

  Checksum drift now names both ways out instead of one. `db repair` was the only suggestion, and it is the wrong one whenever the edit changed what the migration does: repair records that the source and the schema agree, so using it there makes an un-applied change look applied. The CLI and the startup log now point at `db repair` for an edit that left the schema identical and at `db redo` for one that did not.

- Updated dependencies [8f1ead4]
- Updated dependencies [77d34b6]
- Updated dependencies [ffafc2a]
- Updated dependencies [a1a8690]
  - @nocobase/db@1.0.0-beta.14
  - @nocobase/app-server@1.0.0-beta.24

## 0.1.0-beta.2

### Minor Changes

- fa01814: Report migration and seed checksum drift as a warning instead of failing, and add `nocobase app db repair` to realign the recorded history.

  An executed migration or seed whose source has since changed no longer stops the run. `latest()`, `rollback()` and `run()` return the drift in a new `warnings` field, the CLI prints it, `--json` carries it, and startup logs it through the application logger. Set `onChecksumMismatch: 'error'` on a connection's `migrations` or `seeds` configuration, or at the top level, to keep refusing to run. A history record whose migration is missing from the sources entirely still fails regardless of the policy.

  `pnpm db:repair` rewrites recorded checksums to match the current sources, covering both migrations and seeds in one command. It previews before writing, prompts for confirmation unless `--force` is passed, supports `--dry-run` for inspection in CI, and conditions every write on the checksum it read, so a history changed in between fails rather than being overwritten. It never deletes a history record, so a repair cannot make an executed task run again.

- fa01814: Add `db apply` and `db reset`, and retire `migrate --fresh`.

  `nocobase app db apply` (`pnpm db:apply`) runs migrations and seeds as one plan, in the order startup runs them: each connection is migrated, then seeded. Only pending tasks run, so repeating it is safe. `nocobase app db reset` (`pnpm db:reset`) drops every managed schema object first and reruns both from empty; it asks for confirmation and requires `--force` in CI or a non-interactive terminal.

  `migrate --fresh` is removed and now exits with a pointer to `db reset`. It rebuilt the schema without reseeding, so it left the seed history cleared and no seed executed — the default connection recovered on the next startup, and a connection with `autoRun: false` did not.

  The `migrate` and `seed` commands are removed along with their template scripts; `db apply` replaces both. Running one half on its own is not a separate command, because both halves apply only what is pending: on an already-migrated database `db apply` applies seeds alone, and the one case it does not cover — migrating ahead of a deployment without seeding — can be served by a flag later without breaking anything.

  `runAppDatabaseTasks` accepts several task kinds in one plan through its `kind` option, which is what makes a reset correct across both kinds: one plan means a connection's schema is rebuilt by its migrations task before its seeds run.

- 7bde7bd: Add `nocobase app db rollback` and `nocobase app db redo`, so a migration corrected before its branch is merged can be re-run without resetting the database.

  Editing an executed migration changes nothing on its own: it is recorded as executed, so `db apply` skips it and the database keeps the schema the old source produced. Until now the only way forward was `db reset`, which drops every managed table and every row with it, or editing the history table by hand — which the documentation forbids, and which splits the two records of what exists: dropping a table without its metadata record leaves the Collection unresolvable.

  `db rollback` runs `down()` for the latest migration batch, newest first, and deletes its history records. The batch is the unit the history records, so a batch that mixed application and plugin migrations rolls back as one, and the confirmation lists every migration with the package it belongs to before anything runs. It fails having run nothing when a migration in the batch is irreversible or has no `down()`. `db redo` is that followed by `db apply`. Both are destructive in the same way and confirm the same way: CI and non-interactive terminals require `--force`, `--connection` and `--all` select connections as they do elsewhere, and `--json` carries the result. Seeds are not re-run, so rows a seed inserted into a table the batch recreates are not restored.

  `Migrator.rollback()` accepts `{ dryRun: true }`, which is what the confirmation is built from: it takes the lock, resolves the batch, rejects an irreversible one, and reports what a run would undo without running any `down`. `MigrationRollbackResult` gains `records` — the batch's history records in rollback order, carrying each migration's package — and `dryRun`. `AppDatabaseTaskOperation` gains `'rollback'`, which applies to migrations alone: a plan including seeds is refused, because seeds have no inverse.

  The three templates gain `db:rollback` and `db:redo` scripts. The migrations reference now documents re-running a corrected migration, states what `db:repair` is and is not for — it records that the schema already matches, so using it on a change the database never received leaves the schema wrong and nothing recording that — and lists each internal table with the command that maintains it.

### Patch Changes

- ca3188e: Report a connection whose Collection artifacts have never been generated as one line instead of one per expected file.

  `collections generate --check` compares the database with `database/<connection>/collections/` and reports every expected file it cannot read as `missing`. When the directory does not exist at all — the state of any application that has not run the command yet — that is three lines per Collection plus the manifest, none of which says anything the first one did not: an application with 41 Collections printed 124 of them. The result now carries `directoryExists` in check mode so the two cases can be told apart, and the command prints the count and what to run instead of the list. `--json` still carries every difference.

- Updated dependencies [fa01814]
- Updated dependencies [ca3188e]
- Updated dependencies [38e5253]
- Updated dependencies [fa01814]
- Updated dependencies [7bde7bd]
- Updated dependencies [5380642]
- Updated dependencies [ea91af0]
- Updated dependencies [3187ace]
- Updated dependencies [5380642]
- Updated dependencies [c5f4438]
- Updated dependencies [3187ace]
- Updated dependencies [38e5253]
- Updated dependencies [38e5253]
  - @nocobase/db@1.0.0-beta.13
  - @nocobase/app-server@1.0.0-beta.23
  - @nocobase/nb3-cli@1.0.0-beta.11

## 0.1.0-beta.1

### Minor Changes

- 43592e9: Expose a read-only config.get() reader and service container to migration and seed callbacks. Inject application configuration snapshots for startup and CLI database tasks and document configuration and rollback semantics.

  Restrict application database task service access to the ID generator and reuse the templates’ application factory for CLI migrations and seeds. CLI tasks share the application database manager and dispose application and scope resources without booting providers or triggering autoRun.

  Simplify createAppCommands to one options object with lazy rootDir-based runtime and application discovery and optional factory overrides.

### Patch Changes

- Updated dependencies [43592e9]
  - @nocobase/db@1.0.0-beta.12
  - @nocobase/app-server@1.0.0-beta.22

## 0.0.2-beta.0

### Patch Changes

- 5e3c802: Extract shared application development and build tooling into app-tools and runtime CLI commands into app-cli. Keep template entry points and application composition local, preserve supported commands and development restart behavior, and document customization and upgrade boundaries.

  Remove the application client and server inspection commands, their development-only CLI registration, and related guidance.

- Updated dependencies [8124b03]
  - @nocobase/nb3-cli@1.0.0-beta.10

## 0.0.1

### Patch Changes

- Extract shared application tooling from the application templates.
