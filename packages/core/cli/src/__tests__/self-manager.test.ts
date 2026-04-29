/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import fsp from 'node:fs/promises';
import os from 'node:os';
import { expect, test, vi } from 'vitest';
import {
  compareVersions,
  formatUnsupportedSelfUpdateMessage,
  getSelfUpdatePackageSpec,
  getRecommendedSelfUpdateCommand,
  inspectSelfStatus,
  updateSelf,
} from '../lib/self-manager.js';

test('compareVersions handles prerelease ordering', () => {
  expect(compareVersions('2.1.0-beta.18', '2.1.0-beta.17')).toBeGreaterThan(0);
  expect(compareVersions('2.1.0', '2.1.0-beta.99')).toBeGreaterThan(0);
  expect(compareVersions('2.1.0-alpha.1', '2.1.0-beta.1')).toBeLessThan(0);
});

test('inspectSelfStatus resolves latest version and install support for npm-global installs', async () => {
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npm' && args.join(' ') === 'prefix -g') {
      return '/usr/local';
    }
    if (name === 'npm' && args.join(' ') === 'view @nocobase/cli dist-tags --json') {
      return JSON.stringify({ latest: '2.1.0', beta: '2.1.0-beta.18', alpha: '2.1.0-alpha.3' });
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  const status = await inspectSelfStatus({
    packageRoot: path.join('/usr/local', 'lib', 'node_modules', '@nocobase', 'cli'),
    currentVersion: '2.1.0-beta.17',
    channel: 'auto',
    commandOutputFn: commandOutputFn as any,
  });

  expect(status.installMethod).toBe('npm-global');
  expect(status.latestVersion).toBe('2.1.0-beta.18');
  expect(status.updateAvailable).toBe(true);
  expect(status.updatable).toBe(true);
  expect(status.updateBlockedReason).toBeUndefined();
});

test('updateSelf rejects unsupported install methods', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-self-source-'));
  const packageRoot = path.join(dir, 'packages', 'core', 'cli');

  try {
    await fsp.mkdir(path.join(packageRoot, 'src'), { recursive: true });
    await fsp.writeFile(path.join(packageRoot, 'tsconfig.json'), '{}');

    await expect(
      updateSelf({
        packageRoot,
        currentVersion: '2.1.0-beta.17',
        commandOutputFn: vi.fn(async () => '/usr/local') as any,
      }),
    ).rejects.toThrow('running from source');
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('updateSelf runs npm install -g when a newer version exists', async () => {
  const runFn = vi.fn(async () => undefined);
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npm' && args.join(' ') === 'prefix -g') {
      return '/usr/local';
    }
    if (name === 'npm' && args.join(' ') === 'view @nocobase/cli dist-tags --json') {
      return JSON.stringify({ beta: '2.1.0-beta.18' });
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  const result = await updateSelf({
    packageRoot: path.join('/usr/local', 'lib', 'node_modules', '@nocobase', 'cli'),
    currentVersion: '2.1.0-beta.17',
    channel: 'beta',
    commandOutputFn: commandOutputFn as any,
    runFn: runFn as any,
  });

  expect(result.action).toBe('updated');
  expect(result.packageSpec).toBe('@nocobase/cli@beta');
  expect(runFn).toHaveBeenCalledWith(
    'npm',
    ['install', '-g', '@nocobase/cli@beta'],
    expect.objectContaining({
      errorName: 'npm install',
      stdio: 'ignore',
    }),
  );
});

test('updateSelf forwards raw install output in verbose mode', async () => {
  const runFn = vi.fn(async () => undefined);
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npm' && args.join(' ') === 'prefix -g') {
      return '/usr/local';
    }
    if (name === 'npm' && args.join(' ') === 'view @nocobase/cli dist-tags --json') {
      return JSON.stringify({ beta: '2.1.0-beta.18' });
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  await updateSelf({
    packageRoot: path.join('/usr/local', 'lib', 'node_modules', '@nocobase', 'cli'),
    currentVersion: '2.1.0-beta.17',
    channel: 'beta',
    commandOutputFn: commandOutputFn as any,
    runFn: runFn as any,
    verbose: true,
  });

  expect(runFn).toHaveBeenCalledWith(
    'npm',
    ['install', '-g', '@nocobase/cli@beta'],
    expect.objectContaining({
      errorName: 'npm install',
      stdio: 'inherit',
    }),
  );
});

test('formatUnsupportedSelfUpdateMessage explains source installs clearly', () => {
  expect(
    formatUnsupportedSelfUpdateMessage({
      packageName: '@nocobase/cli',
      packageRoot: '/tmp/source/packages/core/cli',
      currentVersion: '2.1.0-beta.17',
      channel: 'beta',
      latestVersion: '2.1.0-beta.18',
      updateAvailable: true,
      installMethod: 'source',
      updatable: false,
      updateBlockedReason:
        'This CLI is running from source in a repository checkout. Automatic self-update is only supported for standard global npm installs. Upgrade this checkout through your repo workflow instead.',
    }),
  ).toContain('running from source');
});

test('getRecommendedSelfUpdateCommand only returns a command for supported global installs', () => {
  expect(
    getRecommendedSelfUpdateCommand({
      updatable: true,
      updateAvailable: true,
    }),
  ).toBe('nb self update --yes');

  expect(
    getRecommendedSelfUpdateCommand({
      updatable: false,
      updateAvailable: true,
    }),
  ).toBeUndefined();

  expect(
    getRecommendedSelfUpdateCommand({
      updatable: true,
      updateAvailable: false,
    }),
  ).toBeUndefined();
});

test('getSelfUpdatePackageSpec maps channels to npm dist-tags', () => {
  expect(
    getSelfUpdatePackageSpec({
      packageName: '@nocobase/cli',
      channel: 'latest',
    }),
  ).toBe('@nocobase/cli@latest');

  expect(
    getSelfUpdatePackageSpec({
      packageName: '@nocobase/cli',
      channel: 'beta',
    }),
  ).toBe('@nocobase/cli@beta');

  expect(
    getSelfUpdatePackageSpec({
      packageName: '@nocobase/cli',
      channel: 'alpha',
    }),
  ).toBe('@nocobase/cli@alpha');
});
