/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const mocks = vi.hoisted(() => ({
  getInstanceIdAsync: vi.fn(),
}));

vi.mock('@nocobase/license-kit', () => ({
  getInstanceIdAsync: mocks.getInstanceIdAsync,
}));

vi.mock('@nocobase/utils', async () => {
  const path = await import('node:path');
  return {
    storagePathJoin: (...segments: string[]) =>
      path.join(process.env.STORAGE_PATH || path.resolve(process.cwd(), 'storage'), ...segments),
  };
});

import { createInstanceId, getInstanceId, isLicenseKeyExists } from '../utils/instance';

describe('instance utils', () => {
  let storagePath: string;
  const originalStoragePath = process.env.STORAGE_PATH;

  beforeEach(async () => {
    vi.clearAllMocks();
    storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-plugin-license-'));
    process.env.STORAGE_PATH = storagePath;
  });

  afterEach(async () => {
    if (originalStoragePath === undefined) {
      delete process.env.STORAGE_PATH;
    } else {
      process.env.STORAGE_PATH = originalStoragePath;
    }
    await fs.rm(storagePath, { recursive: true, force: true });
  });

  test('createInstanceId reuses the saved instance id when force is false', async () => {
    const filePath = path.join(storagePath, '.license', 'instance-id');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, 'ins_saved\n');

    await expect(createInstanceId(false)).resolves.toBe('ins_saved');
    expect(mocks.getInstanceIdAsync).not.toHaveBeenCalled();
  });

  test('createInstanceId generates and saves the instance id when missing', async () => {
    mocks.getInstanceIdAsync.mockResolvedValue('ins_generated');

    await expect(createInstanceId(false)).resolves.toBe('ins_generated');
    await expect(fs.readFile(path.join(storagePath, '.license', 'instance-id'), 'utf8')).resolves.toBe(
      'ins_generated\n',
    );
    expect(mocks.getInstanceIdAsync).toHaveBeenCalledTimes(1);
  });

  test('getInstanceId force regenerates and returns the trimmed instance id', async () => {
    const filePath = path.join(storagePath, '.license', 'instance-id');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, 'ins_existing\n');
    mocks.getInstanceIdAsync.mockResolvedValue('ins_regenerated');

    await expect(getInstanceId()).resolves.toBe('ins_regenerated');
    await expect(fs.readFile(filePath, 'utf8')).resolves.toBe('ins_regenerated\n');
    expect(mocks.getInstanceIdAsync).toHaveBeenCalledTimes(1);
  });

  test('isLicenseKeyExists resolves from the storage path', async () => {
    const filePath = path.join(storagePath, '.license', 'license-key');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, 'license-key');

    await expect(isLicenseKeyExists()).resolves.toBe(true);
  });
});
