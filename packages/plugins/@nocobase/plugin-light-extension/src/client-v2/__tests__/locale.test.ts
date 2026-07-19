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
  'GitHub token',
  'Select a secret variable or enter a GitHub token',
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

const clientAppKeys = [
  'Custom frontend',
  'Upload application',
  'Replace files',
  'You do not have permission to manage light extension applications',
  'This application is used by a workspace and cannot be removed',
] as const;

describe('plugin-light-extension client-v2 locale entries', () => {
  it('keeps English and Chinese keys aligned for Git sync settings', () => {
    expect(Object.keys(enUS).sort()).toEqual(Object.keys(zhCN).sort());

    for (const key of gitSyncKeys) {
      expect(enUS[key]).toBeTruthy();
      expect(zhCN[key]).toBeTruthy();
    }

    for (const key of clientAppKeys) {
      expect(enUS[key]).toBeTruthy();
      expect(zhCN[key]).toBeTruthy();
    }
  });
});
