/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildToManyAssociationFilter } from '../utils';

describe('associate action utils', () => {
  it('builds a filter for one-to-many association records', () => {
    expect(
      buildToManyAssociationFilter(
        {
          interface: 'o2m',
          foreignKey: 'f_y2quq75zibi',
          sourceKey: 'id',
        },
        {
          id: 362872646860800,
        },
      ),
    ).toEqual({
      $or: [
        {
          f_y2quq75zibi: {
            $is: null,
          },
        },
        {
          f_y2quq75zibi: {
            $eq: 362872646860800,
          },
        },
      ],
    });
  });

  it('keeps valid falsy source key values', () => {
    expect(
      buildToManyAssociationFilter(
        {
          interface: 'o2m',
          foreignKey: 'parentId',
          sourceKey: 'id',
        },
        {
          id: 0,
        },
      ),
    ).toEqual({
      $or: [
        {
          parentId: {
            $is: null,
          },
        },
        {
          parentId: {
            $eq: 0,
          },
        },
      ],
    });
  });

  it('only filters null foreign key when the source key value is empty', () => {
    expect(
      buildToManyAssociationFilter(
        {
          interface: 'o2m',
          foreignKey: 'parentId',
          sourceKey: 'id',
        },
        {},
      ),
    ).toEqual({
      parentId: {
        $is: null,
      },
    });
  });

  it('returns an empty filter for non one-to-many fields', () => {
    expect(
      buildToManyAssociationFilter(
        {
          interface: 'm2m',
          foreignKey: 'parentId',
          sourceKey: 'id',
        },
        {
          id: 1,
        },
      ),
    ).toEqual({});
  });

  it('filters already associated many-to-many records', () => {
    expect(
      buildToManyAssociationFilter(
        {
          interface: 'm2m',
          targetKey: 'id',
        },
        {
          id: 1,
        },
        [{ id: 11 }, { id: 12 }],
      ),
    ).toEqual({
      'id.$ne': [11, 12],
    });
  });
});
