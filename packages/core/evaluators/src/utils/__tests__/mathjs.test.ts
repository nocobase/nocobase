/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import mathjs from '../mathjs';

describe('evaluators > mathjs', () => {
  it('matrix type should be to array', () => {
    expect(mathjs('range(1, 3, 1)')).toEqual([1, 2, 3]);
  });

  it('precision should be 9', () => {
    expect(mathjs('100*2.3')).toBe(230);
  });
});
