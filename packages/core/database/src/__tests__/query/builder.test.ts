/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildQuery } from '../../query/builder';
import { createQueryTestDatabase, closeQueryTestDatabase, QueryTestDatabase } from './shared';

describe('query builder', () => {
  let db: QueryTestDatabase;

  beforeEach(async () => {
    db = await createQueryTestDatabase();
  });

  afterEach(async () => {
    await closeQueryTestDatabase(db);
  });

  it('should build query attributes and include', () => {
    const { queryOptions } = buildQuery(db, db.getCollection('users'), {
      measures: [
        {
          field: ['age'],
          aggregation: 'sum',
          alias: 'totalAge',
        },
      ],
      dimensions: [
        {
          field: ['createdAt'],
          format: 'YYYY-MM-DD',
          alias: 'createdAt',
        },
        {
          field: ['createdBy', 'name'],
          alias: 'createdBy.name',
        },
      ],
    });

    expect(queryOptions.attributes).toHaveLength(3);
    expect(queryOptions.include).toMatchObject([{ association: 'createdBy' }]);
    expect(queryOptions.group).toHaveLength(2);
  });

  it('should support dotted string field paths', () => {
    const { queryOptions } = buildQuery(db, db.getCollection('users'), {
      dimensions: [
        {
          field: 'createdBy.name',
          alias: 'createdBy.name',
        },
      ],
      orders: [
        {
          field: 'createdBy.name',
          alias: 'createdBy.name',
          order: 'asc',
        },
      ],
    });

    expect(queryOptions.include).toMatchObject([{ association: 'createdBy' }]);
    expect(queryOptions.attributes).toMatchObject([[expect.anything(), 'createdBy.name']]);
  });

  it('should reject invalid aggregation function', () => {
    expect(() =>
      buildQuery(db, db.getCollection('users'), {
        measures: [
          {
            field: ['age'],
            aggregation: 'if(1=2,sleep(1),sleep(3)) and sum',
          },
        ],
      }),
    ).toThrow('Invalid aggregation function: if(1=2,sleep(1),sleep(3)) and sum');
  });

  it('should sanitize invalid order direction', () => {
    const { queryOptions } = buildQuery(db, db.getCollection('users'), {
      orders: [
        {
          field: ['createdAt'],
          alias: 'createdAt',
          order: `ASC'); SELECT pg_sleep(1)--` as any,
        },
      ],
    });

    expect(queryOptions.order).toEqual([[db.sequelize.col('users.created_at'), 'ASC']]);
  });

  it('should order aggregate queries by the projected dimension expression', () => {
    const { queryOptions } = buildQuery(db, db.getCollection('users'), {
      measures: [
        {
          field: ['id'],
          aggregation: 'count',
          alias: 'userCount',
        },
      ],
      dimensions: [
        {
          field: ['createdAt'],
          format: 'YYYY-MM-DD',
          alias: 'createdDate',
        },
      ],
      orders: [
        {
          field: ['createdAt'],
          alias: 'createdDate',
          order: 'asc',
        },
      ],
    });

    expect(queryOptions.group).toHaveLength(1);
    expect(queryOptions.order).toHaveLength(1);
    expect(queryOptions.order?.[0]?.[0]).toBe(queryOptions.group?.[0]);
  });
});
