import { fileURLToPath } from 'node:url';

import {
  bindTestAppCommand,
  createTestAppConfig,
  runAppCommand,
} from '@nocobase/app-testing/cli';
import { expect, it, vi } from 'vitest';

import CountEntries from '../../cli/count.js';
import cliPlugin from '../../cli/index.js';
import { createApp as createFixtureApp } from '../fixtures/app/server/app.js';

it('runs the contributed command with an isolated database and storage', async () => {
  const config = await createTestAppConfig();
  let storageDir: string | undefined;
  vi.stubEnv('APP_STORAGE_DIR', config.directory);
  try {
    expect(cliPlugin.commands?.count).toBe(CountEntries);
    const run = await runAppCommand(
      bindTestAppCommand(CountEntries, {
        rootDir: fileURLToPath(new URL('../fixtures/app', import.meta.url)),
        config,
        id: 'reading-list:count',
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
    expect(storageDir).toBe(config.directory);
  } finally {
    vi.unstubAllEnvs();
    await config.dispose();
  }
});
