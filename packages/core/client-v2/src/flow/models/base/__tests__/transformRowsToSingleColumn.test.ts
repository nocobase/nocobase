/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { transformRowsToSingleColumn } from '../GridModel';
import { EMPTY_COLUMN_UID } from '@nocobase/flow-engine';

/** Helper to build rows */
function buildRows(structure: string[][][]): Record<string, string[][]> {
  const obj: Record<string, string[][]> = {};
  structure.forEach((row, i) => {
    obj[`row_${i}`] = row;
  });
  return obj;
}

describe('transformRowsToSingleColumn', () => {
  it('should return empty object when rows empty', () => {
    expect(transformRowsToSingleColumn({})).toEqual({});
  });

  it('should flatten columns into separate single-column rows preserving order', () => {
    const rows = buildRows([
      [['a'], ['b', 'c']],
      [['d'], ['e']],
    ]);
    const result = transformRowsToSingleColumn(rows);
    const all = Object.values(result).map((r) => r[0]);
    expect(all).toEqual([['a'], ['b', 'c'], ['d'], ['e']]);
  });

  it('should skip columns that only contain EMPTY_COLUMN_UID', () => {
    const rows = buildRows([[[EMPTY_COLUMN_UID], ['a']]]);
    const result = transformRowsToSingleColumn(rows);
    const all = Object.values(result).map((r) => r[0]);
    expect(all).toEqual([['a']]);
  });

  it('should filter out EMPTY_COLUMN_UID inside mixed columns', () => {
    const rows = buildRows([[['a', EMPTY_COLUMN_UID, 'b']]]);
    const result = transformRowsToSingleColumn(rows);
    const all = Object.values(result).map((r) => r[0]);
    expect(all).toEqual([['a', 'b']]);
  });

  it('should allow custom emptyColumnUid option', () => {
    const rows = buildRows([[['x'], ['y', '__EMPTY__']]]);
    const result = transformRowsToSingleColumn(rows, { emptyColumnUid: '__EMPTY__' });
    const all = Object.values(result).map((r) => r[0]);
    expect(all).toEqual([['x'], ['y']]);
  });
});
