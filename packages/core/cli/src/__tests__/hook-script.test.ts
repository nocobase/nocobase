/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, test } from 'vitest';
import {
  ENV_HOOK_SCRIPT_CONFIG_PATH,
  persistHookScript,
  resolveHookScriptPath,
  runHookScriptHook,
  runBeforeDependencyInstallHook,
} from '../lib/hook-script.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

async function useTempDir(): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-hook-'));
  tempDirs.push(dir);
  return dir;
}

test('persistHookScript copies hooks into the app metadata directory', async () => {
  const dir = await useTempDir();
  const appPath = path.join(dir, 'local');
  const sourcePath = path.join(dir, 'new-hook.mjs');
  await fsp.writeFile(sourcePath, 'export default {};');

  const hookScript = await persistHookScript({
    sourcePath,
    appPath,
  });

  expect(hookScript).toBe(ENV_HOOK_SCRIPT_CONFIG_PATH);
  await expect(fsp.readFile(path.join(appPath, '.nb', 'hooks.mjs'), 'utf8')).resolves.toBe('export default {};');
  expect(
    resolveHookScriptPath({
      appPath,
      hookScript,
    }),
  ).toBe(path.join(appPath, '.nb', 'hooks.mjs'));
});

test('runBeforeDependencyInstallHook rejects array exports', async () => {
  const dir = await useTempDir();
  const hookPath = path.join(dir, 'hooks.mjs');
  await fsp.writeFile(hookPath, 'export default [];');

  await expect(
    runBeforeDependencyInstallHook({
      hookScriptPath: hookPath,
      context: {
        phase: 'init',
        command: 'init',
        envName: '',
        source: 'git',
        appPath: path.join(dir, 'app'),
        sourcePath: path.join(dir, 'repo'),
        storagePath: path.join(dir, 'app', 'storage'),
        hookScript: hookPath,
        envConfig: {},
      },
    }),
  ).rejects.toThrow(/Hook script must export an object/);
});

test('runHookScriptHook runs beforeAppInstall and afterAppStart hooks', async () => {
  const dir = await useTempDir();
  const hookPath = path.join(dir, 'hooks.mjs');
  const markerPath = path.join(dir, 'marker.json');
  await fsp.writeFile(
    hookPath,
    `
export default {
  beforeAppInstall: async (context) => {
    const fs = await import('node:fs/promises');
    const current = JSON.parse(await fs.readFile(${JSON.stringify(markerPath)}, 'utf8').catch(() => '[]'));
    current.push({ hook: 'beforeAppInstall', phase: context.phase, command: context.command, source: context.source });
    await fs.writeFile(${JSON.stringify(markerPath)}, JSON.stringify(current));
  },
  afterAppStart: async (context) => {
    const fs = await import('node:fs/promises');
    const current = JSON.parse(await fs.readFile(${JSON.stringify(markerPath)}, 'utf8').catch(() => '[]'));
    current.push({ hook: 'afterAppStart', phase: context.phase, command: context.command, source: context.source });
    await fs.writeFile(${JSON.stringify(markerPath)}, JSON.stringify(current));
  }
};
`,
  );
  const context = {
    phase: 'upgrade' as const,
    command: 'app:upgrade' as const,
    envName: 'local',
    source: 'docker' as const,
    appPath: path.join(dir, 'app'),
    sourcePath: path.join(dir, 'app', 'source'),
    storagePath: path.join(dir, 'app', 'storage'),
    hookScript: hookPath,
    envConfig: {},
  };

  await runHookScriptHook({
    hookScriptPath: hookPath,
    hookName: 'beforeAppInstall',
    context,
  });
  await runHookScriptHook({
    hookScriptPath: hookPath,
    hookName: 'afterAppStart',
    context,
  });

  await expect(fsp.readFile(markerPath, 'utf8')).resolves.toBe(
    JSON.stringify([
      { hook: 'beforeAppInstall', phase: 'upgrade', command: 'app:upgrade', source: 'docker' },
      { hook: 'afterAppStart', phase: 'upgrade', command: 'app:upgrade', source: 'docker' },
    ]),
  );
});
