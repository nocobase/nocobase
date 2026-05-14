/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { getLatestSubTableRowRecord, buildRowPathFromFieldIndex } from '../SubTableColumnModel';
import { buildSubTableRowForkKey } from '../rowIdentity';
import {
  clearSubTablePendingRowFieldValue,
  clearSubTablePendingRowValues,
  getSubTablePendingRowValues,
  setSubTablePendingRowFieldValue,
} from '../SubTablePendingRowStore';

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

  it('merges pending row values over the latest form row', () => {
    const form = {
      getFieldValue: vi.fn(() => ({
        uid: 'role-uid-1',
        name: 'Old name',
        status: 'active',
      })),
    };
    const host = {};

    setSubTablePendingRowFieldValue(host, 'row:0', 'name', 'New name');

    expect(getLatestSubTableRowRecord(form, ['roles:0'], {}, getSubTablePendingRowValues(host, 'row:0'))).toEqual({
      uid: 'role-uid-1',
      name: 'New name',
      status: 'active',
    });
  });

  it('keeps explicit undefined pending values so cleared fields override stale row values', () => {
    const host = {};

    setSubTablePendingRowFieldValue(host, 'row:0', 'name', undefined);

    expect(
      getLatestSubTableRowRecord(
        undefined,
        undefined,
        { uid: 'role-uid-1', name: 'Old name' },
        getSubTablePendingRowValues(host, 'row:0'),
      ),
    ).toEqual({
      uid: 'role-uid-1',
      name: undefined,
    });
  });

  it('normalizes event-like pending values from composition end events', () => {
    const host = {};

    setSubTablePendingRowFieldValue(host, 'row:0', 'name', {
      target: { value: 'Composed text' },
      preventDefault: vi.fn(),
    });

    expect(getSubTablePendingRowValues(host, 'row:0')).toEqual({
      name: 'Composed text',
    });
  });

  it('does not store event-like pending values when no target value can be read', () => {
    const host = {};

    setSubTablePendingRowFieldValue(host, 'row:0', 'name', {
      preventDefault: vi.fn(),
    });

    expect(getSubTablePendingRowValues(host, 'row:0')).toBeUndefined();
    expect(
      getLatestSubTableRowRecord(
        undefined,
        undefined,
        { uid: 'role-uid-1', name: 'Old name' },
        getSubTablePendingRowValues(host, 'row:0'),
      ),
    ).toEqual({
      uid: 'role-uid-1',
      name: 'Old name',
    });

    setSubTablePendingRowFieldValue(host, 'row:1', 'name', 'Latest name');
    setSubTablePendingRowFieldValue(host, 'row:1', 'name', {
      preventDefault: vi.fn(),
    });

    expect(getSubTablePendingRowValues(host, 'row:1')).toEqual({
      name: 'Latest name',
    });
  });

  it('clears a committed pending field without removing other pending fields in the same row', () => {
    const host = {};

    setSubTablePendingRowFieldValue(host, 'row:0', 'name', 'Latest name');
    setSubTablePendingRowFieldValue(host, 'row:0', 'status', 'inactive');
    clearSubTablePendingRowFieldValue(host, 'row:0', 'name');

    expect(getSubTablePendingRowValues(host, 'row:0')).toEqual({
      status: 'inactive',
    });
    expect(
      getLatestSubTableRowRecord(
        undefined,
        undefined,
        { uid: 'role-uid-1', name: 'Committed name', status: 'active' },
        getSubTablePendingRowValues(host, 'row:0'),
      ),
    ).toEqual({
      uid: 'role-uid-1',
      name: 'Committed name',
      status: 'inactive',
    });
  });

  it('clears a pending row or the whole pending store', () => {
    const host = {};

    setSubTablePendingRowFieldValue(host, 'row:0', 'name', 'Row 0');
    setSubTablePendingRowFieldValue(host, 'row:1', 'name', 'Row 1');

    clearSubTablePendingRowValues(host, 'row:0');

    expect(getSubTablePendingRowValues(host, 'row:0')).toBeUndefined();
    expect(getSubTablePendingRowValues(host, 'row:1')).toEqual({ name: 'Row 1' });

    clearSubTablePendingRowValues(host);

    expect(getSubTablePendingRowValues(host, 'row:1')).toBeUndefined();
  });

  it('builds stable pending row keys from field index, row identity, and current row index', () => {
    expect(buildSubTableRowForkKey(['users:1'], 'pk:10', 2)).toBe('row:users:1:pk:10:2');
    expect(buildSubTableRowForkKey(undefined, undefined, 0)).toBe('row:root:row:0:0');
  });
});
