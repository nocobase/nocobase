/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { percent2float } from '../utils';

describe('percent2float', () => {
  it('should be NaN', () => {
    expect(percent2float('123')).toBe(NaN);
    expect(percent2float('3a')).toBe(NaN);
    expect(percent2float('3a%')).toBe(NaN);
  });

  it('should be a floating point number', () => {
    expect(percent2float('123%')).toBe(1.23);
    expect(percent2float('22.5507%')).toBe(0.225507); // not 0.22550699999999999
    expect(percent2float('10%')).toBe(0.1);
  });
});
