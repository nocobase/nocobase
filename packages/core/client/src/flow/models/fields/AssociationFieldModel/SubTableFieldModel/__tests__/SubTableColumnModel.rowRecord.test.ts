/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  getLatestSubTableRowRecord,
  buildRowPathFromFieldIndex,
  getSubTableCellDisabled,
  shouldReuseSubTableFieldRenderer,
} from '../SubTableColumnModel';

describe('SubTableColumnModel row record helpers', () => {
  it('builds the row path from fieldIndex entries', () => {
    expect(buildRowPathFromFieldIndex(['roles:0'])).toEqual(['roles', 0]);
    expect(buildRowPathFromFieldIndex(['users:1', 'roles:2'])).toEqual(['users', 1, 'roles', 2]);
  });

  it('prefers the latest row value from form over the fallback record', () => {
    const form = {
      getFieldValue: vi.fn((path: any) => {
        if (JSON.stringify(path) === JSON.stringify(['roles', 0])) {
          return { uid: 'role-uid-1', __is_new__: true };
        }
      }),
    };
    const fallback = { uid: 'stale-role', __is_new__: false };

    expect(getLatestSubTableRowRecord(form, ['roles:0'], fallback)).toEqual({
      uid: 'role-uid-1',
      __is_new__: true,
    });
    expect(form.getFieldValue).toHaveBeenCalledWith(['roles', 0]);
  });

  it('falls back to the record when latest row value is unavailable', () => {
    const form = { getFieldValue: vi.fn(() => undefined) };
    const fallback = { uid: 'stale-role', __is_new__: false };

    expect(getLatestSubTableRowRecord(form, ['roles:0'], fallback)).toBe(fallback);
  });

  it('lets row runtime state override static disabled state while preserving ACL restrictions', () => {
    expect(
      getSubTableCellDisabled({
        parentProps: { disabled: true },
        rowProps: { disabled: false },
        isNew: false,
      }),
    ).toBe(false);

    expect(
      getSubTableCellDisabled({
        parentProps: { disabled: false },
        rowProps: { disabled: false, aclDisabled: true },
        isNew: false,
      }),
    ).toBe(true);
  });

  it('rerenders the field renderer when row state props change', () => {
    const model = {};
    expect(
      shouldReuseSubTableFieldRenderer({ model, value: 'a', disabled: false }, { model, value: 'a', disabled: true }),
    ).toBe(false);
    expect(
      shouldReuseSubTableFieldRenderer(
        { model, value: 'a', hiddenModel: false },
        { model, value: 'a', hiddenModel: true },
      ),
    ).toBe(false);
    expect(
      shouldReuseSubTableFieldRenderer({ model, value: 'a', disabled: true }, { model, value: 'a', disabled: true }),
    ).toBe(true);
  });
});
