/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildOrderFieldOptions,
  getCollectionOptions,
  getFieldOptions,
  getFormatterOptionsByField,
  validateQuery,
} from '../flow/models/QueryBuilder.service';

describe('query builder service', () => {
  test('should build options from flow data source manager', () => {
    const createdAt = {
      name: 'createdAt',
      interface: 'datetime',
      filterable: { operators: [] },
      uiSchema: { title: 'Created at' },
    };
    const customerName = {
      name: 'name',
      interface: 'input',
      filterable: { operators: [] },
      uiSchema: { title: 'Customer name' },
    };
    const customers = {
      name: 'customers',
      title: 'Customers',
      getFields: () => [customerName],
    };
    const customer = {
      name: 'customer',
      interface: 'm2o',
      filterable: { nested: true },
      target: 'customers',
      uiSchema: { title: 'Customer' },
      targetCollection: customers,
    };
    const orders = {
      name: 'orders',
      title: 'Orders',
      getFields: () => [createdAt, customer],
    };
    const main = {
      key: 'main',
      displayName: 'Main',
      getCollections: () => [orders, customers],
    };
    const external = {
      key: 'external',
      displayName: 'External',
      options: {
        isDBInstance: true,
      },
      getCollections: () => [
        {
          name: 'externalOrders',
          title: 'External orders',
        },
      ],
    };
    const dm = {
      getCollection: (_dataSourceKey: string, collectionName: string) =>
        collectionName === 'orders' ? orders : collectionName === 'customers' ? customers : undefined,
      getDataSources: () => [main, external],
    };

    expect(getCollectionOptions(dm, (value) => value)).toEqual([
      {
        value: 'main',
        label: 'Main',
        children: [
          { value: 'orders', label: 'Orders' },
          { value: 'customers', label: 'Customers' },
        ],
      },
      {
        value: 'external',
        label: 'External',
        children: [{ value: 'externalOrders', label: 'External orders' }],
      },
    ]);
    expect(getFieldOptions(dm, (value) => value, ['main', 'orders'])).toMatchObject([
      {
        name: 'createdAt',
        title: 'Created at',
      },
      {
        name: 'customer',
        title: 'Customer',
        children: [
          {
            name: 'name',
            title: 'Customer name',
          },
        ],
      },
    ]);
    expect(getFormatterOptionsByField(dm, ['main', 'orders'], ['createdAt'])).not.toEqual([]);
  });

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
        orders: [
          { field: 'Revenue', order: 'DESC' },
          { field: 'Month', order: 'ASC' },
        ],
      }),
    ).toEqual({ success: true, message: '' });
  });
});
