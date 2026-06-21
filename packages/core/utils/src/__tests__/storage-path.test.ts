/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { resolvePluginStoragePath, resolveStorageRoot, storagePathJoin } from '../storage-path';

describe('storage-path', () => {
  const originalStoragePath = process.env.STORAGE_PATH;
  const originalPluginStoragePath = process.env.PLUGIN_STORAGE_PATH;

  afterEach(() => {
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
    delete process.env.STORAGE_PATH;

    expect(resolveStorageRoot()).toBe(path.resolve(process.cwd(), 'storage'));
    expect(storagePathJoin('uploads')).toBe(path.resolve(process.cwd(), 'storage/uploads'));
  });

  it('resolves a relative STORAGE_PATH from cwd', () => {
    process.env.STORAGE_PATH = 'custom-storage';

    expect(resolveStorageRoot()).toBe(path.resolve(process.cwd(), 'custom-storage'));
    expect(storagePathJoin('tmp', 'backups')).toBe(path.resolve(process.cwd(), 'custom-storage/tmp/backups'));
  });

  it('keeps an absolute STORAGE_PATH unchanged', () => {
    process.env.STORAGE_PATH = path.resolve('/tmp', 'nocobase-storage');

    expect(resolveStorageRoot()).toBe(process.env.STORAGE_PATH);
  });

  it('prefers PLUGIN_STORAGE_PATH over STORAGE_PATH for plugin storage', () => {
    process.env.STORAGE_PATH = 'custom-storage';
    process.env.PLUGIN_STORAGE_PATH = 'plugin-storage';

    expect(resolvePluginStoragePath()).toBe(path.resolve(process.cwd(), 'plugin-storage'));
  });

  it('falls back to the storage plugins directory when PLUGIN_STORAGE_PATH is not set', () => {
    process.env.STORAGE_PATH = 'custom-storage';
    delete process.env.PLUGIN_STORAGE_PATH;

    expect(resolvePluginStoragePath()).toBe(path.resolve(process.cwd(), 'custom-storage/plugins'));
  });
});
