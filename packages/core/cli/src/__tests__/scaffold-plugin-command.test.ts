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
  resolveLocalPluginWorkspaceSync: vi.fn(),
  isCliManagedSourceApp: vi.fn(),
  syncPluginWorkspace: vi.fn(),
  printInfo: vi.fn(),
  printWarning: vi.fn(),
  runNocoBaseCommand: vi.fn(),
  stat: vi.fn(),
  rm: vi.fn(),
}));

vi.mock('../lib/plugin-workspace.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/plugin-workspace.js')>();
  return {
    ...actual,
    resolveLocalPluginWorkspaceSync: mocks.resolveLocalPluginWorkspaceSync,
    isCliManagedSourceApp: mocks.isCliManagedSourceApp,
    syncPluginWorkspace: mocks.syncPluginWorkspace,
  };
});

vi.mock('../lib/ui.js', () => ({
  printInfo: mocks.printInfo,
  printWarning: mocks.printWarning,
}));

vi.mock('../lib/run-npm.js', () => ({
  runNocoBaseCommand: mocks.runNocoBaseCommand,
}));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    stat: mocks.stat,
    rm: mocks.rm,
    default: {
      ...actual,
      stat: mocks.stat,
      rm: mocks.rm,
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resolveLocalPluginWorkspaceSync.mockReturnValue({
    appPath: '/tmp/app',
    sourcePath: '/tmp/app/source',
  });
  mocks.isCliManagedSourceApp.mockReturnValue(true);
  mocks.syncPluginWorkspace.mockResolvedValue({
    createdPluginWorkspace: false,
    createdSourcePluginRoot: false,
    linked: ['@my-scope/plugin-hello'],
    relinked: [],
    removedDangling: [],
    warnings: [],
    skipped: [],
    changed: true,
  });
  mocks.runNocoBaseCommand.mockResolvedValue(undefined);
  mocks.stat.mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }));
  mocks.rm.mockResolvedValue(undefined);
});

test('scaffold plugin supports app path cwd and syncs the created plugin', async () => {
  const { default: ScaffoldPlugin } = await import('../commands/scaffold/plugin.js');

  const command = Object.assign(Object.create(ScaffoldPlugin.prototype), {
    parse: vi.fn(async () => ({
      args: {
        pkg: '@my-scope/plugin-hello',
      },
      flags: {
        cwd: '/tmp/app',
        'force-recreate': false,
      },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await ScaffoldPlugin.prototype.run.call(command);

  expect(mocks.resolveLocalPluginWorkspaceSync).toHaveBeenCalledWith({
    cwd: '/tmp/app',
    supportAppPath: true,
  });
  expect(mocks.runNocoBaseCommand).toHaveBeenCalledWith(['pm', 'create', '@my-scope/plugin-hello'], {
    cwd: '/tmp/app/source',
    env: {
      LOGGER_SILENT: 'true',
      NB_PLUGIN_TARGET_ROOT: '/tmp/app/plugins',
    },
  });
  expect(mocks.syncPluginWorkspace).toHaveBeenCalledWith({
    appPath: '/tmp/app',
    sourcePath: '/tmp/app/source',
    mode: 'targeted',
    targetPackageNames: ['@my-scope/plugin-hello'],
    forceRecreate: false,
  });
});

test('scaffold plugin force-recreate removes the top-level plugin dir before regenerating', async () => {
  const { default: ScaffoldPlugin } = await import('../commands/scaffold/plugin.js');
  mocks.stat.mockResolvedValue({ isDirectory: () => true });

  const command = Object.assign(Object.create(ScaffoldPlugin.prototype), {
    parse: vi.fn(async () => ({
      args: {
        pkg: '@my-scope/plugin-hello',
      },
      flags: {
        cwd: '/tmp/app',
        'force-recreate': true,
      },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await ScaffoldPlugin.prototype.run.call(command);

  expect(mocks.rm).toHaveBeenCalledWith('/tmp/app/plugins/@my-scope/plugin-hello', {
    recursive: true,
    force: true,
  });
  expect(mocks.runNocoBaseCommand).toHaveBeenCalledWith(['pm', 'create', '@my-scope/plugin-hello', '--force-recreate'], {
    cwd: '/tmp/app/source',
    env: {
      LOGGER_SILENT: 'true',
      NB_PLUGIN_TARGET_ROOT: '/tmp/app/plugins',
    },
  });
  expect(mocks.syncPluginWorkspace).toHaveBeenCalledWith(
    expect.objectContaining({
      forceRecreate: true,
    }),
  );
});

test('scaffold plugin falls back to the old source-repo behavior outside CLI-managed apps', async () => {
  const { default: ScaffoldPlugin } = await import('../commands/scaffold/plugin.js');
  mocks.resolveLocalPluginWorkspaceSync.mockReturnValue({
    appPath: '/tmp',
    sourcePath: '/tmp/source',
  });
  mocks.isCliManagedSourceApp.mockReturnValue(false);

  const command = Object.assign(Object.create(ScaffoldPlugin.prototype), {
    parse: vi.fn(async () => ({
      args: {
        pkg: '@my-scope/plugin-hello',
      },
      flags: {
        cwd: '/tmp/source',
        'force-recreate': true,
      },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await ScaffoldPlugin.prototype.run.call(command);

  expect(mocks.syncPluginWorkspace).not.toHaveBeenCalled();
  expect(mocks.runNocoBaseCommand).toHaveBeenCalledWith(['pm', 'create', '@my-scope/plugin-hello', '--force-recreate'], {
    cwd: '/tmp/source',
    env: { LOGGER_SILENT: 'true' },
  });
});
