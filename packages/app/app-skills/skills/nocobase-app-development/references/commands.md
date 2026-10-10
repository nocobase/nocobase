# Adding an application command

Read this before adding or changing a command under `cli/commands/`. It covers writing commands; running them, including the commands `@nocobase/app-cli` and plugins provide, is in [the command line](cli.md).

## Where an application command lives

A command this application owns is a file under `cli/commands/` that default-exports an `AppCommand` subclass. Its path is its name below the `app` topic: `cli/commands/sync-orders.ts` answers to `pnpm nocobase app sync-orders`, and `cli/commands/orders/export.ts` to `pnpm nocobase app orders export`. There is no index to update. Files and directories starting with `_`, and directories named `lib`, are skipped, so helpers can sit beside the commands.

Do not name a directory under `cli/commands/` `dist`, `build`, `coverage` or `generated`: each is ignored by `.gitignore`, Prettier or the shared ESLint preset, so a command inside one would go unlinted, or never reach git, without any warning.

`cli/` is compiled into `dist`, and every application command is registered there too, so a command runs in a deployment and may import only packages in `dependencies`. There is no development-only application command: one that needs the sources, such as a code generator, cannot read them in a deployment. Keep such work in a script, or in a plugin's `devCommands`.

Write an application command when the work belongs to this application alone. Work several applications share belongs in a plugin, which contributes its commands under its own topic.

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

`@nocobase/app-testing/cli` runs a command without the runner; an application's tests take their fixtures from `@nocobase/app-testing` alone:

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

A command that opens the real application needs isolated databases and storage. Use `createTestAppConfig()` and `bindTestAppCommand()` from the same entry. Import the application's runtime and factory explicitly so Vitest resolves its TypeScript source and `.js` specifiers; the conventional loader uses Node and otherwise needs compiled JavaScript or an active TypeScript loader. A custom `loadRuntime` must pass `config.path` itself. Provision every connection the command writes and keep output files in a temporary directory. Always dispose the configuration in `finally`:

```ts
// tests/logic/export-orders.test.ts
// @vitest-environment node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import {
  bindTestAppCommand,
  createTestAppConfig,
  runAppCommand,
} from '@nocobase/app-testing/cli';
import { expect, it } from 'vitest';
import OrdersExport from '../../cli/commands/orders/export.ts';
import runtime from '../../server/runtime.ts';
import { createApp } from '../../server/app.ts';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));

it('previews the export', async () => {
  const config = await createTestAppConfig({
    config: {
      auth: { secret: 'test-only-auth-secret-at-least-32-characters' },
    },
  });
  try {
    const Bound = bindTestAppCommand(OrdersExport, {
      rootDir,
      id: 'app:orders:export',
      config,
      createApp,
      loadRuntime: () =>
        resolveStandaloneAppRuntime(runtime, {
          rootDir,
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
});
```

The configuration fixture provisions databases but does not start the application. Arrange the schema and domain rows the command expects before its operations: `app.start()` runs installation when auto-run is enabled, while `app.registerProviders()` alone does not. The export command below assumes an installed schema and at least one exportable order for its successful path; prepare those in an integration fixture, or use the isolated error-path test below when testing only its output contract.

## Example

```ts
// cli/commands/orders/export.ts
import { AppCommand, CommandError, appPath } from '@nocobase/app-cli';
import { Flags } from '@oclif/core';
import type { Interfaces } from '@oclif/core';

export interface OrdersExportResult {
  readonly file: string;
  readonly exported: number;
}

export default class OrdersExport extends AppCommand {
  static override summary = 'Export this month’s orders to a CSV file.';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --output ./orders.csv --json',
  ];
  static override flags: {
    output: Interfaces.OptionFlag<string | undefined>;
    'dry-run': Interfaces.BooleanFlag<boolean>;
  } = {
    output: appPath({
      description:
        'Where to write the file. Defaults to storage/exports/orders.csv.',
    }),
    'dry-run': Flags.boolean({
      default: false,
      description: 'Count the orders without writing a file.',
    }),
  };

  public async run(): Promise<OrdersExportResult> {
    const { flags } = await this.parse(OrdersExport);
    const result = await this.withApp(async ({ app }) => {
      app.registerProviders();
      const { exportOrders } = await import('./_export-orders.ts');
      const file = flags.output ?? app.paths.storage('exports/orders.csv');
      const exported = await exportOrders(app, {
        file,
        dryRun: flags['dry-run'],
      });
      return { file, exported };
    });
    if (result.exported === 0) {
      throw new CommandError('There are no orders to export this month.', {
        code: 'NO_ORDERS',
      });
    }
    if (flags['dry-run']) this.setStatus('success-noop');
    this.log(`Exported ${result.exported} orders to ${result.file}.`);
    return result;
  }
}
```

The default output is computed from `app.paths.storage()` rather than given as an `appPath` default, because storage lives outside the compiled code in a deployment and only the application's paths know where.

```ts
// tests/logic/orders-export.test.ts
// @vitest-environment node
import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import { expect, it, vi } from 'vitest';

import OrdersExport from '../../cli/commands/orders/export.ts';

vi.mock('../../cli/commands/orders/_export-orders.ts', () => ({
  exportOrders: async () => 0,
}));

it('fails with NO_ORDERS when there is nothing to export', async () => {
  const Bound = bindAppCommand(OrdersExport, {
    rootDir: process.cwd(),
    id: 'app:orders:export',
    // A stub stands in for the application, so the test needs no database.
    loadRuntime: async () =>
      ({ env: {}, scope: { destroy: async () => {} } }) as never,
    createApp: () =>
      ({
        registerProviders: () => {},
        paths: { storage: (file: string) => `/tmp/${file}` },
        shutdown: async () => {},
      }) as never,
  });

  const run = await runAppCommand(Bound, ['--json']);

  expect(run.exitCode).toBe(1);
  expect(run.json()).toMatchObject({ ok: false, error: { code: 'NO_ORDERS' } });
});
```

## Verify

- Run the application's `pnpm lint`, `pnpm typecheck` and the command's test.
- Run `pnpm nocobase app <name> --help`, the command itself, and the same with `--json`; read `ok` and `status` from the document, and check a failure exits non-zero with its `error.code`.
- After `pnpm build`, run `node dist/cli/index.js app <name> --help` to confirm the command is present in the deployment.
