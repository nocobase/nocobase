/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildOrderFieldOptions, validateQuery } from '../flow/models/QueryBuilder.service';

describe('query builder service', () => {
  test('should use aliases in aggregated order field options', () => {
    const fieldOptions = [
      {
        name: 'price',
        title: 'Price',
      },
      {
        name: 'createdAt',
        title: 'Created at',
      },
    ];

    expect(
      buildOrderFieldOptions(
        fieldOptions,
        [{ field: ['createdAt'], alias: 'Month' }],
        [{ field: ['price'], aggregation: 'sum', alias: 'Revenue' }],
      ),
    ).toMatchObject([
      {
        name: 'Month',
        title: 'Month',
        key: 'Month',
        value: 'Month',
      },
      {
        name: 'Revenue',
        title: 'Revenue',
        key: 'Revenue',
        value: 'Revenue',
      },
    ]);
  });

  test('should accept aliases as aggregated order fields during validation', () => {
    expect(
      validateQuery({
        mode: 'builder',
        collectionPath: ['main', 'orders'],
        measures: [{ field: ['price'], aggregation: 'sum', alias: 'Revenue' }],
        dimensions: [{ field: ['createdAt'], format: 'YYYY-MM', alias: 'Month' }],
        orders: [{ field: 'Revenue', order: 'DESC' }, { field: 'Month', order: 'ASC' }],
      }),
    ).toEqual({ success: true, message: '' });
  });
});
