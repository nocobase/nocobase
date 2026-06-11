/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import '@nocobase/client';
import { getAssociationSelectAssociatedRecordsFilter, getAssociationSelectForeignKeyFilter } from '../TableSelectModel';

describe('TableSelectModel', () => {
  it('filters out already associated o2m records in association select table', () => {
    expect(
      getAssociationSelectForeignKeyFilter({
        interface: 'o2m',
        name: 'orders',
        foreignKey: 'f_y2quq75zibi',
      }),
    ).toEqual({
      f_y2quq75zibi: {
        $is: null,
      },
    });
  });

  it('filters out already associated m2m records in association select table', () => {
    expect(
      getAssociationSelectAssociatedRecordsFilter(
        {
          filterTargetKey: 'id',
        },
        [{ id: 11 }, { id: 12 }],
      ),
    ).toEqual({
      'id.$ne': [11, 12],
    });
  });
});
