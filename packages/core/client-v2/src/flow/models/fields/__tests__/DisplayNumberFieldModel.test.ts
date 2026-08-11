/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { formatNumber } from '../DisplayNumberFieldModel';

describe('formatNumber', () => {
  it('formats a 30-digit decimal without scientific notation or precision loss', () => {
    expect(
      formatNumber({
        value: '123456789012345678901234567890',
        formatStyle: 'normal',
        step: '1',
      }),
    ).toBe('123,456,789,012,345,678,901,234,567,890');
  });

  it('formats the 22-digit value from the reported v2 scenario', () => {
    expect(
      formatNumber({
        value: '1234567890123458152112',
        formatStyle: 'normal',
        step: '1',
      }),
    ).toBe('1,234,567,890,123,458,152,112');
  });
});
