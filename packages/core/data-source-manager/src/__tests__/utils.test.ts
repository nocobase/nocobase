/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { joinCollectionName, parseCollectionName } from '@nocobase/data-source-manager';

describe('utils', () => {
  it('should join collection name', async () => {
    expect(joinCollectionName('main', 'users')).toBe('users');
    expect(joinCollectionName('test', 'users')).toBe('test:users');
  });

  it('should parse collection name', async () => {
    expect(parseCollectionName('main:users')).toEqual(['main', 'users']);
    expect(parseCollectionName('users')).toEqual(['main', 'users']);
    expect(parseCollectionName('')).toEqual([]);
  });
});
