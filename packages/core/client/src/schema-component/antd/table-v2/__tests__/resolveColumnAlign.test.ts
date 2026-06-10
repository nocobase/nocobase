/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { resolveColumnAlign } from '../resolveColumnAlign';

describe('resolveColumnAlign', () => {
  test('numeric interfaces default to right-align', () => {
    expect(resolveColumnAlign(undefined, 'number')).toBe('right');
    expect(resolveColumnAlign(undefined, 'integer')).toBe('right');
    expect(resolveColumnAlign(undefined, 'percent')).toBe('right');
  });

  test('non-numeric interfaces have no default align', () => {
    expect(resolveColumnAlign(undefined, 'input')).toBeUndefined();
    expect(resolveColumnAlign(undefined, 'datetime')).toBeUndefined();
    expect(resolveColumnAlign(undefined, undefined)).toBeUndefined();
  });

  test('explicit align overrides numeric default', () => {
    expect(resolveColumnAlign('left', 'number')).toBe('left');
    expect(resolveColumnAlign('center', 'integer')).toBe('center');
    expect(resolveColumnAlign('right', 'percent')).toBe('right');
  });

  test('explicit align is preserved for non-numeric interfaces', () => {
    expect(resolveColumnAlign('center', 'input')).toBe('center');
    expect(resolveColumnAlign('right', 'datetime')).toBe('right');
  });
});
