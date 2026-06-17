/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { insertTextAtSelection } from '../textAreaInsertion';

describe('insertTextAtSelection', () => {
  it('replaces the selected range and returns the inserted selection bounds', () => {
    expect(insertTextAtSelection('abcdef', '{{value}}', 2, 4)).toEqual({
      nextValue: 'ab{{value}}ef',
      nextSelectionStart: 2,
      nextSelectionEnd: 11,
    });
  });

  it('inserts at the caret when there is no selection', () => {
    expect(insertTextAtSelection('abc', '{{x}}', 1, 1)).toEqual({
      nextValue: 'a{{x}}bc',
      nextSelectionStart: 1,
      nextSelectionEnd: 6,
    });
  });
});
