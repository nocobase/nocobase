/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { toDbType } from '../index';

describe('formula field value conversion', () => {
  it('converts dates to calendar dates for dateOnly storage', () => {
    expect(toDbType(new Date(2026, 3, 15, 12), 'dateOnly')).toBe('2026-04-15');
  });
});
