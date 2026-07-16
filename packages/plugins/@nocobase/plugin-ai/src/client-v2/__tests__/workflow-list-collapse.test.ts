/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { moveItem, shiftKey, shiftKeysAfterRemove } from '../workflow/components/WorkflowListCollapse';

describe('WorkflowListCollapse utilities', () => {
  it('moves items without mutating the original array', () => {
    const source = ['a', 'b', 'c'];

    expect(moveItem(source, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(source).toEqual(['a', 'b', 'c']);
  });

  it('keeps active collapse keys aligned when items move or are removed', () => {
    expect(['0', '1', '2'].map((key) => shiftKey(key, 0, 2))).toEqual(['2', '0', '1']);
    expect(['0', '1', '2'].map((key) => shiftKey(key, 2, 0))).toEqual(['1', '2', '0']);
    expect(shiftKeysAfterRemove(['0', '2', '3'], 1, 3)).toEqual(['0', '1', '2']);
  });
});
