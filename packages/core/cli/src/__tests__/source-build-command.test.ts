/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  runNocoBaseCommand: vi.fn(),
  setVerboseMode: vi.fn(),
  resolveLocalPluginWorkspaceSync: vi.fn(),
  isCliManagedSourceApp: vi.fn(),
  syncPluginWorkspace: vi.fn(),
  summarizePluginWorkspaceSync: vi.fn(),
  printInfo: vi.fn(),
  printWarning: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock('../lib/run-npm.js', () => ({
  runNocoBaseCommand: mocks.runNocoBaseCommand,
}));

vi.mock('../lib/ui.js', () => ({
  setVerboseMode: mocks.setVerboseMode,
  printInfo: mocks.printInfo,
  printWarning: mocks.printWarning,
}));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: mocks.readFile,
    default: {
      ...actual,
      readFile: mocks.readFile,
    },
  };
});

vi.mock('../lib/plugin-workspace.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/plugin-workspace.js')>();
  return {
    ...actual,
    resolveLocalPluginWorkspaceSync: mocks.resolveLocalPluginWorkspaceSync,
    isCliManagedSourceApp: mocks.isCliManagedSourceApp,
    syncPluginWorkspace: mocks.syncPluginWorkspace,
    summarizePluginWorkspaceSync: mocks.summarizePluginWorkspaceSync,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.runNocoBaseCommand.mockResolvedValue(undefined);
  mocks.resolveLocalPluginWorkspaceSync.mockReturnValue({
    appPath: '/tmp/app',
    sourcePath: '/tmp/app/source',
  });
  mocks.isCliManagedSourceApp.mockReturnValue(true);
  mocks.syncPluginWorkspace.mockResolvedValue({
    createdPluginWorkspace: false,
    createdSourcePluginRoot: false,
    linked: [],
    relinked: [],
    removedDangling: [],
    warnings: [],
    skipped: [],
    changed: false,
  });
  mocks.summarizePluginWorkspaceSync.mockReturnValue([]);
  mocks.readFile.mockRejectedValue(new Error('missing'));
});

test('source build syncs targeted plugin workspace entries and forwards --tar', async () => {
  const { default: SourceBuild } = await import('../commands/source/build.js');

  const command = Object.assign(Object.create(SourceBuild.prototype), {
    parse: vi.fn(async () => ({
      args: {
        packages: ['@my-scope/plugin-a'],
      },
      flags: {
        cwd: '/tmp/app/source',
        'no-dts': false,
        sourcemap: false,
        tar: true,
        verbose: false,
      },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await SourceBuild.prototype.run.call(command);

  expect(mocks.resolveLocalPluginWorkspaceSync).toHaveBeenCalledWith({
    cwd: '/tmp/app/source',
    supportAppPath: false,
  });
  expect(mocks.syncPluginWorkspace).toHaveBeenCalledWith({
    appPath: '/tmp/app',
    sourcePath: '/tmp/app/source',
    mode: 'targeted',
    targetPackageNames: ['@my-scope/plugin-a'],
  });
  expect(mocks.runNocoBaseCommand).toHaveBeenCalledWith(['build', '@my-scope/plugin-a', '--tar'], {
    cwd: '/tmp/app/source',
    stdio: 'ignore',
  });
  expect(mocks.printInfo).toHaveBeenCalledWith('Tarball output directory: /tmp/app/source/storage/tar');
});

test('source build syncs all top-level plugins when no package is specified', async () => {
  const { default: SourceBuild } = await import('../commands/source/build.js');

  const command = Object.assign(Object.create(SourceBuild.prototype), {
    parse: vi.fn(async () => ({
      args: {
        packages: [],
      },
      flags: {
        cwd: '/tmp/app/source',
        'no-dts': false,
        sourcemap: true,
        tar: false,
        verbose: true,
      },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await SourceBuild.prototype.run.call(command);

  expect(mocks.syncPluginWorkspace).toHaveBeenCalledWith({
    appPath: '/tmp/app',
    sourcePath: '/tmp/app/source',
    mode: 'all',
    targetPackageNames: [],
  });
  expect(mocks.runNocoBaseCommand).toHaveBeenCalledWith(['build', '--sourcemap'], {
    cwd: '/tmp/app/source',
    stdio: 'inherit',
  });
});

test('source build prints tarball path summary when target package metadata is available', async () => {
  const { default: SourceBuild } = await import('../commands/source/build.js');
  mocks.readFile.mockResolvedValueOnce(
    JSON.stringify({
      name: '@my-scope/plugin-a',
      version: '1.0.0',
    }),
  );

  const command = Object.assign(Object.create(SourceBuild.prototype), {
    parse: vi.fn(async () => ({
      args: {
        packages: ['@my-scope/plugin-a'],
      },
      flags: {
        cwd: '/tmp/app/source',
        'no-dts': false,
        sourcemap: false,
        tar: true,
        verbose: false,
      },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await SourceBuild.prototype.run.call(command);

  expect(mocks.printInfo).toHaveBeenCalledWith(
    'Tarball created: /tmp/app/source/storage/tar/@my-scope/plugin-a-1.0.0.tgz',
  );
});

test('source build keeps old behavior for plain source repos', async () => {
  const { default: SourceBuild } = await import('../commands/source/build.js');
  mocks.resolveLocalPluginWorkspaceSync.mockReturnValue({
    appPath: '/tmp',
    sourcePath: '/tmp/source',
  });
  mocks.isCliManagedSourceApp.mockReturnValue(false);

  const command = Object.assign(Object.create(SourceBuild.prototype), {
    parse: vi.fn(async () => ({
      args: {
        packages: ['@my-scope/plugin-a'],
      },
      flags: {
        cwd: '/tmp/source',
        'no-dts': false,
        sourcemap: false,
        tar: false,
        verbose: false,
      },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await SourceBuild.prototype.run.call(command);

  expect(mocks.syncPluginWorkspace).not.toHaveBeenCalled();
  expect(mocks.runNocoBaseCommand).toHaveBeenCalledWith(['build', '@my-scope/plugin-a'], {
    cwd: '/tmp/source',
    stdio: 'ignore',
  });
});
