import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import {
  bindTestAppCommand,
  createTestAppConfig,
  runAppCommand,
} from '@nocobase/app-testing/cli';
import { expect, it } from 'vitest';

import CountEntries from '../../cli/count.js';
import cliPlugin from '../../cli/index.js';
import { createApp as createFixtureApp } from '../fixtures/app/server/app.js';
import runtimeDefinition from '../fixtures/app/server/runtime.js';

it('runs the contributed command with an isolated database and storage', async () => {
  const config = await createTestAppConfig();
  const rootDir = fileURLToPath(new URL('../fixtures/app', import.meta.url));
  let storageDir: string | undefined;
  try {
    expect(cliPlugin.commands?.count).toBe(CountEntries);
    const run = await runAppCommand(
      bindTestAppCommand(CountEntries, {
        rootDir,
        config,
        id: 'reading-list:count',
        // Let Vitest resolve the fixture's TypeScript imports even with the published CLI.
        loadRuntime: () =>
          resolveStandaloneAppRuntime(runtimeDefinition, {
            rootDir,
            configPath: config.path,
            env: { APP_STORAGE_DIR: path.join(config.directory, 'storage') },
            consoleLogStream: 'stderr',
          }),
        createApp(runtime) {
          const app = createFixtureApp(runtime);
          storageDir = app.paths.storageDir;
          return app;
        },
      }),
      ['--json'],
    );

    expect(run.exitCode ?? 0).toBe(0);
    expect(run.json()).toMatchObject({
      ok: true,
      command: 'reading-list count',
      result: { count: 0 },
    });
    expect(storageDir).toBe(path.join(config.directory, 'storage'));
  } finally {
    await config.dispose();
  }
});
