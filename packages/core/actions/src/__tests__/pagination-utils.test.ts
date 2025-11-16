/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizePageArgs, pageArgsToLimitArgs } from '../utils';

describe('pagination utils', () => {
  it('should clamp page values less than 1 to 1', () => {
    const { page, pageSize } = normalizePageArgs(0, 20);
    expect(page).toBe(1);
    expect(pageSize).toBe(20);

    const result = pageArgsToLimitArgs(0, 20);
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(20);
  });

  it('should clamp negative page sizes to 1', () => {
    const { page, pageSize } = normalizePageArgs(2, -5);
    expect(page).toBe(2);
    expect(pageSize).toBe(1);

    const result = pageArgsToLimitArgs(2, -5);
    expect(result.offset).toBe(1);
    expect(result.limit).toBe(1);
  });

  it('should default invalid numbers to 1', () => {
    const { page, pageSize } = normalizePageArgs(NaN, NaN);
    expect(page).toBe(1);
    expect(pageSize).toBe(1);

    const result = pageArgsToLimitArgs(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY);
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(1);
  });

  it('should coerce numeric strings', () => {
    const { page, pageSize } = normalizePageArgs('3' as any, '4' as any);
    expect(page).toBe(3);
    expect(pageSize).toBe(4);

    const result = pageArgsToLimitArgs('2' as any, '6' as any);
    expect(result.offset).toBe(6);
    expect(result.limit).toBe(6);
  });
});
