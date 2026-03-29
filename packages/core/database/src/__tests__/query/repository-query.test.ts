/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createQueryTestDatabase, closeQueryTestDatabase, QueryTestDatabase } from './shared';

describe('repository query', () => {
  let db: QueryTestDatabase;

  beforeEach(async () => {
    db = await createQueryTestDatabase();
  });

  afterEach(async () => {
    await closeQueryTestDatabase(db);
  });

  it('should query plain measures and dimensions', async () => {
    await db.getRepository('users').create({
      values: [
        { id: 1, name: 'u1', age: 11 },
        { id: 2, name: 'u2', age: 22 },
      ],
    });

    const result = await db.getRepository('users').query({
      measures: [
        { field: ['age'], alias: 'Age' },
        { field: ['id'], alias: 'Id' },
      ],
      dimensions: [{ field: ['name'], alias: 'Name' }],
    });

    expect(result).toMatchObject([
      { Name: 'u1', Age: 11, Id: 1 },
      { Name: 'u2', Age: 22, Id: 2 },
    ]);
  });

  it('should query grouped aggregation with sort', async () => {
    await db.getRepository('users').create({
      values: [
        { id: 1, name: 'u1', age: 10, createdAt: '2023-02-02' },
        { id: 2, name: 'u2', age: 20, createdAt: '2023-01-01' },
      ],
    });

    const result = await db.getRepository('users').query({
      measures: [
        {
          field: ['age'],
          aggregation: 'sum',
          alias: 'totalAge',
        },
      ],
      dimensions: [
        {
          field: ['name'],
          alias: 'name',
        },
        {
          field: ['createdAt'],
          format: 'YYYY-MM',
          alias: 'createdAt',
        },
      ],
      orders: [{ field: ['createdAt'], alias: 'createdAt', order: 'asc' }],
    });

    expect(result).toMatchObject([
      { name: 'u2', createdAt: '2023-01', totalAge: 20 },
      { name: 'u1', createdAt: '2023-02', totalAge: 10 },
    ]);
  });

  it('should support nested many-to-many filters', async () => {
    const result = await db.getRepository('users').query({
      measures: [
        {
          field: ['id'],
          aggregation: 'count',
          alias: 'id',
        },
      ],
      filter: {
        $and: [
          {
            departments: {
              owners: {
                id: {
                  $eq: 1,
                },
              },
            },
          },
        ],
      },
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should support nested many-to-many filters through belongs-to relation', async () => {
    const result = await db.getRepository('users').query({
      measures: [
        {
          field: ['id'],
          aggregation: 'count',
          alias: 'id',
        },
      ],
      filter: {
        $and: [
          {
            createdBy: {
              roles: {
                name: {
                  $includes: 'member',
                },
              },
            },
          },
        ],
      },
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should support having with explicit alias', async () => {
    await db.getRepository('users').create({
      values: [
        { id: 1, name: 'u1', age: 10 },
        { id: 2, name: 'u2', age: 20 },
      ],
    });

    const result = await db.getRepository('users').query({
      measures: [
        {
          field: ['age'],
          aggregation: 'sum',
          alias: 'totalAge',
        },
      ],
      dimensions: [
        {
          field: ['name'],
          alias: 'name',
        },
      ],
      having: {
        totalAge: {
          $gt: 10,
        },
      },
      orders: [{ field: ['name'], alias: 'name', order: 'asc' }],
    });

    expect(result).toMatchObject([{ name: 'u2', totalAge: 20 }]);
  });

  it('should support having with field name when alias is omitted', async () => {
    await db.getRepository('users').create({
      values: [
        { id: 1, name: 'u1', age: 10 },
        { id: 2, name: 'u2', age: 20 },
      ],
    });

    const result = await db.getRepository('users').query({
      measures: [
        {
          field: ['age'],
          aggregation: 'sum',
        },
      ],
      dimensions: [
        {
          field: ['name'],
        },
      ],
      having: {
        age: {
          $gt: 10,
        },
      },
      orders: [{ field: ['name'], alias: 'name', order: 'asc' }],
    });

    expect(result).toMatchObject([{ name: 'u2', age: 20 }]);
  });
});
