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

Topics share one flat namespace. A plugin's topic is its package name without the scope and `app-plugin-` prefix — `@nocobase/app-plugin-demo` mounts under `demo` — so it needs no declaration. The scope is not part of the topic: `@acme/app-plugin-reports` and `@other/app-plugin-reports` both claim `reports`, and CLI assembly rejects that collision. Check existing plugin topics before choosing a package name; the optional `topic` field cannot rename the derived topic. The built-in topics avoid every official plugin name; a plugin whose name is a built-in topic or top-level command (`RESERVED_TOPICS` in `packages/app/app-cli/src/runtime/builtin.ts`) fails assembly. Command keys are lower-case kebab-case and may use colon-separated nesting: `artifact:build` becomes `nocobase demo artifact build`.

## Write the command

A plugin command is written exactly like an application command: extend `AppCommand`, use `withApp()` when it needs the App, return a typed result for `--json`, and keep the module cheap to import. Follow [Write the command](../../nocobase-app-development/references/commands.md#write-the-command) in the application Skill, including its output, logging, path and discoverability rules. What differs for a plugin is where the class is registered (`defineCliPlugin()` below, not a file under `cli/commands/`) and that the topic is derived from the package name.

### Test

Use `@nocobase/app-testing/cli` from the plugin's `devDependencies`. It re-exports the command helpers so plugin tests share the same testing entry as their Server, database and Client fixtures. Save the `DemoGreet` command below as `cli/greet.ts`, and place this test in `tests/cli/greet.test.ts` under the Node Vitest project:

```ts
import { fileURLToPath } from 'node:url';

import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import { expect, it } from 'vitest';

import DemoGreet from '../../cli/greet.js';

const Bound = bindAppCommand(DemoGreet, {
  rootDir: fileURLToPath(new URL('../../', import.meta.url)),
  id: 'demo:greet',
});

it.each([
  { args: ['world'], message: 'Hello, world.' },
  { args: ['world', '--loud'], message: 'HELLO, WORLD!' },
])('returns the greeting for $args', async ({ args, message }) => {
  const run = await runAppCommand(Bound, [...args, '--json']);

  expect(run.exitCode ?? 0).toBe(0);
  expect(run.json()).toMatchObject({
    ok: true,
    command: 'demo greet',
    status: 'success',
    result: { message },
  });
});

it('rejects a missing target', async () => {
  const run = await runAppCommand(Bound, ['--json']);

  expect(run.exitCode).toBe(2);
  expect(run.json()).toMatchObject({ ok: false, status: 'failure' });
});
```

`bindAppCommand()` and `runAppCommand()` behave as [the application Skill describes](../../nocobase-app-development/references/commands.md#test).

A successful run leaves `exitCode` undefined, meaning zero; normalize it with `run.exitCode ?? 0`. Under `--json`, a handled failure is represented by its nonzero exit code and JSON error envelope, so checking `run.error` alone can miss it.

This command only parses arguments and returns a greeting, so it needs neither a started App nor a database. A command that writes files needs a temporary fixture root and assertions on the resulting files; a dry run must leave them unchanged. A command that opens an App uses `createTestAppConfig()` and `bindTestAppCommand()` from the same entry, a fixture App that registers the real Server plugin and loads the test configuration, and `await config.dispose()` in `finally`. See [fixture ownership](testing.md#own-the-fixture-and-register-the-real-plugin). Keep command tests sequential because output capture modifies process streams. Binding a class does not prove CLI registration: verify the target App discovers its plugin topic separately when registration changes.

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
  packageName: '@acme/app-plugin-reports',
  devCommands: { compile: ReportsCompile },
  buildHooks: {
    afterServerBuild: [
      {
        label: 'Compile report templates',
        command: [
          'pnpm',
          'nocobase',
          'reports',
          'compile',
          '--out-dir',
          './dist/server/reports',
        ],
      },
    ],
  },
});
```

`devHooks` takes the same shape for the `beforeDev` stage. Declare one only when development genuinely needs the step before the server starts; a plugin that can compile its inputs on demand at run time should not slow every `pnpm dev` start with it.

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

From the repository root, pass `--workspace-root .`: the command selects `app-template-default` unless `--app` is supplied, resolves plugin packages from workspace directories, and records `workspace:^`. An independent App runs from its own root and can register both local workspace plugins and published dependencies. Local plugins keep their workspace dependency; published plugins keep the requested registry range. Use the full package name for custom scopes and follow [registration](registration.md#register-a-local-plugin-in-an-app).

## Verification

- Run the plugin's focused lint, typecheck, tests, and build; include a test that imports the production `./cli` definition and asserts the real command or hook contract, and a test that runs each command through `bindAppCommand`.
- Register the plugin in a target App and verify the exact `cli/plugins.ts` import and array entry.
- Run `pnpm nocobase <topic> --help`, the command's normal path, its JSON path when offered, invalid input, and a representative failure.
- For hooks, run the affected App build or dev startup and verify the expected artifact or behavior at the selected stage.
- Build the target App and run `node dist/cli/index.js <topic> --help` to confirm that `commands` are present and `devCommands` are absent in the deployment.

Current implementation and maintained examples, in the `nocobase/nocobase` repository on the `v3` branch:

- CLI plugin types (`packages/app/app-cli/src/plugins/types.ts`)
- CLI plugin validation (`packages/app/app-cli/src/plugins/define.ts`)
- CLI assembly (`packages/app/app-cli/src/runtime/assemble.ts`)
- CLI example plugin (`packages/examples/app-plugin-cli-example/cli/index.ts`)
- Default Template CLI composition (`packages/templates/app-template-default/cli/plugins.ts`)
- CLI runner and App location (`packages/app/app-cli/src/runtime/run.ts`, `packages/app/app-cli/src/runtime/location.ts`)
- Plugin registration implementation (`packages/app/app-cli/src/lib/plugin-registration.ts`)
- Skills synchronization implementation (`packages/app/app-cli/src/lib/skills-sync.ts`)
