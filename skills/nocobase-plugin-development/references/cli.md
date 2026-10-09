# Plugin CLI Contributions

Read this reference when a plugin must add commands to an App's `pnpm nocobase` tree or run plugin-owned commands at defined points in the App build or development startup.

This reference describes `@nocobase/app-cli` 1.0.0-beta.0 and later. When the App or plugin you work in depends on an earlier version, follow the `AGENTS.md` and Skills that version installed instead.

CLI is an explicit composition surface alongside Client and Server. A plugin may contribute any subset of `./client`, `./server`, and `./cli`; the presence of one never implies another.

## Command ownership and boundaries

An App CLI assembles three command sources:

| Command path                            | Owner                                                                |
| --------------------------------------- | -------------------------------------------------------------------- |
| `config *`, `db *`, `plugin *`, `dev`, `build`, and the other built-in commands | `@nocobase/app-cli`                                                  |
| `app *`                                                                          | The App's `cli/commands/`, one file per command                      |
| `<plugin-topic> *`                                                               | A plugin exported through `./cli` and registered in `cli/plugins.ts` |

Use plugin CLI commands for work a person or CI invokes explicitly, such as validating static declarations, generating artifacts, or a one-shot maintenance step against the App's database. The plugin declaration is imported while the command tree is assembled, before any App exists; a command that needs the App creates it with `withApp()` when it runs, as described below. Work that users trigger while the App is serving belongs behind authenticated Server APIs, Services, or Jobs, not in a command.

Topics share one flat namespace. A plugin's topic is its package name without the scope and `app-plugin-` prefix — `@nocobase/app-plugin-demo` mounts under `demo` — so it needs no declaration and cannot collide with another plugin. The built-in topics avoid every official plugin name; a plugin whose name is a built-in topic or top-level command (`RESERVED_TOPICS` in `packages/app/app-cli/src/runtime/builtin.ts`) fails assembly. Command keys are lower-case kebab-case and may use colon-separated nesting: `artifact:build` becomes `nocobase demo artifact build`.

<!-- command-authoring:start -->

## Write the command

Every command extends `AppCommand` from `@nocobase/app-cli` (1.0.0-beta.0 or later). It is an oclif `Command` with the application wired in and one output contract.

Choose what the command reaches for:

| The command needs                                  | Use                                                                        |
| -------------------------------------------------- | -------------------------------------------------------------------------- |
| Files in the application                           | `this.rootDir`, the application root the runner located; nothing is loaded |
| Configuration, paths, the environment, or services | `await this.withApp(async ({ app, env }) => { … })`                        |
| The full application lifecycle                     | `await app.start()` inside the `withApp()` callback                        |

`withApp()` creates the application from `server/app`, runs the callback, then shuts the application down and destroys its runtime, whether the callback returns or throws. A failure to shut down is a warning: it never turns work that succeeded into a failure, which would invite a rerun that repeats it. It registers and starts nothing: call `app.registerProviders()` to resolve services, and `app.start()` only when the command needs every provider running, because starting also starts workers and schedules. `app.config` and `app.paths` (`root()`, `storage()`, `database()`) need neither. `app` is valid only inside the callback; return what the command needs from it.

### Output

`run()` returns the command's result and throws `CommandError` when it fails. `AppCommand` provides `--json` and turns either into one document on stdout:

```json
{
  "schemaVersion": 1,
  "ok": true,
  "command": "app orders export",
  "status": "success",
  "result": { "exported": 42 },
  "warnings": []
}
```

```json
{
  "schemaVersion": 1,
  "ok": false,
  "command": "app orders export",
  "status": "failure",
  "error": {
    "code": "NO_ORDERS",
    "message": "There are no orders to export.",
    "suggestions": [],
    "details": { "from": "2026-09-01" }
  },
  "warnings": []
}
```

| To                        | Write                                                                   | Without `--json`                   | With `--json`                |
| ------------------------- | ----------------------------------------------------------------------- | ---------------------------------- | ---------------------------- |
| Tell a person the result  | `this.log(text)`                                                        | stdout                             | nothing                      |
| Give a program the result | `return { … }`                                                          | nothing                            | `result`                     |
| Report progress           | `this.logToStderr(text)`                                                | stderr                             | stderr                       |
| Warn                      | `this.warn(text)`                                                       | stderr                             | `warnings`                   |
| Fail                      | `throw new CommandError(message, { code, suggestions, details, exit })` | message and suggestions, on stderr | `error`, and a non-zero exit |

- `code` is a stable UPPER_SNAKE name a caller branches on. `suggestions` are strings or `{ message, run: { command, args } }`; give `run` when the next step is a command. For a command of this CLI, `run: this.cliCommand(['db', 'apply'])` names it the way it runs where the command runs: `pnpm nocobase` in a source checkout, `node <dist>/cli/index.js` in a built `dist/`, which has no pnpm. `details` is plain data the caller needs to act on. `exit` defaults to `1`; use `2` for invalid usage.
- `status` is `success` unless the command calls `this.setStatus('success-noop')` — for a dry run, or a run that found nothing to do — or `this.setStatus('partial-success')`; a failure is always `failure`.
- The result is a public contract that callers and scripts come to rely on: declare its type, keep it to plain data, and never include a secret or a large text.
- Do not call `this.exit()`, `this.logJson()` or `console.log`. Each puts something on stdout the document does not account for; `AppCommand` refuses the first two, and the shared ESLint preset refuses all three in `cli/`. Do not use `this.error()` either: it reports `COMMAND_FAILED` with oclif's default exit `2`, which reads as invalid usage.

Records the application logs while a command runs go to stderr, so stdout carries only the command's own output. Progress stays on stderr under `--json` too, so a long command does not go quiet for the agent that asked for JSON.

### Logs and debugging

- A `CommandError`'s `cause` is never printed with it: the message is written to be safe anywhere, and the error behind it may quote a request, a response or an environment value. `NOCOBASE_CLI_DEBUG=1` prints that chain, with stacks and redacted, to stderr, for any command.
- A record that belongs in the application's log — something an operator looks for later — goes through the application's own logger inside `withApp()`: call `app.registerProviders()`, then `app.container.resolve(loggingToken).getLogger('<topic>')` with `loggingToken` from `@nocobase/app-server/logging`. It lands in the application's log files, redacted and rotated like the server's records, and on stderr.

### Paths

Declare a path flag with `appPath({ description, default })`. The command receives an absolute path: a value the user typed resolves from the current directory, and the default resolves from the application root, wherever the command was run. Do not resolve it again, and do not use `process.cwd()` for application files.

### Make it discoverable

`pnpm nocobase commands --json` lists every command with its summary, arguments and flags, and marks the ones that take `--dry-run` and `--force`; an agent reads it before choosing a command. Give every flag a description, and use the conventional names: `dry-run` for a preview that changes nothing and answers `success-noop` with the plan in `result`, and `force` for proceeding past a confirmation. A command that refuses without `force` outside a terminal throws `CommandError` with code `FORCE_REQUIRED`, exit `2`, the plan in `details`, and both forms in `suggestions`. Lead the `examples` with the safe form — `--json`, `--dry-run` — rather than `--force`.

### Keep the module cheap

The command tree is assembled for `--help` too, so every command module is imported before any command runs. Keep top-level imports to `@nocobase/app-cli`, `@oclif/core` and Node built-ins, and load anything heavy with `await import()` inside `run()`.

<!-- command-authoring:end -->

### Test

`@nocobase/app-testing/cli` runs a command without the runner:

```ts
import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';

const Bound = bindAppCommand(OrdersExport, {
  rootDir: fixtureRoot,
  id: 'app:orders:export',
});
const run = await runAppCommand(Bound, ['--dry-run', '--json']);

expect(run.json()).toMatchObject({
  ok: true,
  command: 'app orders export',
  status: 'success-noop',
});
```

`bindAppCommand()` pins the command to a fixture application, the way the runner would point it at the one it located; `id` is the id the runner would give it, colon-separated, so the document names the command. Pass `loadRuntime` and `createApp` as well to replace the application with a stub. `runAppCommand()` returns what `run()` returned as `result`, what escaped it as `error`, the `exitCode`, the captured `stdout` and `stderr`, and `json()` for the `--json` document. Assert on those rather than on printed text.

A command that opens the real application needs isolated databases and storage too. Use `createTestAppConfig()` and `bindTestAppCommand()` from the same entry. The fixture runtime must register the plugin and load `configPath`. For a TypeScript fixture under `tests/fixtures/app`, import its composition roots explicitly so Vitest resolves their `.js` specifiers to source; the conventional loader uses Node and otherwise needs compiled JavaScript or an active TypeScript loader. A custom `loadRuntime` must pass the test configuration itself:

```ts
// Inside tests/cli/orders-export.test.ts, with OrdersExport imported from the plugin's CLI source.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import { bindTestAppCommand, createTestAppConfig, runAppCommand } from '@nocobase/app-testing/cli';
import { expect } from 'vitest';
import runtime from '../fixtures/app/server/runtime.ts';
import { createApp } from '../fixtures/app/server/app.ts';

const fixtureRoot = fileURLToPath(new URL('../fixtures/app', import.meta.url));
const config = await createTestAppConfig({
  config: { auth: { secret: 'test-only-auth-secret-at-least-32-characters' } },
});
try {
  const Bound = bindTestAppCommand(OrdersExport, {
    rootDir: fixtureRoot,
    id: 'orders:export',
    config,
    createApp,
    loadRuntime: () => resolveStandaloneAppRuntime(runtime, {
      rootDir: fixtureRoot,
      configPath: config.path,
      env: { APP_STORAGE_DIR: path.join(config.directory, 'storage') },
      consoleLogStream: 'stderr',
    }),
  });
  const run = await runAppCommand(Bound, ['--dry-run', '--json']);
  expect(run.json()).toMatchObject({ ok: true, status: 'success-noop' });
} finally {
  await config.dispose();
}
```

Put the configuration and run inside a test, provision every connection it writes, and direct command output files into the temporary directory too. The configuration fixture provisions databases; it does not start an application, apply migrations itself or redirect arbitrary file writes. Prepare schema and records before a command that assumes an installed database; `app.start()` installs with auto-run enabled, but `app.registerProviders()` alone does not.

## Example command

```ts
// cli/greet.ts
import { AppCommand } from '@nocobase/app-cli';
import { Args, Flags } from '@oclif/core';
import type { Command, Interfaces } from '@oclif/core';

export interface DemoGreetResult {
  readonly message: string;
}

export default class DemoGreet extends AppCommand {
  static override summary = 'Print a greeting.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %> world',
    '<%= config.bin %> <%= command.id %> world --json',
  ];

  static override args: {
    target: Interfaces.Arg<string, Interfaces.CustomOptions>;
  } = {
    target: Args.string({ description: 'Who to greet.', required: true }),
  };

  static override flags: {
    loud: Interfaces.BooleanFlag<boolean>;
  } = {
    loud: Flags.boolean({ default: false, description: 'Upper-case the greeting.' }),
  };

  public async run(): Promise<DemoGreetResult> {
    const { args, flags } = await this.parse(DemoGreet);
    const message = flags.loud ? `HELLO, ${args.target.toUpperCase()}!` : `Hello, ${args.target}.`;
    this.log(message);
    return { message };
  }
}
```

Use `<%= config.bin %>` and `<%= command.id %>` in examples so help reflects the actual assembled binary and path. Explicit `args`, `flags`, `examples` and result types matter because plugin packages emit declarations with `isolatedDeclarations`; type each flag precisely, such as `Interfaces.BooleanFlag<boolean>`, because a broad `Interfaces.FlagInput` loses the parsed type.

## Declare the CLI plugin

Statically import command classes and pass them to `defineCliPlugin()`:

```ts
// cli/index.ts
import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';

import DemoArtifactBuild from './artifact-build.ts';
import DemoGreet from './greet.ts';

const cliPlugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-demo',
  description: 'Commands for the Demo plugin.',
  commands: {
    greet: DemoGreet,
  },
  devCommands: {
    'artifact:build': DemoArtifactBuild,
  },
});

export default cliPlugin;
```

`commands` run wherever the App runs, including its built `dist/`. `devCommands` are for work that only makes sense in a source checkout — compiling or validating sources — and are left out of `dist/`, where those sources and the development tooling are not installed. A key may appear in only one of the two.

The definition validates the scoped package name, an optional `topic` (which must equal the derived one), command keys, command classes, and hook stages. A plugin may provide hooks without commands. A CLI definition with neither commands nor hooks is allowed but warns because registering it has no effect.

## Export and publish the entry

Expose the source and compiled forms of `./cli`:

```json
{
  "exports": {
    "./cli": {
      "types": "./cli/index.ts",
      "import": "./cli/index.ts"
    }
  },
  "publishConfig": {
    "exports": {
      "./cli": {
        "types": "./dist/cli/index.d.ts",
        "import": "./dist/cli/index.js"
      }
    }
  },
  "peerDependencies": {
    "@nocobase/app-cli": "workspace:^",
    "@oclif/core": "^4.14.0"
  }
}
```

Follow the repository catalog and peer-dependency rules when the current workspace range changes; do not copy the example version blindly. Both packages are runtime contracts for the contributed entry, and one compatible oclif major keeps parsing and help behavior consistent. Ensure `cli/` is compiled into the published `dist` and the package `files` includes that output.

## Register the explicit App composition root

An App owns `cli/plugins.ts`:

```ts
import {
  defineCliPlugins,
  type AppCliPlugins,
} from '@nocobase/app-cli';
import demo from '@nocobase/app-plugin-demo/cli';

const cliPlugins: AppCliPlugins = defineCliPlugins([demo]);

export default cliPlugins;
```

`pnpm nocobase plugin register demo` detects the exact `exports["./cli"]` entry and adds this import and array item. A plugin with no `./cli` export is skipped. `--disabled` installs the dependency but skips Client, Server, and CLI wiring; there is no persistent `nocobase.plugins.enabled` flag that later discovers the contribution. The explicit composition files are the active registration state.

Array order is contribution order. It controls command registration and, within each stage, build and dev hook execution. Removing the import and item removes that plugin's CLI contribution.

All plugin packages are recorded in the App's `dependencies`, including Client-only and disabled packages, so deployment dependency resolution is consistent. Registration removes a duplicate declaration from `devDependencies`. It does not create `package.json#nocobase.plugins`; unregistration only cleans an old entry there when a legacy manifest already contains one.

The App has no `cli/index.ts`. `pnpm nocobase` runs the `nocobase` bin of `@nocobase/app-cli`, which finds the App from the nearest `package.json`, imports `cli/plugins.ts` and `cli/commands/` when it needs the whole command tree, and runs a built-in command without importing either. In a built `dist/`, `node dist/cli/index.js` — an entry the App build writes — runs the same CLI without the development commands.

## Declare build and dev hooks

A CLI plugin can attach commands to App lifecycle stages:

```ts
const cliPlugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-workflow',
  devCommands: { check: WorkflowCheck, build: WorkflowBuild },
  buildHooks: {
    afterServerBuild: [
      {
        label: 'Build workflow artifacts',
        command: [
          'pnpm',
          'nocobase',
          'workflow',
          'build',
          '--resource-root',
          './dist/server/workflows',
        ],
      },
    ],
  },
});
```

`devHooks` takes the same shape for the `beforeDev` stage. The Workflow plugin declares none: outside production its loader compiles `server/workflows` on demand, so a build before `pnpm dev` would only slow every start.

Choose a stage by what exists when the hook runs:

| Stage              | Available state                                                            |
| ------------------ | -------------------------------------------------------------------------- |
| `beforeBuild`      | `dist` has just been cleared and is empty                                  |
| `afterClientBuild` | `dist/client` exists                                                       |
| `afterServerBuild` | `dist/client` and `dist/server` exist and server paths have been rewritten |
| `afterBuild`       | The complete deployment artifact and installed dependency tree exist       |
| `beforeDev`        | The long-running development processes have not started                    |

There is only one dev stage because concurrent client and server dev processes do not have a meaningful shared “after” point.

A hook `command` is a non-empty array containing an executable and its arguments. The App spawns it directly without a shell, so arguments containing spaces need no quoting, while `&&`, pipes, redirects, globs, and `FOO=value` prefixes do not work. Declare multiple hooks for ordered commands or call a dedicated script. The working directory is the App root.

Hooks run in `cli/plugins.ts` order and then declaration order. One failure stops the pipeline. Unknown stage names throw during CLI assembly so a typo cannot silently omit required output.

`nocobase build` and `nocobase dev` run inside the assembled CLI, collect the hooks from the registered plugins there, and hand them to the build and dev scripts in `NOCOBASE_CLI_HOOKS`. A script started any other way fails rather than running without hooks, because continuing would produce an apparently successful build with missing artifacts.

## Development-only commands

A plugin puts commands that need its sources or development tooling in `devCommands`; they are registered in a source checkout and left out of the built `dist/`.

An App's own commands in `cli/commands/` are compiled with the server and always registered, so they must run from a deployment. The dependency check at the end of `nocobase build`, also available as `nocobase dist check`, fails when one imports a package the deployment does not declare.

## Plugin management commands

Use the App's CLI for normal lifecycle work:

| Command                             | Current effect                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm nocobase plugin register <name>`       | Installs the plugin into `dependencies`, wires each exported `./client`, `./server`, and `./cli` root, and synchronizes shipped Skills unless `--no-skills` is set |
| `pnpm nocobase plugin inspect <name> --json` | Reads static dependency, explicit composition, and Skill facts without changing files                                                                              |
| `pnpm nocobase plugin unregister <name>`     | Removes explicit roots, cleans dependency and legacy metadata, removes synchronized Skills, and uninstalls unless `--no-install` is set                            |
| `pnpm nocobase plugin update [name]`         | Updates one or all explicitly registered plugin packages and then synchronizes Skills                                                                              |
| `pnpm nocobase skills sync`                  | Synchronizes Skills from direct NocoBase dependencies and explicitly registered plugins without upgrading packages                                                 |
| `pnpm nocobase package remove <package>`     | Removes a direct NocoBase package and its synchronized Skills; plugin packages reuse full unregistration                                                           |

Prefer `--dry-run --json` when an Agent needs a plan. Every dry run answers `success-noop`, because it changes nothing. If an uninstalled plugin is requested, register dry-run returns `result.state: "requires-installation"`, because it cannot inspect exports until the package exists; install it and rerun to compute the wiring plan. A plan that needs a manual edit says so in `result.plan`. Read the JSON `ok` and `status` fields, preserve nonzero failure exits, and treat `success-noop` and `partial-success` as distinct outcomes.

`plugin inspect` proves only that readable static registration surfaces agree. It does not execute commands or hooks, start Runtime contributions, evaluate permissions, test behavior, or replace package and App validation.

From the repository root, pass `--workspace-root .`: the command selects `app-template-default` unless `--app` is supplied, resolves plugin packages from workspace directories, and records `workspace:^`. A generated App runs the same implementation from its own directory, resolves installed packages from `node_modules`, and keeps its installed version range.

## Verification

- Run the plugin's focused lint, typecheck, tests, and build; include a test that imports the production `./cli` definition and asserts the real command or hook contract, and a test that runs each command through `bindAppCommand`.
- Register the plugin in a target App and verify the exact `cli/plugins.ts` import and array entry.
- Run `pnpm nocobase <topic> --help`, the command's normal path, its JSON path when offered, invalid input, and a representative failure.
- For hooks, run the affected App build or dev startup and verify the expected artifact or behavior at the selected stage.
- Build the target App and run `node dist/cli/index.js <topic> --help` to confirm that `commands` are present and `devCommands` are absent in the deployment.

Current implementation and maintained examples, in the `nocobase/nocobase3` repository:

- CLI plugin types (`packages/app/app-cli/src/plugins/types.ts`)
- CLI plugin validation (`packages/app/app-cli/src/plugins/define.ts`)
- CLI assembly (`packages/app/app-cli/src/runtime/assemble.ts`)
- CLI example plugin (`packages/examples/app-plugin-cli-example/cli/index.ts`)
- Default Template CLI composition (`packages/templates/app-template-default/cli/plugins.ts`)
- CLI runner and App location (`packages/app/app-cli/src/runtime/run.ts`, `packages/app/app-cli/src/runtime/location.ts`)
- Plugin registration implementation (`packages/app/app-cli/src/lib/plugin-registration.ts`)
- Skills synchronization implementation (`packages/app/app-cli/src/lib/skills-sync.ts`)
