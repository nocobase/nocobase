/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import enUS from '../../locale/en-US.json';
import zhCN from '../../locale/zh-CN.json';

const gitSyncKeys = [
  'Sync code',
  'GitHub source',
  'GitHub credential',
  'Select a Secret variable',
  'Test connection',
  'Pull from Git',
  'Push to Git',
  'Disconnect',
  'In sync',
  'Local changes',
  'Remote changes',
  'Diverged',
  'Initial sync needs a clear source',
  'The configured credential is unavailable',
  'GitHub authentication failed',
  'The sync provider is unavailable',
  'You do not have permission to perform this sync operation',
] as const;

const portalWorkspaceKeys = [
  'Binary file',
  'Binary files are read-only in the code editor.',
  'Download file',
  'Failed to download file',
] as const;

const vscLocaleCollisionKeys = [
  'Actions',
  'Cancel',
  'Copy code',
  'Create',
  'Failed to load history',
  'Failed to restore version',
  'File already exists',
  'Folder already exists',
  'Folder is not empty',
  'Import',
  'Import workspace',
  'Invalid file path',
  'Retry',
  'Save',
  'Restored from',
] as const;

describe('plugin-light-extension client-v2 locale entries', () => {
  it('keeps English and Chinese keys aligned for client-v2 features', () => {
    expect(Object.keys(enUS).sort()).toEqual(Object.keys(zhCN).sort());

    for (const key of gitSyncKeys) {
      expect(enUS[key]).toBeTruthy();
      expect(zhCN[key]).toBeTruthy();
    }

    for (const key of portalWorkspaceKeys) {
      expect(enUS[key]).toBeTruthy();
      expect(zhCN[key]).toBeTruthy();
    }
  });

  it('keeps the Light Extension wording for all VSC locale collisions', () => {
    expect(vscLocaleCollisionKeys).toHaveLength(15);
    for (const key of vscLocaleCollisionKeys) {
      expect(enUS[key]).toBeTruthy();
      expect(zhCN[key]).toBeTruthy();
    }
    expect(zhCN['Folder is not empty']).toBe('文件夹不为空');
    expect(zhCN['Invalid file path']).toBe('无效文件路径');
    expect(zhCN['Restored from']).toBe('已从版本恢复');
  });
});
