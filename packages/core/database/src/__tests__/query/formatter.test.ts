/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '../../database';
import { createMockDatabase } from '../../mock-database';
import { QueryFormatter, Col } from '../../query/formatter';

class TestQueryFormatter extends QueryFormatter {
  formatDate(field: Col) {
    return field;
  }

  formatUnixTimestamp(field: string) {
    return this.sequelize.col(field);
  }

  resolveTimezone(timezone?: string) {
    return this.getTimezoneByOffset(timezone);
  }
}

describe('query formatter', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });

    db.collection({
      name: 'query_format_test',
      fields: [
        { type: 'date', name: 'date' },
        { type: 'dateOnly', name: 'dateOnly' },
        { type: 'datetimeNoTz', name: 'datetimeNoTz' },
        {
          type: 'unixTimestamp',
          name: 'unixTs',
          options: {
            uiSchema: {
              'x-component-props': {
                accuracy: 'second',
              },
            },
          },
        },
        {
          type: 'unixTimestamp',
          name: 'unixTsMs',
          options: {
            uiSchema: {
              'x-component-props': {
                accuracy: 'millisecond',
              },
            },
          },
        },
      ],
    });

    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should ignore invalid timezone header values', async () => {
    const formatter = new TestQueryFormatter(db.sequelize);

    expect(formatter.resolveTimezone(`UTC' || current_user || '`)).toBeUndefined();
    expect(formatter.resolveTimezone('+05:30')).toBeTruthy();
    expect(formatter.resolveTimezone('Asia/Tokyo')).toBe('Asia/Tokyo');
  });

  it('should format query dimensions by field type', async () => {
    const repo = db.getRepository('query_format_test');
    const dialect = db.sequelize.getDialect();
    if (dialect === 'sqlite') {
      await repo.create({
        values: {
          date: '2024-05-14 19:32:30.175 +00:00',
          dateOnly: '2024-05-14',
          datetimeNoTz: '2024-05-14 19:32:30',
          unixTs: '2023-01-01T04:34:56Z',
          unixTsMs: '2023-01-01T04:34:56Z',
        },
      });
    } else if (dialect === 'postgres') {
      await repo.create({
        values: {
          date: '2024-05-14 19:32:30.175+00',
          dateOnly: '2024-05-14',
          datetimeNoTz: '2024-05-14 19:32:30',
          unixTs: '2023-01-01T04:34:56Z',
          unixTsMs: '2023-01-01T04:34:56Z',
        },
      });
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      await repo.create({
        values: {
          date: '2024-05-14T19:32:30Z',
          dateOnly: '2024-05-14',
          datetimeNoTz: '2024-05-14 19:32:30',
          unixTs: '2023-01-01T04:34:56Z',
          unixTsMs: '2023-01-01T04:34:56Z',
        },
      });
    } else {
      return;
    }

    expect(
      await repo.query({
        dimensions: [{ field: ['date'], format: 'YYYY-MM-DD hh:mm:ss' }],
        timezone: '+05:30',
      }),
    ).toMatchObject([{ date: '2024-05-15 01:02:30' }]);

    expect(
      await repo.query({
        dimensions: [{ field: ['dateOnly'], format: 'YYYY-MM-DD' }],
        timezone: '+05:30',
      }),
    ).toMatchObject([{ dateOnly: '2024-05-14' }]);

    expect(
      await repo.query({
        dimensions: [{ field: ['datetimeNoTz'], format: 'YYYY-MM-DD hh:mm:ss' }],
        timezone: '+05:30',
      }),
    ).toMatchObject([{ datetimeNoTz: '2024-05-14 19:32:30' }]);

    expect(
      await repo.query({
        dimensions: [{ field: ['unixTs'], format: 'YYYY-MM-DD hh:mm:ss' }],
        timezone: '+05:30',
      }),
    ).toMatchObject([{ unixTs: '2023-01-01 10:04:56' }]);

    expect(
      await repo.query({
        dimensions: [{ field: ['unixTsMs'], format: 'YYYY-MM-DD hh:mm:ss' }],
        timezone: '+05:30',
      }),
    ).toMatchObject([{ unixTsMs: '2023-01-01 10:04:56' }]);
  });

  it('should support ordering aggregate queries by formatted datetime dimensions', async () => {
    const repo = db.getRepository('query_format_test');
    const dialect = db.sequelize.getDialect();
    if (dialect === 'sqlite') {
      await repo.create({
        values: {
          date: '2024-05-14 19:32:30.175 +00:00',
          dateOnly: '2024-05-14',
          datetimeNoTz: '2024-05-14 19:32:30',
          unixTs: '2023-01-01T04:34:56Z',
          unixTsMs: '2023-01-01T04:34:56Z',
        },
      });
      await repo.create({
        values: {
          date: '2024-05-13 19:32:30.175 +00:00',
          dateOnly: '2024-05-13',
          datetimeNoTz: '2024-05-13 19:32:30',
          unixTs: '2023-01-01T04:34:56Z',
          unixTsMs: '2023-01-01T04:34:56Z',
        },
      });
    } else if (dialect === 'postgres') {
      await repo.create({
        values: {
          date: '2024-05-14 19:32:30.175+00',
          dateOnly: '2024-05-14',
          datetimeNoTz: '2024-05-14 19:32:30',
          unixTs: '2023-01-01T04:34:56Z',
          unixTsMs: '2023-01-01T04:34:56Z',
        },
      });
      await repo.create({
        values: {
          date: '2024-05-13 19:32:30.175+00',
          dateOnly: '2024-05-13',
          datetimeNoTz: '2024-05-13 19:32:30',
          unixTs: '2023-01-01T04:34:56Z',
          unixTsMs: '2023-01-01T04:34:56Z',
        },
      });
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      await repo.create({
        values: {
          date: '2024-05-14T19:32:30Z',
          dateOnly: '2024-05-14',
          datetimeNoTz: '2024-05-14 19:32:30',
          unixTs: '2023-01-01T04:34:56Z',
          unixTsMs: '2023-01-01T04:34:56Z',
        },
      });
      await repo.create({
        values: {
          date: '2024-05-13T19:32:30Z',
          dateOnly: '2024-05-13',
          datetimeNoTz: '2024-05-13 19:32:30',
          unixTs: '2023-01-01T04:34:56Z',
          unixTsMs: '2023-01-01T04:34:56Z',
        },
      });
    } else {
      return;
    }

    expect(
      await repo.query({
        measures: [{ field: ['id'], aggregation: 'count', alias: 'orderCount' }],
        dimensions: [{ field: ['date'], format: 'YYYY-MM-DD', alias: 'orderDate' }],
        orders: [{ field: ['date'], alias: 'orderDate', order: 'asc' }],
        timezone: '+00:00',
      }),
    ).toMatchObject([
      { orderDate: '2024-05-13', orderCount: 1 },
      { orderDate: '2024-05-14', orderCount: 1 },
    ]);
  });
});
