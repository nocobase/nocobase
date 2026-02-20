/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { buildDynamicNamePath } from '../dynamicNamePath';

describe('buildDynamicNamePath', () => {
  it('returns nameParts when no fieldIndex', () => {
    expect(buildDynamicNamePath(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('maps list field to row index (simple)', () => {
    expect(buildDynamicNamePath(['orders', 'amount'], ['orders:2'])).toEqual([2, 'amount']);
  });

  it('handles same-name nested list field (outer list -> keep inner field name)', () => {
    expect(buildDynamicNamePath(['products', 'products'], ['products:0'])).toEqual([0, 'products']);
  });

  it('handles same-name nested list field (inner list -> skip inner field name)', () => {
    expect(buildDynamicNamePath(['products', 'products', 'id'], ['products:1', 'products:0'])).toEqual([0, 'id']);
  });

  it('falls back to last occurrence when occurrences mismatch', () => {
    expect(buildDynamicNamePath(['products', 'id'], ['products:0', 'products:1'])).toEqual([1, 'id']);
  });
});
