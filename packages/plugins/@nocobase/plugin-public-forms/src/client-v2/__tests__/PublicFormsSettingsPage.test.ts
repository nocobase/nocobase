/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { fromCollectionCascaderValue, toCollectionCascaderValue } from '../pages/PublicFormsSettingsPage';

describe('PublicFormsSettingsPage collection cascader value', () => {
  it('converts stored collection values to cascader paths', () => {
    expect(toCollectionCascaderValue('main:users')).toEqual(['main', 'users']);
    expect(toCollectionCascaderValue('users')).toEqual(['main', 'users']);
  });

  it('converts cascader paths to stored collection values', () => {
    expect(fromCollectionCascaderValue(['main', 'users'])).toBe('main:users');
    expect(fromCollectionCascaderValue('main:users')).toBe('main:users');
  });
});
