/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { applyActionScope, normalizeActions } from '../PermissionEditors';

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

  it('enables an action with all fields when setting scope on a disabled action', () => {
    expect(applyActionScope({}, 'view', { id: 1 }, [{ name: 'title' }, { name: 'status' }])).toEqual({
      view: {
        name: 'view',
        fields: ['title', 'status'],
        scope: { id: 1 },
      },
    });
  });

  it('preserves existing action fields when updating scope', () => {
    expect(
      applyActionScope(
        {
          view: {
            name: 'view',
            fields: ['title'],
          },
        },
        'view',
        { id: 2 },
        [{ name: 'title' }, { name: 'status' }],
      ),
    ).toEqual({
      view: {
        name: 'view',
        fields: ['title'],
        scope: { id: 2 },
      },
    });
  });
});
