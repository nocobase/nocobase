# CLI example: run a command on an isolated application database

Use `bindTestAppCommand()` when a command opens the application. It binds the command to the configuration from `createTestAppConfig()`, so the command reads the test's databases. `runAppCommand()` captures the result, exit code and JSON output without spawning the CLI runner.

For a complete command that works with files and needs no application database, start with [file output, dry runs and failures](files.md).

## Prerequisites

Create the migration and `noteMigrations` helper from [the database example](../database/repository.md). Use an application with `server/app.ts`, `server/runtime.ts` and `database/main/migrations/`, as the templates provide. Adjust the application migration directory below if its configured sources differ. The example provisions `main`; include every application-owned connection if there are more, as described in [the server example](../server/routes.md).

## Configure CLI tests

Create `vitest.cli.config.ts` at the application root, or reuse the identical config from [the file-command example](files.md):

```ts
import { createNodeVitestConfig } from '@nocobase/dev-config/vitest/node';

export default createNodeVitestConfig({
  cacheDir: './storage/tests/vite-cli',
  test: {
    include: ['tests/cli/**/*.test.ts'],
    fileParallelism: false,
    passWithNoTests: false,
  },
});
```

Run this suite after any server or database suite has finished. The command creates a real application, including its providers and background services; `runAppCommand()` also temporarily captures process-wide output.

## A small command to exercise

Create `tests/fixtures/count-notes-command.ts`. This fixture demonstrates a command without registering a new production CLI command. To test an existing command, import its real class from `cli/commands/` instead.

```ts
import { AppCommand } from '@nocobase/app-cli';

export default class CountNotes extends AppCommand {
  static override summary = 'Count the test notes.';

  public async run(): Promise<{ count: number }> {
    await this.parse(CountNotes);
    const { databaseManagerToken } = await import('@nocobase/db');
    return this.withApp(async ({ app }) => {
      await app.start();
      const database = app.container.resolve(databaseManagerToken);
      const count = await database
        .connection()
        .repository('testingNotes')
        .count();
      return { count };
    });
  }
}
```

`withApp()` closes the application after the callback, even if it fails. `app.start()` is needed here to initialize the application's services; it also starts registered jobs and schedules, so keep the application's test configuration appropriate for that work. Load the database runtime inside `run()` to keep command discovery cheap.

## Prepare data and assert the JSON contract

Create `tests/cli/count-notes.test.ts`:

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  bindTestAppCommand,
  createTestAppConfig,
  runAppCommand,
} from '@nocobase/app-testing/cli';
import { expect, it, vi } from 'vitest';
import CountNotes from '../fixtures/count-notes-command.js';
import { noteMigrations } from '../helpers/testing-notes.js';
import packageMetadata from '../../package.json' with { type: 'json' };

const rootDir = fileURLToPath(new URL('../../', import.meta.url));

it.each([0, 2])('counts %i prepared records', async (count) => {
  const config = await createTestAppConfig({
    connections: ['main'],
    config: {
      database: {
        connections: {
          main: {
            migrations: {
              autoRun: true,
              sources: [
                {
                  packageName: packageMetadata.name,
                  directory: path.join(rootDir, 'database/main/migrations'),
                },
                ...noteMigrations,
              ],
            },
          },
        },
      },
      app: { publicOrigin: 'http://localhost' },
      auth: {
        secret: 'test-auth-secret-at-least-32-characters',
        trustedOrigins: ['http://localhost'],
      },
    },
  });
  try {
    vi.stubEnv('APP_STORAGE_DIR', path.join(config.directory, 'storage'));
    const database = await config.testDatabases.open({
      migrations: noteMigrations,
    });
    try {
      for (let index = 0; index < count; index += 1) {
        await database.connection.repository('testingNotes').createOne({
          values: { id: `note-${index}`, title: `Note ${index}` },
        });
      }
    } finally {
      await database.destroy();
    }

    const run = await runAppCommand(
      bindTestAppCommand(CountNotes, {
        rootDir,
        config,
        id: 'app:notes:count',
      }),
      ['--json'],
    );

    expect(run.error).toBeUndefined();
    expect(run.exitCode ?? 0).toBe(0);
    expect(run.json()).toMatchObject({
      ok: true,
      command: 'app notes count',
      status: 'success',
      result: { count },
    });
  } finally {
    vi.unstubAllEnvs();
    await config.dispose();
  }
});
```

The test's preparation step and the command's startup must both know the fixture migration. `config.database.connections.main.migrations.sources` includes the application's own directory and `noteMigrations`; registered plugin migrations are added by the application. Listing only the fixture sources would omit the application's own migrations. Omitting the fixture sources would leave an applied migration in history that startup cannot find and cause it to fail. These overrides change migration discovery, not the provisioned connection's location.

`config.testDatabases.open()` resets and opens the provisioned databases before preparing the row. The returned handle does not own those databases, so `database.destroy()` closes the preparation connections while leaving the row for the command. `config.dispose()` is the owner cleanup: it drops the databases after the command has closed its application. Do not open the preparation handle again after running the command to inspect its writes; opening it resets the schema.

The storage override keeps application logs and background-worker state under the same temporary directory. Restore it in `finally`. Run these command cases sequentially: environment stubs and `runAppCommand()`'s stream capture are process-wide. A successful `runAppCommand()` has `exitCode: undefined`, which means zero; normalize it when asserting.

## Run and check

```bash
pnpm exec vitest run --config vitest.cli.config.ts tests/cli/count-notes.test.ts
```

Expect two passing cases: an empty collection returns `result.count: 0`, and two prepared records return `result.count: 2`. Each case owns a separate configuration and databases. This proves the command reads the isolated database and obeys the JSON output contract. For a command with invalid-input or domain-error branches, also assert a nonzero exit and its documented `error.code`; a success case alone does not cover them. Commands that only manipulate files can use `bindAppCommand()` without provisioning a database, as [command authoring](../../commands.md#test) describes.

Return to [testing and verification](../../testing.md).
