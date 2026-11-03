import { fileURLToPath } from 'node:url';
import { bindAppCommand, runAppCommand } from '@nocobase/app-testing/cli';
import { expect, it } from 'vitest';
import DemoData from '../../cli/data.js';

const Bound = bindAppCommand(DemoData, {
  rootDir: fileURLToPath(new URL('../../', import.meta.url)),
  id: 'demo-enabled:data',
});

it('previews a reset without loading an application or exposing credentials', async () => {
  const run = await runAppCommand(Bound, [
    'reset',
    '--language',
    'en-US',
    '--dry-run',
    '--json',
  ]);
  expect(run.exitCode ?? 0).toBe(0);
  expect(run.json()).toMatchObject({
    ok: true,
    status: 'success-noop',
    result: { operation: 'reset', language: 'en-US', dryRun: true },
  });
});

it('requires confirmation before loading the application for a change', async () => {
  const run = await runAppCommand(Bound, ['clear', '--json']);
  expect(run.exitCode).toBe(2);
  expect(run.json()).toMatchObject({
    ok: false,
    error: { code: 'FORCE_REQUIRED' },
  });
});

it('requires an importer for the first import', async () => {
  const run = await runAppCommand(Bound, ['import', '--force', '--json']);
  expect(run.exitCode).toBe(2);
  expect(run.json()).toMatchObject({
    ok: false,
    error: { code: 'INVALID_USAGE' },
  });
});
