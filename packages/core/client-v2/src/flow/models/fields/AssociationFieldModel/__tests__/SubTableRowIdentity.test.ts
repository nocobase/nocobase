/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  getSubTableRowIdentity,
  normalizeSubTableRows,
  SUB_TABLE_TEMP_ROW_KEY,
} from '../SubTableFieldModel/rowIdentity';

describe('SubTable row identity', () => {
  it('keeps temp identity for unsaved rows and fills it when missing', () => {
    const rows = [
      {
        __is_new__: true,
        [SUB_TABLE_TEMP_ROW_KEY]: 'tmp-1',
        name: 'admin',
      },
      {
        __is_new__: true,
        [SUB_TABLE_TEMP_ROW_KEY]: 'tmp-existing',
        title: 'kept',
      },
      {
        __is_new__: true,
        title: 'needs-temp-key',
      },
    ];

    expect(getSubTableRowIdentity(rows[0], 'name')).toBe('tmp:tmp-1');

    const normalized = normalizeSubTableRows(rows);

    expect(normalized[1]).toBe(rows[1]);
    expect(normalized[2]).not.toBe(rows[2]);
    expect(normalized[2][SUB_TABLE_TEMP_ROW_KEY]).toBeTruthy();
    expect(getSubTableRowIdentity(normalized[2], 'id')).toMatch(/^tmp:/);
  });
});
