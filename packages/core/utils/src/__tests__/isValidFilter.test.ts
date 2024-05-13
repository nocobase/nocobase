/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isValidFilter } from '..';

describe('isValidFilter', () => {
  it('should return false', () => {
    expect(isValidFilter(undefined)).toBe(false);
    expect(isValidFilter({})).toBe(false);
    expect(isValidFilter({ $and: [] })).toBe(false);
    expect(isValidFilter({ $or: [] })).toBe(false);
    expect(isValidFilter({ $and: [{}] })).toBe(false);
    expect(isValidFilter({ $or: [{}] })).toBe(false);
    expect(isValidFilter({ $and: [{ $or: [] }] })).toBe(false);
    expect(isValidFilter({ $or: [{ $and: [] }] })).toBe(false);
    expect(isValidFilter({ $and: [{}], $or: [{ $and: [], $or: [] }] })).toBe(false);
  });

  it('should return true', () => {
    expect(isValidFilter({ $and: [{ name: { $eq: 'test' } }] })).toBe(true);
    expect(isValidFilter({ $or: [{ name: { $eq: 'test' } }] })).toBe(true);
    expect(isValidFilter({ $and: [{ $or: [{ name: { $eq: 'test' } }] }] })).toBe(true);
    expect(isValidFilter({ $or: [{ $and: [{ name: { $eq: 'test' } }] }] })).toBe(true);
    expect(isValidFilter({ $and: [], $or: [{ name: 'test' }] })).toBe(true);
  });
});
