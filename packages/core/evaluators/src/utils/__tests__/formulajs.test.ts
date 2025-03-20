/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import formulajs from '../formulajs';

describe('evaluators > formulajs', () => {
  it('add new line in string', () => {
    expect(formulajs(`CONCATENATE('a', '\\n', 'b')`)).toBe('a\nb');
  });

  it('calculate null with number', () => {
    expect(formulajs('null + 1')).toBe(1);
  });

  it('precision should be 9', () => {
    expect(formulajs('100*2.3')).toBe(230);
  });
});
