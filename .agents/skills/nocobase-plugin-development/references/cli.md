# Plugin CLI Contributions

Read this reference when a plugin must add commands to an App's `pnpm nocobase` tree or run plugin-owned commands at defined points in the App build or development startup.

CLI is an explicit composition surface alongside Client and Server. A plugin may contribute any subset of `./client`, `./server`, and `./cli`; the presence of one never implies another.

## Command ownership and boundaries

An App CLI assembles three command sources:

| Command path                            | Owner                                                                |
| --------------------------------------- | -------------------------------------------------------------------- |
| `package *`, `plugin *`, and `skills *` | Built into `@nocobase/nb3-cli`                                       |
| `app *`                                 | The App's `cli/commands/`                                            |
| `<plugin-topic> *`                      | A plugin exported through `./cli` and registered in `cli/plugins.ts` |

Use plugin CLI commands for work a person or CI invokes explicitly from files and packages, such as validating static declarations or generating artifacts. The plugin declaration is imported while the command tree is assembled, before an App Runtime or ServiceContainer exists. Put runtime operations behind authenticated Server APIs, Services, or Jobs rather than assuming the CLI can resolve a running application.

Topics share one flat namespace. A plugin topic must be lower-case kebab-case and globally unique; collisions with built-in, App, or other plugin topics fail assembly and name both owners. Command keys are lower-case kebab-case and may use colon-separated nesting: `artifact:build` becomes `nocobase demo artifact build`.

## Implement an oclif command

Commands are oclif `Command` subclasses:

```ts
// cli/greet.ts
import { Args, Command, Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';

export default class DemoGreet extends Command {
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
    json: Interfaces.BooleanFlag<boolean>;
  } = {
    loud: Flags.boolean({
      default: false,
      description: 'Upper-case the greeting.',
    }),
    json: Flags.boolean({
      default: false,
      description: 'Print one JSON result.',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(DemoGreet);
    const message = flags.loud
      ? `HELLO, ${args.target.toUpperCase()}!`
      : `Hello, ${args.target}.`;

    if (flags.json) {
      this.logJson({ ok: true, message });
      return;
    }
    this.log(message);
  }
}
```

Use `<%= config.bin %>` and `<%= command.id %>` in examples so help reflects the actual assembled binary and path.

Explicit `args`, `flags`, and `examples` types matter because plugin packages emit declarations with `isolatedDeclarations`. Type each flag precisely, such as `Interfaces.BooleanFlag<boolean>`; a broad `Interfaces.FlagInput` can make the parsed result lose its useful type.

Keep command modules cheap to import. Load heavy SDKs or optional dependencies with `await import()` inside the named `run()` method so `--help` does not initialize them.

For machine-readable behavior, emit one JSON document on success, send failures to stderr, and preserve a nonzero exit code. Treat exit code `2` as invalid usage and `1` as a runtime error unless the command has a documented, stable extension.

## Declare the CLI plugin

Statically import command classes and pass them to `defineCliPlugin()`:

```ts
// cli/index.ts
import { defineCliPlugin, type AppCliPlugin } from '@nocobase/nb3-cli/plugins';

import DemoArtifactBuild from './artifact-build.ts';
import DemoGreet from './greet.ts';

const cliPlugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-demo',
  topic: 'demo',
  description: 'Commands for the Demo plugin.',
  commands: {
    greet: DemoGreet,
    'artifact:build': DemoArtifactBuild,
  },
});

export default cliPlugin;
```

The definition validates the scoped package name, topic, command keys, command classes, and hook stages. A plugin may provide hooks without commands. A CLI definition with neither commands nor hooks is allowed but warns because registering it has no effect.

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
    "@nocobase/nb3-cli": "workspace:^",
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
} from '@nocobase/nb3-cli/plugins';
import demo from '@nocobase/app-plugin-demo/cli';

const cliPlugins: AppCliPlugins = defineCliPlugins([demo]);

export default cliPlugins;
```

`pnpm plugin:register demo` detects the exact `exports["./cli"]` entry and adds this import and array item. A plugin with no `./cli` export is skipped. `--disabled` installs the dependency but skips Client, Server, and CLI wiring; there is no persistent `nocobase.plugins.enabled` flag that later discovers the contribution. The explicit composition files are the active registration state.

Array order is contribution order. It controls command registration and, within each stage, build and dev hook execution. Removing the import and item removes that plugin's CLI contribution.

All plugin packages are recorded in the App's `dependencies`, including Client-only and disabled packages, so deployment dependency resolution is consistent. Registration removes a duplicate declaration from `devDependencies`. It does not create `package.json#nocobase.plugins`; unregistration only cleans an old entry there when a legacy manifest already contains one.

The App assembles its CLI in `cli/index.ts`:

```ts
#!/usr/bin/env node
import { runAppCli } from '@nocobase/nb3-cli/runtime';

import appCommands from './commands/index.js';
import cliPlugins from './plugins.js';

await runAppCli({
  commands: appCommands,
  plugins: cliPlugins,
});
```

Invoke `pnpm nocobase`, which runs this App-owned entry and therefore includes App and plugin commands. Invoking only the package binary provides built-in management commands and cannot infer App-owned contributions without the App entry.

The App's `cli/` source is compiled with the server side and runs in the deployed artifact as `node ./cli/index.js`. Use `.js` specifiers between App CLI source files so emitted ESM resolves correctly.

## Declare build and dev hooks

A CLI plugin can attach commands to App lifecycle stages:

```ts
const cliPlugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-workflow',
  topic: 'workflow',
  commands: { build: WorkflowBuild },
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
          './dist/workflows',
        ],
      },
    ],
  },
  devHooks: {
    beforeDev: [
      {
        label: 'Prepare workflow artifacts',
        command: ['pnpm', 'nocobase', 'workflow', 'build'],
      },
    ],
  },
});
```

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

Inspect the resolved plan without running hooks:

```bash
pnpm nocobase plugin cli-hooks
pnpm nocobase plugin cli-hooks --json
```

The App's plain Node build and dev scripts use this command to obtain hooks because they cannot import TypeScript plugin entries themselves. Failure to resolve hooks must fail the pipeline; continuing would produce an apparently successful build with missing artifacts.

## Development-only App commands

Commands that require Vite or Client source cannot run from the server deployment. Keep them in the App's `cli/dev-commands/`, exclude that directory from `tsconfig.server.json`, and load it only when `cli/index.ts` is executing from source. Use the Default Template's guarded dynamic import pattern; a literal import causes TypeScript to include the directory despite `exclude`.

Deployment-safe plugin commands belong in the plugin's compiled `./cli` entry. A plugin cannot rely on the App's development-only loader for published behavior.

## Plugin management commands

Use the App's scripts for normal lifecycle work:

| Command                             | Current effect                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm plugin:register <name>`       | Installs the plugin into `dependencies`, wires each exported `./client`, `./server`, and `./cli` root, and synchronizes shipped Skills unless `--no-skills` is set |
| `pnpm plugin:inspect <name> --json` | Reads static dependency, explicit composition, and Skill facts without changing files                                                                              |
| `pnpm plugin:unregister <name>`     | Removes explicit roots, cleans dependency and legacy metadata, removes synchronized Skills, and uninstalls unless `--no-install` is set                            |
| `pnpm plugin:update [name]`         | Updates one or all explicitly registered plugin packages and then synchronizes Skills                                                                              |
| `pnpm skills:sync`                  | Synchronizes Skills from direct NocoBase dependencies and explicitly registered plugins without upgrading packages                                                 |
| `pnpm package:remove <package>`     | Removes a direct NocoBase package and its synchronized Skills; plugin packages reuse full unregistration                                                           |

Prefer `--dry-run --json` when an Agent needs a plan. If an uninstalled plugin is requested, register dry-run returns `requires-installation` because it cannot inspect exports until the package exists; install it and rerun to compute the wiring plan. Read the JSON `ok` and `status` fields, preserve nonzero failure exits, and treat `success-noop`, `partial-success`, and `requires-installation` as distinct outcomes.

`plugin:inspect` proves only that readable static registration surfaces agree. It does not execute commands or hooks, start Runtime contributions, evaluate permissions, test behavior, or replace package and App validation.

Repository root scripts add `--workspace-root .`, select `app-template-default` unless `--app` is supplied, resolve plugin packages from workspace directories, and record `workspace:^`. A generated App runs the same implementation from its own directory, resolves installed packages from `node_modules`, and keeps its installed version range.

## Verification

- Run the plugin's focused lint, typecheck, tests, and build; include a test that imports the production `./cli` definition and asserts the real command or hook contract.
- Register the plugin in a target App and verify the exact `cli/plugins.ts` import and array entry.
- Run `pnpm nocobase <topic> --help`, the command's normal path, its JSON path when offered, invalid input, and a representative failure.
- For hooks, inspect `plugin cli-hooks`, then run the affected App build or dev startup and verify the expected artifact or behavior at the selected stage.
- Build the target App and run the deployed CLI path for commands intended to work in production.

Current implementation and maintained examples:

- [CLI plugin types](../../../../packages/tools/cli/src/plugins/types.ts)
- [CLI plugin validation](../../../../packages/tools/cli/src/plugins/define.ts)
- [CLI assembly](../../../../packages/tools/cli/src/runtime/assemble.ts)
- [CLI example plugin](../../../../packages/examples/app-plugin-cli-example/cli/index.ts)
- [Default Template CLI composition](../../../../packages/templates/app-template-default/cli/index.ts)
- [Plugin registration implementation](../../../../packages/tools/cli/src/lib/plugin-registration.ts)
- [Skills synchronization implementation](../../../../packages/tools/cli/src/lib/skills-sync.ts)
