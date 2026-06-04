/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { normalizeActions } from '../PermissionEditors';

describe('permission editors', () => {
  it('falls back to scopeId when appended scope is empty', () => {
    expect(
      normalizeActions([
        {
          name: 'view',
          fields: ['title'],
          scopeId: 123,
          scope: {},
        },
      ]),
    ).toEqual({
      view: {
        name: 'view',
        fields: ['title'],
        scopeId: 123,
        scope: { id: 123 },
      },
    });
  });
});
