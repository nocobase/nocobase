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
import { afterEach, beforeEach } from 'vitest';
import { expect, test, vi } from 'vitest';
import {
  compareVersions,
  formatUnsupportedSelfUpdateMessage,
  getSelfUpdatePackageSpec,
  getRecommendedSelfUpdateCommand,
  inspectSelfInstall,
  inspectSelfStatus,
  updateSelf,
} from '../lib/self-manager.js';

const originalCliRoot = process.env.NB_CLI_ROOT;
const MOCK_YARN_GLOBAL_DIR = path.join(path.sep, 'mock-home', '.config', 'yarn', 'global');
const MOCK_YARN_GLOBAL_BIN = path.join(path.sep, 'mock-home', '.yarn', 'bin');
const MOCK_YARN_PACKAGE_ROOT = path.join(MOCK_YARN_GLOBAL_DIR, 'node_modules', '@nocobase', 'cli');
const MOCK_PNPM_PACKAGE_ROOT = path.join(
  path.sep,
  'mock-home',
  'Library',
  'pnpm',
  'global',
  'v11',
  'mock-install',
  'node_modules',
  '@nocobase',
  'cli',
);

beforeEach(async () => {
  const temp = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-self-home-'));
  process.env.NB_CLI_ROOT = temp;
});

afterEach(async () => {
  if (process.env.NB_CLI_ROOT) {
    await fsp.rm(process.env.NB_CLI_ROOT, { recursive: true, force: true });
  }

  if (originalCliRoot === undefined) {
    delete process.env.NB_CLI_ROOT;
  } else {
    process.env.NB_CLI_ROOT = originalCliRoot;
  }
});

test('compareVersions handles prerelease ordering', () => {
  expect(compareVersions('2.1.0-beta.18', '2.1.0-beta.17')).toBeGreaterThan(0);
  expect(compareVersions('2.1.0', '2.1.0-beta.99')).toBeGreaterThan(0);
  expect(compareVersions('2.1.0-alpha.1', '2.1.0-beta.1')).toBeLessThan(0);
  expect(compareVersions('2.1.4-test.10', '2.1.4-test.2')).toBeGreaterThan(0);
});

test('inspectSelfStatus resolves latest version and install support for npm-global installs', async () => {
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npm' && args.join(' ') === 'prefix -g') {
      return '/usr/local';
    }
    if (name === 'yarn' && args.join(' ') === 'global dir') {
      return MOCK_YARN_GLOBAL_DIR;
    }
    if (name === 'yarn' && args.join(' ') === 'global bin') {
      return MOCK_YARN_GLOBAL_BIN;
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

test('inspectSelfStatus recognizes pnpm-global installs', async () => {
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npm' && args.join(' ') === 'prefix -g') {
      return '/usr/local';
    }
    if (name === 'yarn' && args.join(' ') === 'global dir') {
      return MOCK_YARN_GLOBAL_DIR;
    }
    if (name === 'yarn' && args.join(' ') === 'global bin') {
      return MOCK_YARN_GLOBAL_BIN;
    }
    if (name === 'npm' && args.join(' ') === 'view @nocobase/cli dist-tags --json') {
      return JSON.stringify({ latest: '2.1.0', beta: '2.1.0-beta.18' });
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  const status = await inspectSelfStatus({
    packageRoot: MOCK_PNPM_PACKAGE_ROOT,
    currentVersion: '2.1.0-beta.17',
    channel: 'auto',
    commandOutputFn: commandOutputFn as any,
  });

  expect(status.installMethod).toBe('pnpm-global');
  expect(status.latestVersion).toBe('2.1.0-beta.18');
  expect(status.updateAvailable).toBe(true);
  expect(status.updatable).toBe(true);
  expect(status.updateBlockedReason).toBeUndefined();
});

test('inspectSelfStatus recognizes yarn-global installs', async () => {
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npm' && args.join(' ') === 'prefix -g') {
      return '/usr/local';
    }
    if (name === 'yarn' && args.join(' ') === 'global dir') {
      return MOCK_YARN_GLOBAL_DIR;
    }
    if (name === 'yarn' && args.join(' ') === 'global bin') {
      return MOCK_YARN_GLOBAL_BIN;
    }
    if (name === 'npm' && args.join(' ') === 'view @nocobase/cli dist-tags --json') {
      return JSON.stringify({ latest: '2.1.0', beta: '2.1.0-beta.18' });
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  const status = await inspectSelfStatus({
    packageRoot: MOCK_YARN_PACKAGE_ROOT,
    currentVersion: '2.1.0-beta.17',
    channel: 'auto',
    commandOutputFn: commandOutputFn as any,
  });

  expect(status.installMethod).toBe('yarn-global');
  expect(status.latestVersion).toBe('2.1.0-beta.18');
  expect(status.updateAvailable).toBe(true);
  expect(status.updatable).toBe(true);
  expect(status.updateBlockedReason).toBeUndefined();
});

test('inspectSelfStatus detects test prerelease versions as test channel', async () => {
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npm' && args.join(' ') === 'prefix -g') {
      return '/usr/local';
    }
    if (name === 'yarn' && args.join(' ') === 'global dir') {
      return MOCK_YARN_GLOBAL_DIR;
    }
    if (name === 'yarn' && args.join(' ') === 'global bin') {
      return MOCK_YARN_GLOBAL_BIN;
    }
    if (name === 'npm' && args.join(' ') === 'view @nocobase/cli dist-tags --json') {
      return JSON.stringify({ latest: '2.1.4', test: '2.1.4-test.10' });
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  const status = await inspectSelfStatus({
    packageRoot: path.join('/usr/local', 'lib', 'node_modules', '@nocobase', 'cli'),
    currentVersion: '2.1.4-test.2',
    channel: 'auto',
    commandOutputFn,
  });

  expect(status.channel).toBe('test');
  expect(status.latestVersion).toBe('2.1.4-test.10');
  expect(status.updateAvailable).toBe(true);
});

test('inspectSelfStatus detects install method on every call', async () => {
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npm' && args.join(' ') === 'prefix -g') {
      return '/opt/global';
    }
    if (name === 'yarn' && args.join(' ') === 'global dir') {
      return MOCK_YARN_GLOBAL_DIR;
    }
    if (name === 'yarn' && args.join(' ') === 'global bin') {
      return MOCK_YARN_GLOBAL_BIN;
    }
    if (name === 'npm' && args.join(' ') === 'view @nocobase/cli dist-tags --json') {
      return JSON.stringify({ latest: '2.1.0' });
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  const packageRoot = path.join('/opt', 'apps', 'demo', 'node_modules', '@nocobase', 'cli');

  const first = await inspectSelfStatus({
    packageRoot,
    currentVersion: '2.1.0-beta.17',
    channel: 'auto',
    commandOutputFn: commandOutputFn as any,
  });

  const prefixCallsAfterFirst = commandOutputFn.mock.calls.filter(
    ([name, args]) => name === 'npm' && Array.isArray(args) && args.join(' ') === 'prefix -g',
  ).length;
  const yarnCallsAfterFirst = commandOutputFn.mock.calls.filter(
    ([name, args]) => name === 'yarn' && Array.isArray(args) && args.join(' ') === 'global dir',
  ).length;

  const second = await inspectSelfStatus({
    packageRoot,
    currentVersion: '2.1.0-beta.17',
    channel: 'auto',
    commandOutputFn: commandOutputFn as any,
  });

  const prefixCallsAfterSecond = commandOutputFn.mock.calls.filter(
    ([name, args]) => name === 'npm' && Array.isArray(args) && args.join(' ') === 'prefix -g',
  ).length;
  const yarnCallsAfterSecond = commandOutputFn.mock.calls.filter(
    ([name, args]) => name === 'yarn' && Array.isArray(args) && args.join(' ') === 'global dir',
  ).length;

  expect(first.installMethod).toBe('package-local');
  expect(second.installMethod).toBe('package-local');
  expect(prefixCallsAfterFirst).toBe(1);
  expect(prefixCallsAfterSecond).toBe(2);
  expect(yarnCallsAfterFirst).toBe(1);
  expect(yarnCallsAfterSecond).toBe(2);
});

test('inspectSelfInstall only performs install-method detection', async () => {
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npm' && args.join(' ') === 'prefix -g') {
      return '/opt/global';
    }
    if (name === 'yarn' && args.join(' ') === 'global dir') {
      return MOCK_YARN_GLOBAL_DIR;
    }
    if (name === 'yarn' && args.join(' ') === 'global bin') {
      return MOCK_YARN_GLOBAL_BIN;
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  const install = await inspectSelfInstall({
    packageRoot: path.join('/opt', 'apps', 'demo', 'node_modules', '@nocobase', 'cli'),
    commandOutputFn: commandOutputFn as any,
  });

  expect(install.installMethod).toBe('package-local');
  expect(commandOutputFn).toHaveBeenCalledTimes(3);
  expect(commandOutputFn).toHaveBeenCalledWith(
    'npm',
    ['prefix', '-g'],
    expect.objectContaining({ errorName: 'npm prefix' }),
  );
  expect(commandOutputFn).toHaveBeenCalledWith(
    'yarn',
    ['global', 'dir'],
    expect.objectContaining({ errorName: 'yarn global dir' }),
  );
  expect(commandOutputFn).toHaveBeenCalledWith(
    'yarn',
    ['global', 'bin'],
    expect.objectContaining({ errorName: 'yarn global bin' }),
  );
});

test('inspectSelfInstall recognizes yarn-global from the invoked bin path', async () => {
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npm' && args.join(' ') === 'prefix -g') {
      return '/opt/global';
    }
    if (name === 'yarn' && args.join(' ') === 'global dir') {
      return MOCK_YARN_GLOBAL_DIR;
    }
    if (name === 'yarn' && args.join(' ') === 'global bin') {
      return MOCK_YARN_GLOBAL_BIN;
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  const install = await inspectSelfInstall({
    packageRoot: path.join('/tmp/cache/node_modules/@nocobase/cli'),
    currentBinPath: path.join(MOCK_YARN_GLOBAL_BIN, 'nb'),
    commandOutputFn: commandOutputFn as any,
  });

  expect(install.installMethod).toBe('yarn-global');
});

test('inspectSelfInstall ignores stale install-method cache files', async () => {
  if (!process.env.NB_CLI_ROOT) {
    throw new Error('NB_CLI_ROOT is not set');
  }

  const packageRoot = path.join('/tmp/cache/node_modules/@nocobase/cli');
  const currentBinPath = path.join(MOCK_YARN_GLOBAL_BIN, 'nb');
  const cacheDir = path.join(process.env.NB_CLI_ROOT, '.nocobase');
  await fsp.mkdir(cacheDir, { recursive: true });
  await fsp.writeFile(
    path.join(cacheDir, 'self-install-methods.json'),
    JSON.stringify({
      entries: {
        [path.join(packageRoot, 'bin', 'run.js')]: {
          installMethod: 'package-local',
          currentBinPath,
          yarnGlobalBin: MOCK_YARN_GLOBAL_BIN,
          yarnGlobalDir: MOCK_YARN_GLOBAL_DIR,
        },
      },
    }),
  );

  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npm' && args.join(' ') === 'prefix -g') {
      return '/opt/global';
    }
    if (name === 'yarn' && args.join(' ') === 'global dir') {
      return MOCK_YARN_GLOBAL_DIR;
    }
    if (name === 'yarn' && args.join(' ') === 'global bin') {
      return MOCK_YARN_GLOBAL_BIN;
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  const install = await inspectSelfInstall({
    packageRoot,
    currentBinPath,
    commandOutputFn: commandOutputFn as any,
  });

  expect(install.installMethod).toBe('yarn-global');
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
    if (name === 'yarn' && args.join(' ') === 'global dir') {
      return MOCK_YARN_GLOBAL_DIR;
    }
    if (name === 'yarn' && args.join(' ') === 'global bin') {
      return MOCK_YARN_GLOBAL_BIN;
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

test('updateSelf runs pnpm add -g for pnpm-global installs', async () => {
  const runFn = vi.fn(async () => undefined);
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npm' && args.join(' ') === 'prefix -g') {
      return '/usr/local';
    }
    if (name === 'yarn' && args.join(' ') === 'global dir') {
      return MOCK_YARN_GLOBAL_DIR;
    }
    if (name === 'yarn' && args.join(' ') === 'global bin') {
      return MOCK_YARN_GLOBAL_BIN;
    }
    if (name === 'npm' && args.join(' ') === 'view @nocobase/cli dist-tags --json') {
      return JSON.stringify({ beta: '2.1.0-beta.18' });
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  const result = await updateSelf({
    packageRoot: MOCK_PNPM_PACKAGE_ROOT,
    currentVersion: '2.1.0-beta.17',
    channel: 'beta',
    commandOutputFn: commandOutputFn as any,
    runFn: runFn as any,
  });

  expect(result.action).toBe('updated');
  expect(result.packageSpec).toBe('@nocobase/cli@beta');
  expect(runFn).toHaveBeenCalledWith(
    'pnpm',
    ['add', '-g', '@nocobase/cli@beta'],
    expect.objectContaining({
      errorName: 'pnpm add',
      stdio: 'ignore',
    }),
  );
});

test('updateSelf runs yarn global add for yarn-global installs', async () => {
  const runFn = vi.fn(async () => undefined);
  const commandOutputFn = vi.fn(async (name: string, args: string[]) => {
    if (name === 'npm' && args.join(' ') === 'prefix -g') {
      return '/usr/local';
    }
    if (name === 'yarn' && args.join(' ') === 'global dir') {
      return MOCK_YARN_GLOBAL_DIR;
    }
    if (name === 'yarn' && args.join(' ') === 'global bin') {
      return MOCK_YARN_GLOBAL_BIN;
    }
    if (name === 'npm' && args.join(' ') === 'view @nocobase/cli dist-tags --json') {
      return JSON.stringify({ beta: '2.1.0-beta.18' });
    }
    throw new Error(`unexpected command: ${name} ${args.join(' ')}`);
  });

  const result = await updateSelf({
    packageRoot: MOCK_YARN_PACKAGE_ROOT,
    currentVersion: '2.1.0-beta.17',
    channel: 'beta',
    commandOutputFn: commandOutputFn as any,
    runFn: runFn as any,
  });

  expect(result.action).toBe('updated');
  expect(result.packageSpec).toBe('@nocobase/cli@beta');
  expect(runFn).toHaveBeenCalledWith(
    'yarn',
    ['global', 'add', '@nocobase/cli@beta'],
    expect.objectContaining({
      errorName: 'yarn global add',
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
        'This CLI is running from source in a repository checkout. Automatic self-update is only supported for standard global npm, pnpm, or yarn installs. Upgrade this checkout through your repo workflow instead.',
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
      channel: 'test',
    }),
  ).toBe('@nocobase/cli@test');

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
