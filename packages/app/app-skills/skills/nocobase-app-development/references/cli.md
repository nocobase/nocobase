# The application command line

This page is how to use the application's CLI: which command a task needs, and the rules its `--help` does not state. For a command's flags and arguments, run `pnpm nocobase <topic> <command> --help` rather than guessing; for the whole tree, `pnpm nocobase commands --json`, which lists every command registered here — built-in, the application's and each plugin's — with its source, arguments, flags, examples, and whether it takes `--json`, `--dry-run` and `--force`.

## How to invoke it

`pnpm nocobase <topic> <command>` runs the `nocobase` bin of `@nocobase/app-cli`, which this application depends on. It finds the application from the nearest `package.json` and loads `cli/plugins.ts` and `cli/commands/` itself.

Only `pnpm dev`, `pnpm build`, `pnpm start` and the quality scripts (`pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm check`, …) are scripts. Every other command is reached through `pnpm nocobase`; there is no `pnpm db:apply` or `pnpm config:init`. Older documentation that names a script alias, or an id under the `app` topic such as `nocobase app db apply`, is describing a removed layout.

Write `pnpm nocobase`, not a bare `nocobase`: a machine may have an unrelated global `nocobase` on its `PATH`, while `pnpm` resolves this application's own bin first.

## Find the command by task

| Task                                                                  | Command                                                                                                     |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Create `config.yml` for a new checkout                                | `pnpm nocobase config init` (`--dialect <name>` when several drivers are installed)                         |
| Change a configuration value, or read a secret from the environment   | `pnpm nocobase config set key=value`, `--from-env` for secrets                                              |
| Confirm the configuration before starting                             | `pnpm nocobase config check`                                                                                |
| See which environment variables the application reads                 | `pnpm nocobase config env`                                                                                  |
| Describe every variable for a deployment (`dist/variables.json`)      | `pnpm nocobase config variables`, `--out <file>` to write it                                                |
| Apply new migrations and seeds                                        | `pnpm nocobase db apply`                                                                                    |
| Undo or rerun the latest migration batch while its branch is open     | `pnpm nocobase db rollback`, `pnpm nocobase db redo`                                                        |
| Start the schema over from empty                                      | `pnpm nocobase db reset` — destructive, see below                                                           |
| Clear a checksum warning after a deliberate, schema-neutral edit      | `pnpm nocobase db repair --dry-run`, then without `--dry-run`                                               |
| Release a migration lock a killed run left behind                     | `pnpm nocobase db unlock`                                                                                   |
| Load sample data an installation skipped, in development              | `pnpm nocobase db sample`                                                                                   |
| Read the current data model                                           | the files under `database/<connection>/collections/`, see below                                             |
| Find Collection metadata that disagrees with its table                | `pnpm nocobase collections doctor`                                                                          |
| Check that client and server declare the same languages               | `pnpm nocobase locales check`                                                                               |
| Add, remove or update a plugin                                        | `pnpm nocobase plugin register`, `plugin unregister`, `plugin update`                                       |
| Check a plugin's registration without changing anything               | `pnpm nocobase plugin inspect <name> --json`                                                                |
| List or test AI employee provider models                              | `pnpm nocobase ai-employee models <service>`; `ai-employee test <service> --model <id>`                     |
| Remove a direct NocoBase package that is not a plugin                 | `pnpm nocobase package remove <package>`                                                                    |
| Refresh `.agents/skills/` after an install or upgrade                 | `pnpm nocobase skills sync`                                                                                 |
| Build for another platform, or re-check an existing `dist/`           | `pnpm build --target <platform>`; `pnpm nocobase dist retarget`, `dist check`                               |
| Deploy to a Hub                                                       | `pnpm nocobase hub deploy`, after `hub remote add` and `hub auth login` — read its `nocobase-hub-cli` Skill |
| Give the application a command line of its own, for people and agents | declare `nocobase.cli` in `package.json`, then `pnpm nocobase cli link`; see below                          |
| Pack that CLI, or the agent runner, for the application to serve      | `pnpm nocobase cli build`, `pnpm nocobase cli build --runner`                                               |

Every command listed takes `--connection <name>` or `--all` where connections apply; without either it acts on the default connection.

The `ai-employee` commands require `@nocobase/app-plugin-ai-employee/cli` in `cli/plugins.ts`. They use final application configuration without starting the application or connecting to its database, including in a built `dist/`. Read the plugin's `nocobase-app-plugin-ai-employee` Skill first: before first startup, let the user set credentials after `config check`, list real model IDs with `models`, and write the user's selection to `enabledModels`. `test` requires an explicit model and makes a paid completion request; it reports only whether the model can be called. Never ask for, read, or print credentials. For custom providers or an already initialized service's model selection, use the management page instead.

## Conventions an agent relies on

- **`--json`** prints one JSON document on stdout, success or failure, the same shape for every command: `{ schemaVersion, ok, command, status, result | error, warnings }`. `status` is `success`, `success-noop` (nothing needed changing: a dry run, or a run that found nothing to do), `partial-success` or `failure`. Read `result` on success; on failure read `error.code`, `error.suggestions` — each a `message` and, where the next step is a command, a `run` with its `command` and `args`, which names `node <dist>/cli/index.js` rather than `pnpm nocobase` in a built `dist/` — and `error.details`. Read `warnings` too, and check the exit code rather than parsing text. `NOCOBASE_CONTENT_TYPE=json` turns `--json` on for every command in a session. What the application logs while a command runs, and a command's progress, go to stderr, also under `--json`. When a command fails for a reason its message does not explain, rerun it with `NOCOBASE_CLI_DEBUG=1` to print the error behind it, redacted, on stderr; do not paste that output anywhere public without reading it.
- **Invalid usage** — a flag or argument the command rejects, or a command that does not exist — fails with `error.code` `INVALID_USAGE`, and its suggestions name the flag or command that was probably meant. Check that suggestion against the task before running it. The message names flags, arguments and allowed values but never repeats a value that was typed, since a mistyped line can carry a secret; compare it with the line you ran.
- **Exit codes** are `0` for success, `1` for a runtime failure and `2` for invalid usage; `hub deploy` and `hub upload` add `3` for a result the Hub could not confirm. Keep a non-zero exit visible in your report; do not rerun until it passes by changing flags.
- **Paths** given in a flag resolve from the current directory, as with any command line. The exception is `config init --config`, which resolves against the application root, the same way as `APP_CONFIG_FILE`. A default path a command names in its `--help`, such as the `hub deploy` archive, is inside the application.
- **Preview first.** `db apply`, `db rollback`, `db redo`, `db reset`, `db repair`, `plugin register`, `plugin unregister`, `plugin update`, `package remove` and `skills sync` take `--dry-run`: it changes nothing — it does not even create a SQLite file that does not exist yet — answers `status: "success-noop"`, and returns the plan in `result` — for the `db` commands `result.plan`, one entry per connection and kind with its `action` and the task names. Use it before any change whose effect you have not already confirmed with the user.
- **Destructive commands need `--force` outside a terminal.** `db reset`, `db rollback`, `db redo` and `db repair` ask for confirmation interactively and refuse without `--force` in CI or any non-interactive shell, which is how an agent runs them: `error.code` is `FORCE_REQUIRED` (exit 2), `error.details.plan` is exactly what the command would do, and `error.suggestions` carry the `--force` and `--dry-run` forms. Do not add `--force` on your own initiative to get past that refusal: `db reset` drops every managed table. Show the user the plan, ask, and never run it against a database whose data matters. `db unlock --force` releases a lock that is still sending heartbeats, which lets a second run start beside a live one — only do it when the user confirms the other run is gone. A command that finds the lock held fails with `DATABASE_LOCKED`; `error.details` names the holder (`lockedBy`, `heartbeatAt`, whether it `expired`), and the suggestions say whether unlocking needs `--force`. Waiting and retrying is the usual answer.
- **Do not start the application to run a command.** CLI commands work on files and the database directly; none of them needs `pnpm dev` running.

## Reading the data model

`database/<connection>/collections/` holds what the database currently resolves each Collection to — `collection.json`, `metadata.json` and `schema.json` per Collection, plus `_manifest.json` — written by `pnpm nocobase collections generate`. Read these files, and search across them, rather than inferring the model from migrations.

The directory is a local cache for every connection, external ones included: gitignored, safe to delete, and never read back. `db apply`, `db redo`, `db rollback` and `db reset` refresh it for each connection whose migrations they change, and `pnpm dev` does the same after its startup migrations; a built `dist/` never writes it. Run `pnpm nocobase collections generate` yourself only when a command ran with `--no-collections` or warned that the refresh failed, after editing an external connection's `metadata/`, or after another system changed an external connection's schema. `--check` exits non-zero when the files are out of date. Never edit them by hand or import them from a migration.

An external connection's metadata — titles, descriptions and relations its schema cannot express — is written by hand in `database/<connection>/metadata/<name>.json`, one metadata document per Collection, and committed. Edit those files, then regenerate so the cache reflects them; the command reports a document whose Collection the database no longer has as unused metadata.

## A command line of the application's own

Besides `pnpm nocobase`, an application may give the people and agents who use it a CLI of its own, such as `acme`: `@nocobase/app-cli-client` under the application's name, which signs in to the running application and runs the business commands its API publishes (`GET /api/cli/manifest`). No template declares one. To add it, put `"nocobase": { "cli": { "bin": "<command>", "displayName": "<Name>" } }` in `package.json` (the fields are in `@nocobase/app-cli`'s README: the state directory, the environment prefix, the device sign-in client id, the Skill directories it ships to runners, …) and add `@nocobase/app-cli-client` to `devDependencies`. `pnpm nocobase cli link` makes it a command in `node_modules/.bin`; `pnpm nocobase cli build` packs it into standalone tarballs in `storage/runners/dist`, which the agents plugin serves to its install script and to runners, and `cli build --runner` packs the runner (`nocobase-runner`, from `@nocobase/agent-runner`) beside it. In production a CI job builds them and mounts them into that storage; do not commit them or bake them into an image.

## The application's own commands

An application's own commands answer under the `app` topic, one file per command under `cli/commands/`. To add or change one, read [adding an application command](commands.md).

## In a built dist/

`pnpm build` writes `dist/cli/index.js`. A deployment runs `node dist/cli/index.js <topic> <command>` from any directory, or `pnpm nocobase <topic> <command>` inside `dist/`. Only runtime commands are registered there — `config`, `db`, `collections`, `locales`, `info`, the application's own commands and plugins' runtime commands. `dev`, `build`, `start`, `dist`, `plugin`, `package` and `skills` exist only in the source checkout, and so do the `hub` commands `@nocobase/hub-cli` contributes. See the `nocobase-deployment` Skill for production procedure.
