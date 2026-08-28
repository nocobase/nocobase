/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Filter } from '@nocobase/database';
import { describe, expect, it } from 'vitest';
import { restrictValueFilterToPlainText } from '../plugin';

describe('restrictValueFilterToPlainText', () => {
  it.each(['$includes', '$notIncludes', '$eq', '$ne'] as const)(
    'restricts the Value %s operator to plain text variables',
    (operator) => {
      const filter = {
        value: { [operator]: 'test' },
      } as Filter;

      expect(restrictValueFilterToPlainText(filter)).toEqual({
        $and: [filter, { type: { $eq: 'default' } }],
      });
    },
  );

  it('restricts nested Value filters to plain text variables', () => {
    const filter: Filter = {
      $or: [
        { name: { $includes: 'API' } },
        {
          $and: [{ type: { $eq: 'secret' } }, { value: { $eq: 'test' } }],
        },
      ],
    };

    expect(restrictValueFilterToPlainText(filter)).toEqual({
      $and: [filter, { type: { $eq: 'default' } }],
    });
  });

  it.each([
    undefined,
    { name: { $includes: 'API' } } as Filter,
    { type: { $eq: 'secret' } } as Filter,
    { $or: [{ name: { $eq: 'API_SECRET' } }, { type: { $eq: 'secret' } }] } as Filter,
  ])('keeps filters without Value conditions unchanged', (filter) => {
    expect(restrictValueFilterToPlainText(filter)).toBe(filter);
  });
});
