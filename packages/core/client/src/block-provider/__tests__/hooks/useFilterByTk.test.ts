/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getFilterByTkByCollection } from '../../BlockProvider';

describe('getFilterByTkByCollection', () => {
  it('uses collection filterTargetKey when it differs from id', () => {
    const filterByTk = getFilterByTkByCollection(
      {
        filterTargetKey: 'uuid',
      },
      {
        id: 1,
        uuid: 'staff-uuid-001',
      },
    );

    expect(filterByTk).toBe('staff-uuid-001');
  });

  it('supports array filterTargetKey', () => {
    const filterByTk = getFilterByTkByCollection(
      {
        filterTargetKey: ['tenant', 'uuid'],
      },
      {
        id: 1,
        tenant: 't-1',
        uuid: 'staff-uuid-001',
      },
    );

    expect(filterByTk).toEqual({
      tenant: 't-1',
      uuid: 'staff-uuid-001',
    });
  });
});
