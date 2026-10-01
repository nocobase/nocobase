# @nocobase/app-cli

The NocoBase application command line, bin `nocobase`. One package carries the runtime commands a deployment runs, the plugin and Skill management commands, and the `dev` and `build` tooling. An application depends on it in `dependencies`; the tooling that only development needs is declared as optional peers, so a deployment installs none of it.

Applications are created with `pnpm create @nocobase/app`, not with this package.

## Where it runs

The bin finds the application from the nearest `package.json` above the working directory, and what that manifest says decides the command set:

| Found                                    | Location   | Commands registered                                                                    |
| ---------------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `nocobase.templateKind`                  | source     | everything: runtime, development, the application's own, and every plugin's            |
| `nocobase.buildTarget` (a built `dist/`) | deployment | runtime commands, the application's own, and plugins' `commands` but not `devCommands` |
| neither                                  | none       | `commands`, and the flag-targeted `plugin *`, `package remove` and `skills sync`       |

`NOCOBASE_APP_ROOT` names the application explicitly and leaves the working directory alone, so relative paths a command takes still resolve against where it was run. The `cli/index.js` a build writes into `dist/` passes its own location instead, which is why `node dist/cli/index.js db apply` works from any directory — a built `dist/` has no `.bin`, and a slim runtime image has no pnpm.

In a source application the bin registers the application's own `tsx` before it imports anything the application wrote, so `cli/plugins.ts` and `cli/commands/*.ts` load as they are.

## Commands

| Command                                                                    | In a deployment | Notes                                                                                                                    |
| -------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `commands`                                                                 | yes             | Every command registered where it runs; `--json` for agents                                                              |
| `info`                                                                     | yes             |                                                                                                                          |
| `config init`, `config check`, `config set`, `config env`                  | yes             | Act on the application's `config.yml`                                                                                    |
| `db apply`, `db reset`, `db repair`, `db rollback`, `db redo`, `db unlock` | yes             | Create the application without booting it                                                                                |
| `collections generate`, `collections doctor`                               | yes             |                                                                                                                          |
| `locales check`                                                            | yes             |                                                                                                                          |
| `dev`, `build`, `start`                                                    | no              | `build` passes `--target`, `--node-version` and `--tar` to the build                                                     |
| `dist retarget`, `dist check`                                              | no              |                                                                                                                          |
| `plugin register`, `plugin unregister`, `plugin inspect`                   | no              | Take `--dir`, or `--workspace-root` with `--app` in this repository                                                      |
| `plugin update`                                                            | no              | Takes `--dir`; no `--workspace-root` or `--app`                                                                          |
| `package remove`, `skills sync`                                            | no              |                                                                                                                          |
| `app <name>`                                                               | yes             | The application's own commands, from `cli/commands/`                                                                     |
| `<plugin> <name>`                                                          | plugin decides  | A plugin's commands under the topic its package name gives, from `cli/plugins.ts` or a dependency that names a CLI entry |

`tests/builtin-commands.test.ts` asserts the exact list, so adding, renaming or removing a command is a deliberate edit there.

`commands --json` is the tree as data, for an agent or script that would otherwise read every `--help`: each command's id, `source` (`builtin`, `app` or `plugin`, with the plugin's `package`), whether it is `developmentOnly`, whether it takes `--json`, `--dry-run` and `--force`, and its arguments, flags and examples, plus the topics. A flag declared with `appPath()` reports its `default` as written, with `defaultRelativeTo: "application-root"`, the way `--help` says it is relative to the application root. It reports what is registered where it runs, so in a built `dist/` it lists no development command.

`--json` prints one JSON document on stdout, success or failure, in the shape described under "Writing commands" below, and a failure also exits non-zero. Exit codes are `0` for success, `1` for a runtime error and `2` for a usage error; a command may add its own, as `hub deploy` and `hub upload` from `@nocobase/hub-cli` add `3` for a result the Hub could not confirm. `NOCOBASE_CONTENT_TYPE=json` turns it on for every command. A path given in a flag resolves from the current directory; a default path a command names in its `--help` is inside the application.

Invalid usage — a flag or argument oclif rejects, or a command that does not exist — fails with `INVALID_USAGE` and exit code `2`, and its suggestions name what was probably meant: the closest flag (`Did you mean --connection?`), command ids or topic, the command's `--help`, and `commands --json`. `src/command/distance.ts` decides what counts as close. The message names the command's own flags, arguments and allowed values but never a value that was typed, because a mistyped line can leave a secret anywhere in oclif's wording; `src/command/usage.ts` rewrites it. An oclif error a command raises itself, such as `this.error()`, is not usage: it reports `COMMAND_FAILED`.

A suggestion's `run`, and every next step a command prints, names the command line the way it runs where the command ran: `pnpm nocobase` in a source checkout, and `node <dist>/cli/index.js` by absolute path in a built `dist/`, which has no `.bin` and whose runtime image has no pnpm. `src/command/invocation.ts` decides it.

### Topics are a flat namespace

Built-in commands, the application's commands and every plugin's commands share one tree, and a collision fails when the tree is assembled rather than one side silently winning. A plugin's topic is its package name without the scope and `app-plugin-` prefix — `@nocobase/app-plugin-workflow` mounts under `workflow` — or, for a package that is not an application plugin, without its `-cli` suffix, so `@nocobase/hub-cli` mounts under `hub`. The built-in commands avoid every official plugin name, which is why the localization check is `locales check` rather than `i18n check`. `RESERVED_TOPICS` in `src/runtime/builtin.ts` is the list a plugin may not take. The application's own commands all live under `app`.

The `-cli` rule lets two packages derive one topic: `@nocobase/hub-cli` and `@nocobase/app-plugin-hub` both give `hub`. That is deliberate. hub-cli deploys an application to a Hub and the Hub plugin runs inside the Hub, so one application has no reason to hold both, and one that did would fail at assembly with both packages named.

### Commands are found by directory

A file's path below a commands directory is its command id: `src/commands/db/apply.ts` answers to `db apply`, and an application's `cli/commands/orders/sync.ts` answers to `app orders sync`. Files and directories starting with `_`, and directories named `lib`, are skipped so a command can keep helpers beside it; each command file default-exports one oclif `Command` class.

A built-in command is dispatched with nothing else loaded. Only a run that needs the whole tree — help, `commands`, an `app` command, a plugin's command — imports the application's `cli/plugins.ts` and `cli/commands/`, so `pnpm install` running `nocobase skills sync`, or `plugin register` repairing a broken `cli/plugins.ts`, never depends on every plugin's CLI entry importing.

Plugins are not discovered. `cli/plugins.ts` lists them explicitly, because the array order is both command registration order and hook order, and because a plugin installed is not a plugin enabled. `pnpm nocobase plugin register` writes the entry.

### Packages that contribute commands by being a dependency

A direct dependency whose own `package.json` names a CLI entry in `nocobase.cli.entry`, a subpath of its `exports` such as `./cli`, contributes that entry's `defineCliPlugin` result without an entry in `cli/plugins.ts`. `@nocobase/hub-cli` gives an application `hub deploy` and `hub upload` this way. Only the application's own `dependencies`, `devDependencies` and `optionalDependencies` in the `@nocobase/` scope count, the rule `skills sync` follows, and each is read from the application's `node_modules`: a transitive dependency contributes nothing, and removing the dependency removes the commands. Such a package contributes commands only; build and dev hooks run only for plugins in `cli/plugins.ts`, and a package listed there as well is taken from there.

Finding these packages reads JSON and imports nothing. A run imports an entry only when it needs that package's commands — a command under its topic, help for the whole tree, or `commands` — and every other run lets the package claim its topic unloaded, so a collision is reported whichever command runs. A built-in command dispatched on its own never reads them. A package the application requires but nobody installed is reported as `PACKAGE_NOT_INSTALLED` when its topic is run, with `pnpm install` as the suggestion, because its topic is known from its name alone. `src/runtime/cli-packages.ts` implements this.

## Writing commands

Every command — built-in, an application's, or a plugin's — extends `AppCommand` from the package root:

| Export                                | What it is                                                                                                                                                                                                                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppCommand`                          | The base class. `this.rootDir` is the application root; `this.withApp(async ({ app, env }) => …)` creates the application, runs the callback, and always shuts it down and destroys its runtime; `this.setStatus()` marks a success as `success-noop` or `partial-success` |
| `CommandError`                        | What `run()` throws on failure: `new CommandError(message, { code, suggestions, details, exit })`                                                                                                                                                                          |
| `appPath({ description, default })`   | A path flag whose value arrives absolute: a typed value from the current directory, the default from the application root                                                                                                                                                  |
| `defineCliPlugin`, `defineCliPlugins` | A plugin's `cli/index.ts`, and an application's `cli/plugins.ts`                                                                                                                                                                                                           |
| `bindAppCommand` from `./testing`     | A command pinned to a fixture application, for tests                                                                                                                                                                                                                       |

`run()` returns the result and throws `CommandError` on failure. `AppCommand` provides `--json` and prints one document either way:

```json
{ "schemaVersion": 1, "ok": true, "command": "db apply", "status": "success", "result": {}, "warnings": [] }
{ "schemaVersion": 1, "ok": false, "command": "db apply", "status": "failure", "error": { "code": "CONNECTION_FAILED", "message": "…", "suggestions": [], "details": {} }, "warnings": [] }
```

A command writes text for people with `this.log`, which `--json` silences, progress with `this.logToStderr`, which stays on stderr under `--json`, and warnings with `this.warn`, which `--json` collects into `warnings`. A `CommandError`'s `cause` is kept off the printed error and shown, redacted, only under `NOCOBASE_CLI_DEBUG`. It never calls `this.exit()`, `this.logJson()` or `console.log`: `AppCommand` refuses the first two, and the shared ESLint preset refuses all three in `cli/`. It does not use `this.error()` either, which reports `COMMAND_FAILED` with oclif's default exit `2`. What the application logs while a command runs goes to stderr. The runner closes a runtime a command left open and names the command on stderr; a command that uses `withApp()` never triggers it. A failure to put the application away after `withApp()` is a warning, and never changes the command's outcome.

The root entry is kept free of the server runtime and the optional peers, because every plugin's `cli/index.ts` imports it whenever the command tree is assembled; `tests/deployment-imports.test.ts` holds it there. The `nocobase-app-development` and `nocobase-plugin-development` Skills carry the full authoring guide.

## Plugin contract

`@nocobase/app-cli` exports `defineCliPlugin()` and `defineCliPlugins()`:

```ts
import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';

import Sync from './sync.ts';
import Build from './build.ts';

const cliPlugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-audit-log',
  description: 'Manage audit log exports.',
  commands: { sync: Sync },
  devCommands: { build: Build },
  buildHooks: {
    afterServerBuild: [
      {
        label: 'Build audit artifacts',
        command: ['pnpm', 'nocobase', 'audit-log', 'build'],
      },
    ],
  },
});

export default cliPlugin;
```

`commands` run wherever the application runs; `devCommands` only make sense in a source checkout and are left out of a built `dist/`. Keep a command module light — import the heavy work inside `run()` — because help loads every command class.

A command name nested with `:`, such as `export:csv`, sits in a nested topic, `audit-log export`. `topics: { export: 'Export audit logs.' }` gives that topic its line in `--help`; without it the topic borrows one of its commands' summaries. A described topic must have a command under it.

`buildHooks` attach to `beforeBuild`, `afterClientBuild`, `afterServerBuild` or `afterBuild`, and `devHooks` to `beforeDev`. `build` and `dev` run inside the assembled CLI, collect the hooks from the registered plugins there, and hand them to the build and dev scripts in `NOCOBASE_CLI_HOOKS`; a script started any other way refuses to run rather than silently skipping them.

## Plugin and Skill management

`plugin register` puts every plugin in `dependencies`, including client-only plugins and ones installed with `--disabled`, so the plugin reaches a deployment's dependency set. Registering again moves an old `devDependencies` declaration into `dependencies`; without `--version` an ordinary application keeps the declared range. `--no-install` fixes the manifest without running the package manager, leaving the lockfile to the caller. The client and server composition roots are edited with the application's own TypeScript and Prettier, so the edit is formatted the way the application formats itself, and neither being absent fails the registration.

`plugin update` upgrades one plugin, given by full name or short name, or every registered plugin when no name is given, and then synchronizes its Skills.

`skills sync` scans the `@nocobase/*` packages the application declares directly in `dependencies`, `devDependencies` and `optionalDependencies`, plus the registered plugins, and copies their Skills into `.agents/skills/`. `--package @nocobase/app-skills` limits it to one package and `--plugin workflow` to one registered plugin. It records which package each Skill came from in `.agents/.skills-sync.json`, so a Skill whose package is gone is removed, and mirrors each Skill into `.claude/skills/` as a relative symbolic link, because Claude Code reads only `.claude/skills/`. A Skill an application wrote itself, without the `nocobase-` prefix, is never touched, and a `nocobase-` name already taken by a real directory is an error rather than an overwrite.

`package remove` uninstalls a directly declared package with the application's package manager and removes the Skills it synchronized; for a plugin it runs the whole `plugin unregister` flow. `--dry-run` prints the plan without changing anything.

`--workspace-root` selects an application inside this monorepo and writes `workspace:^` ranges; without it, plugins resolve from the application's own `node_modules`. `plugin inspect` reads the static registration surface only; it is not a substitute for running, testing or building the application.

## Application commands

The application's runtime and `createApp` load by convention from `server/runtime` and `server/app` below the application root, preferring `.ts` and falling back to `.js` when the TypeScript file is absent; the runtime module default-exports its definition and the application module exports `createApp(runtime)`. Database commands create the application, register providers and reuse its database manager without calling `boot`/`start` or triggering autoRun, and dispose everything when they finish or fail. Other commands load only the runtime they need.

## Development and build tooling

`dev` supervises development: `.env` and `.env.local` changes restart every development process, including Vite, and `config.yml` changes restart only the server. `build` produces `dist/client`, `dist/server`, `dist/cli` and the deployment's `dist/package.json`, installs its production dependencies, retargets native modules and verifies that everything the server, database and CLI code imports is declared. Vite configuration imports `createDevProxy` from `@nocobase/app-cli/dev/proxy`.

The scripts live under `src/tools/scripts/` and run in a child process with the application root in `NOCOBASE_TOOL_ROOT`. The scripts in `dist/package.json` are `start` and `nocobase`, the second because a deployment has no `.bin` to resolve the bin from.

### What the host application must provide

These are optional peers: a deployment does not need them, and every template declares them in `devDependencies`. None of them may be imported at module top level by anything a runtime command loads.

| Package                | Used by                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `vite`                 | `dev`, and `build` through it                                                       |
| `tsx`                  | loading the application's TypeScript, and `dev` to run the server                   |
| `typescript`           | `build` through `pnpm exec tsc`, and parsing `server/plugins.ts` without running it |
| `prettier`             | formatting the composition roots `plugin register` edits                            |
| `tar`                  | `build --tar`                                                                       |
| `@refinedev/cli`       | `build`, which runs `refine build` for the client                                   |
| `tsc-alias`            | `build`, which rewrites server path aliases                                         |
| `@nocobase/dev-config` | `build`, for the database manifests                                                 |

`typescript` is shared on purpose: a split lets the application compile syntax the plugin-watch parser then fails on, and the failure is silent — plugin sources simply stop triggering a restart. `pnpm` and `npm` come from the environment.

When a script starts spawning something new, add it here and declare it. Nothing else catches the omission: it resolves in this repository and in any application generated from a template, because both already install it, and is missing only in an application that does not.

## Development

```bash
node ./bin/run.js --help                 # runs the sources directly; Node 24 strips the types
pnpm --filter @nocobase/app-cli check    # lint, format, typecheck, test and build
```

`bin/run.js` loads `src/` when `src/runtime` exists and `dist/` otherwise, because Node refuses to strip types inside `node_modules`. `NOCOBASE_CLI_USE_DIST=1` forces `dist/` from a source checkout to check the published shape, and `NOCOBASE_CLI_DEBUG=1` prints, from source or from `dist/`, the redacted error chain behind a failure and oclif's own stack traces.

oclif's `explicit` discovery loads `commands.target` by file path, so the assembled command map cannot be handed to `Config.load` directly: the runner writes it into `src/runtime/command-store.ts` and `src/runtime/registry.ts` reads it back. The store hangs off a global symbol rather than a module-level binding because the writer and reader do not always reach it through the same module instance, and a module-level binding would leave the registry reading an empty tree rather than failing.

## Publication

Only `bin/` and `dist/` are published. The application supplies the shared `@nocobase/app-server` and `@nocobase/db` peers, and in development the optional peers listed above.
