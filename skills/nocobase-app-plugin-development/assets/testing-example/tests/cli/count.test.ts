import { fileURLToPath } from 'node:url';

import {
  bindTestAppCommand,
  createTestAppConfig,
  runAppCommand,
} from '@nocobase/app-testing/cli';
import { expect, it, vi } from 'vitest';

import CountEntries from '../../cli/count.js';
import cliPlugin from '../../cli/index.js';

it('runs the contributed command on its own installed database', async () => {
  const config = await createTestAppConfig();
  vi.stubEnv('APP_STORAGE_PATH', config.directory);
  try {
    expect(cliPlugin.commands?.count).toBe(CountEntries);
    const run = await runAppCommand(
      bindTestAppCommand(CountEntries, {
        rootDir: fileURLToPath(new URL('../fixtures/app', import.meta.url)),
        config,
        id: 'reading-list:count',
      }),
      ['--json'],
    );

    expect(run.exitCode ?? 0).toBe(0);
    expect(run.json()).toMatchObject({
      ok: true,
      command: 'reading-list count',
      result: { count: 0 },
    });
  } finally {
    vi.unstubAllEnvs();
    await config.dispose();
  }
});
