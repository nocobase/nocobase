/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { forEach } from '../forEach';

describe('forEach', () => {
  test('array', () => {
    const arr = [1, 2, 3];
    const result = [];
    forEach(arr, (value, index) => {
      result.push(value);
    });
    expect(result).toEqual(arr);
  });

  test('object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = [];
    forEach(obj, (value, key) => {
      result.push(value);
    });
    expect(result).toEqual([1, 2, 3]);
  });
});
