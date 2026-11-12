/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { flipPlacement } from '../placement';

describe('flipPlacement', () => {
  it('keeps the placement in ltr', () => {
    expect(flipPlacement('bottomLeft', 'ltr')).toBe('bottomLeft');
    expect(flipPlacement('right', undefined)).toBe('right');
  });

  it('mirrors left and right in rtl', () => {
    expect(flipPlacement('bottomLeft', 'rtl')).toBe('bottomRight');
    expect(flipPlacement('topRight', 'rtl')).toBe('topLeft');
    expect(flipPlacement('rightTop', 'rtl')).toBe('leftTop');
    expect(flipPlacement('left', 'rtl')).toBe('right');
  });

  it('keeps placements without a side', () => {
    expect(flipPlacement('bottom', 'rtl')).toBe('bottom');
    expect(flipPlacement('top', 'rtl')).toBe('top');
    expect(flipPlacement(undefined, 'rtl')).toBeUndefined();
  });
});
