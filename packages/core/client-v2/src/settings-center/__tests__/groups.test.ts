/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { SETTINGS_GROUPS } from '../groups';

describe('settings center groups', () => {
  it('places the plugin manager immediately after AI employees', () => {
    expect(SETTINGS_GROUPS.map((group) => group.key)).toEqual([
      'applications',
      'data',
      'access',
      'automation',
      'ai',
      'plugins',
      'system',
    ]);
  });
});
