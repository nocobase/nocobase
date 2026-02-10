/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { normalizeFilterValueByOperator } from '../valueNormalization';

describe('normalizeFilterValueByOperator', () => {
  it('wraps scalar into array for $in', () => {
    expect(normalizeFilterValueByOperator('$in', 'a')).toEqual(['a']);
  });

  it('keeps arrays as-is for $in', () => {
    expect(normalizeFilterValueByOperator('$in', ['a', 'b'])).toEqual(['a', 'b']);
  });

  it('converts empty string to empty array for multi-value operators', () => {
    expect(normalizeFilterValueByOperator('$anyOf', '')).toEqual([]);
  });

  it('converts scalar date to [date, date] for $dateBetween', () => {
    expect(normalizeFilterValueByOperator('$dateBetween', '2024-01-01')).toEqual(['2024-01-01', '2024-01-01']);
  });

  it('keeps [start, end] as-is for $dateBetween', () => {
    expect(normalizeFilterValueByOperator('$dateBetween', ['2024-01-01', '2024-01-02'])).toEqual([
      '2024-01-01',
      '2024-01-02',
    ]);
  });

  it('converts [date] to [date, date] for $dateBetween', () => {
    expect(normalizeFilterValueByOperator('$dateBetween', ['2024-01-01'])).toEqual(['2024-01-01', '2024-01-01']);
  });

  it('fills missing side to [date, date] for $dateBetween', () => {
    expect(normalizeFilterValueByOperator('$dateBetween', ['2024-01-01', ''])).toEqual(['2024-01-01', '2024-01-01']);
    expect(normalizeFilterValueByOperator('$dateBetween', ['', '2024-01-01'])).toEqual(['2024-01-01', '2024-01-01']);
  });

  it('keeps date variable object as-is for $dateBetween', () => {
    const v = { type: 'today' };
    expect(normalizeFilterValueByOperator('$dateBetween', v)).toBe(v);
  });
});
