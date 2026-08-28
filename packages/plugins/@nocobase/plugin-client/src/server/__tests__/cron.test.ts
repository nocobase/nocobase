/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getCronLocale } from '../cron';

describe('getCronLocale', () => {
  it('loads zh-CN from the hyphenated cron locale file instead of returning an empty object', () => {
    const locale = getCronLocale('zh-CN');

    expect(locale).toMatchObject({
      everyText: '每',
      emptyMonths: '每月',
      yearOption: '年',
    });
  });
});
