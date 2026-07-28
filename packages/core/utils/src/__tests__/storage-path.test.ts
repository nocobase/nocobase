/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { vi } from 'vitest';
import { resolvePluginStoragePath, resolveStorageRoot, storagePathJoin } from '../storage-path';

describe('storage-path', () => {
  const originalStoragePath = process.env.STORAGE_PATH;
  const originalPluginStoragePath = process.env.PLUGIN_STORAGE_PATH;

  function mockCwd(cwd: string) {
    vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  }

  afterEach(() => {
    vi.restoreAllMocks();

    if (originalStoragePath === undefined) {
      delete process.env.STORAGE_PATH;
    } else {
      process.env.STORAGE_PATH = originalStoragePath;
    }

    if (originalPluginStoragePath === undefined) {
      delete process.env.PLUGIN_STORAGE_PATH;
    } else {
      process.env.PLUGIN_STORAGE_PATH = originalPluginStoragePath;
    }
  });

  it('uses the default storage directory when STORAGE_PATH is not set', () => {
    const cwd = path.join('/tmp', 'nocobase-app');
    mockCwd(cwd);
    delete process.env.STORAGE_PATH;

    expect(resolveStorageRoot()).toBe(path.join(cwd, 'storage'));
    expect(storagePathJoin('uploads')).toBe(path.join(cwd, 'storage', 'uploads'));
  });

  it('uses the app root storage directory when the process cwd is source', () => {
    const appRoot = path.join('/tmp', 'nocobase-app');
    const sourceDir = path.join(appRoot, 'source');
    mockCwd(sourceDir);
    delete process.env.STORAGE_PATH;

    expect(resolveStorageRoot()).toBe(path.join(appRoot, 'storage'));
    expect(storagePathJoin('portals', 'main', 'customer')).toBe(
      path.join(appRoot, 'storage', 'portals', 'main', 'customer'),
    );
  });

  it('resolves a relative STORAGE_PATH from cwd', () => {
    const cwd = path.join('/tmp', 'nocobase-app');
    mockCwd(cwd);
    process.env.STORAGE_PATH = 'custom-storage';

    expect(resolveStorageRoot()).toBe(path.join(cwd, 'custom-storage'));
    expect(storagePathJoin('tmp', 'backups')).toBe(path.join(cwd, 'custom-storage', 'tmp', 'backups'));
  });

  it('keeps an absolute STORAGE_PATH unchanged', () => {
    process.env.STORAGE_PATH = path.resolve('/tmp', 'nocobase-storage');

    expect(resolveStorageRoot()).toBe(process.env.STORAGE_PATH);
  });

  it('prefers PLUGIN_STORAGE_PATH over STORAGE_PATH for plugin storage', () => {
    const cwd = path.join('/tmp', 'nocobase-app');
    mockCwd(cwd);
    process.env.STORAGE_PATH = 'custom-storage';
    process.env.PLUGIN_STORAGE_PATH = 'plugin-storage';

    expect(resolvePluginStoragePath()).toBe(path.join(cwd, 'plugin-storage'));
  });

  it('falls back to the storage plugins directory when PLUGIN_STORAGE_PATH is not set', () => {
    const cwd = path.join('/tmp', 'nocobase-app');
    mockCwd(cwd);
    process.env.STORAGE_PATH = 'custom-storage';
    delete process.env.PLUGIN_STORAGE_PATH;

    expect(resolvePluginStoragePath()).toBe(path.join(cwd, 'custom-storage', 'plugins'));
  });
});
