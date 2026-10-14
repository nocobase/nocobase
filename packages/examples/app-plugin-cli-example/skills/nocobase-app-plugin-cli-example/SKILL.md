---
name: nocobase-app-plugin-cli-example
description: Use when adding commands to an application's nocobase CLI, or when working out how a plugin contributes CLI commands. Covers the ./cli entry, defineCliPlugin, and how topics are assembled.
---

# CLI Example Plugin

This plugin contributes commands to the application's `nocobase` CLI. Read it as the reference implementation when
writing commands for another plugin.

## What a CLI plugin is

A plugin contributes commands by exporting a `./cli` entry. The application lists that entry in `cli/plugins.ts`, and `pnpm nocobase` assembles it into one command tree alongside the built-in commands of `@nocobase/app-cli`, such as `config *`, `db *`, `plugin *` and `build`, and the application's own `app *` commands.

Every command extends `AppCommand` from `@nocobase/app-cli`: it returns its result, throws `CommandError` on failure, and gets `--json` from the base class. By default a command is static tooling that operates on files and packages; one that needs the application creates it with `this.withApp(async ({ app }) => …)`. The `nocobase-app-plugin-development` Skill's CLI reference has the whole contract.

## The three pieces

**A command** is an `AppCommand` subclass — the same base the built-in commands use:

```ts
// cli/greet.ts
import { AppCommand } from '@nocobase/app-cli';
import { Args, Flags } from '@oclif/core';

export default class Greet extends AppCommand {
  static override summary = 'Print a greeting.';
  static override examples = ['<%= config.bin %> <%= command.id %> world'];
  static override args = {
    target: Args.string({ description: 'Who to greet.', required: true }),
  };
  static override flags = {
    loud: Flags.boolean({ default: false, description: 'Upper-case it.' }),
  };

  public async run(): Promise<{ message: string }> {
    const { args, flags } = await this.parse(Greet);
    const message = flags.loud
      ? `HELLO, ${args.target.toUpperCase()}!`
      : `Hello, ${args.target}.`;
    this.log(message); // for people; silent under --json
    return { message }; // the --json result
  }
}
```

**The entry** names the package and declares the command maps: `commands` run wherever the application runs, a built `dist/` included, and `devCommands` only in a source checkout. The topic is derived from the package name, without its scope and `app-plugin-` prefix, so `@nocobase/app-plugin-cli-example` mounts under `cli-example`:

```ts
// cli/index.ts
import { defineCliPlugin, type AppCliPlugin } from '@nocobase/app-cli';
import ArtifactBuild from './artifact-build.ts';
import Greet from './greet.ts';

const cliPlugin: AppCliPlugin = defineCliPlugin({
  packageName: '@nocobase/app-plugin-cli-example',
  description: 'Example commands contributed by a plugin.',
  commands: { greet: Greet },
  // Reads source directories a built dist/ does not carry, so it is registered only in a source checkout.
  devCommands: { 'artifact:build': ArtifactBuild },
});

export default cliPlugin;
```

Keys are sub-command names. `greet` becomes `nocobase cli-example greet`; the colon in `artifact:build` nests one level
further, into `nocobase cli-example artifact build`.

**The manifest** exposes the entry and declares oclif:

```json
{
  "exports": {
    "./cli": { "types": "./cli/index.ts", "import": "./cli/index.ts" }
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

Both are peers, so the application supplies them. `@nocobase/app-cli` is the runtime the entry plugs into, and one shared `@oclif/core` keeps help rendering and flag parsing consistent between the plugin and the application. A peer range is published metadata resolved in an installation that is not this workspace, so it cannot be `catalog:`.

`cli/` must reach consumers — through `files`, or through `dist` as here.

## Rules that matter

**Topics are one flat namespace.** Every plugin claims the one its package name gives it. The built-in topics and top-level commands, such as `plugin`, `db` and `build`, and `app` for the application are reserved even where their commands are not registered, so a plugin whose name matches one fails CLI assembly with an error naming both claimants, rather than resolving silently. Two plugins collide whenever their names match once the scope and an `app-plugin-` prefix are removed: `@acme/reports` and `@acme/app-plugin-reports` both claim `reports`, as do `@nocobase/app-plugin-x` and `@other/x`.

**Keep command modules cheap to import.** The application imports every registered plugin's `./cli` entry to build
`--help`. A class declaration costs nothing; load anything expensive inside `run()` with `await import()`, as
`cli/artifact-build.ts` does.

**Follow the output conventions.** Return the result from `run()` and throw `CommandError` on failure; `AppCommand` turns either into the one `--json` document on stdout, and a failure also exits non-zero. Never call `this.exit()`, `this.logJson()` or `console.log`, and do not report a failure with `this.error()`. Exit codes are `0` success, `1` runtime error, `2` argument error.

## Verify

```bash
pnpm nocobase cli-example --help              # the topic and its commands
pnpm nocobase cli-example greet --help        # one command's flags and args
pnpm nocobase cli-example greet world --json
```

A command missing from `--help` usually means the plugin is absent from the application's `cli/plugins.ts`. Run
`pnpm nocobase plugin inspect <name> --json` and read `composition.cli`.
