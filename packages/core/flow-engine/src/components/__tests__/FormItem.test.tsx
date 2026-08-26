/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { formItemStyle, verticalFormItemLabelStyle } from '../FormItem';

describe('FormItem', () => {
  it('keeps vertical label-to-value spacing consistent with v1', () => {
    expect(verticalFormItemLabelStyle).toEqual({
      paddingBottom: 0,
    });
  });

  it('keeps spacing between form items consistent with v1', () => {
    expect(formItemStyle).toEqual({
      marginBottom: 12,
    });
  });
});
