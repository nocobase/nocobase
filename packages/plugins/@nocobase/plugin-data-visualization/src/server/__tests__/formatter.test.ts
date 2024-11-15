/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';
import compose from 'koa-compose';
import { parseFieldAndAssociations, queryData } from '../actions/query';
import { createQueryParser } from '../query-parser';

describe('formatter', () => {
  let app: MockServer;
  let db: Database;

  beforeAll(async () => {
    app = await createMockServer({
      acl: true,
      plugins: ['users', 'auth', 'field-sort', 'data-visualization'],
    });
    db = app.db;
  });

  afterAll(async () => {
    await app.destroy();
  });

  afterEach(async () => {
    await app.db.clean({ drop: true });
  });

  test('datetime format with timezone', async () => {
    db.collection({
      name: 'chart_test',
      fields: [
        {
          type: 'date',
          name: 'date',
        },
      ],
    });
    await db.sync();
    const repo = db.getRepository('chart_test');
    const dialect = db.sequelize.getDialect();
    if (dialect === 'sqlite') {
      await repo.create({
        values: {
          date: '2024-05-14 19:32:30.175 +00:00',
        },
      });
    } else if (dialect === 'postgres') {
      await repo.create({
        values: {
          date: '2024-05-14 19:32:30.175+00',
        },
      });
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      await repo.create({
        values: {
          date: '2024-05-14T19:32:30Z',
        },
      });
    } else {
      expect(true).toBe(true);
      return;
    }
    const ctx = {
      app,
      db,
      timezone: '+05:30',
      action: {
        params: {
          values: {
            collection: 'chart_test',
            dimensions: [
              {
                field: ['date'],
                format: 'YYYY-MM-DD hh:mm:ss',
              },
            ],
          },
        },
      },
    } as any;
    const queryParser = createQueryParser(db);
    await compose([parseFieldAndAssociations, queryParser.parse(), queryData])(ctx, async () => {});
    expect(ctx.action.params.values.data).toBeDefined();
    expect(ctx.action.params.values.data).toMatchObject([{ date: '2024-05-15 01:02:30' }]);
  });

  test('dateOnly format', async () => {
    db.collection({
      name: 'chart_test',
      fields: [
        {
          type: 'dateOnly',
          name: 'dateOnly',
        },
      ],
    });
    await db.sync();
    const repo = db.getRepository('chart_test');
    await repo.create({
      values: {
        dateOnly: '2024-05-14',
      },
    });
    const ctx = {
      app,
      db,
      timezone: '+05:30',
      action: {
        params: {
          values: {
            collection: 'chart_test',
            dimensions: [
              {
                field: ['dateOnly'],
                format: 'YYYY-MM-DD',
              },
            ],
          },
        },
      },
    } as any;
    const queryParser = createQueryParser(db);
    await compose([parseFieldAndAssociations, queryParser.parse(), queryData])(ctx, async () => {});
    expect(ctx.action.params.values.data).toBeDefined();
    expect(ctx.action.params.values.data).toMatchObject([{ dateOnly: '2024-05-14' }]);
  });

  test('datetimeNoTz format', async () => {
    db.collection({
      name: 'chart_test',
      fields: [
        {
          type: 'datetimeNoTz',
          name: 'datetimeNoTz',
        },
      ],
    });
    await db.sync();
    const repo = db.getRepository('chart_test');
    await repo.create({
      values: {
        datetimeNoTz: '2024-05-14 19:32:30',
      },
    });
    const ctx = {
      app,
      db,
      timezone: '+05:30',
      action: {
        params: {
          values: {
            collection: 'chart_test',
            dimensions: [
              {
                field: ['datetimeNoTz'],
                format: 'YYYY-MM-DD hh:mm:ss',
              },
            ],
          },
        },
      },
    } as any;
    const queryParser = createQueryParser(db);
    await compose([parseFieldAndAssociations, queryParser.parse(), queryData])(ctx, async () => {});
    expect(ctx.action.params.values.data).toBeDefined();
    expect(ctx.action.params.values.data).toMatchObject([{ datetimeNoTz: '2024-05-14 19:32:30' }]);
  });

  test('unixTs format', async () => {
    db.collection({
      name: 'chart_test',
      fields: [
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
      ],
    });
    await db.sync();
    const repo = db.getRepository('chart_test');
    await repo.create({
      values: {
        id: 5,
        unixTs: '2023-01-01T04:34:56Z',
      },
    });
    const ctx = {
      app,
      db,
      timezone: '+05:30',
      action: {
        params: {
          values: {
            collection: 'chart_test',
            dimensions: [
              {
                field: ['unixTs'],
                format: 'YYYY-MM-DD hh:mm:ss',
              },
            ],
          },
        },
      },
    } as any;
    const queryParser = createQueryParser(db);
    await compose([parseFieldAndAssociations, queryParser.parse(), queryData])(ctx, async () => {});
    expect(ctx.action.params.values.data).toBeDefined();
    expect(ctx.action.params.values.data).toMatchObject([{ unixTs: '2023-01-01 10:04:56' }]);
  });

  test('unixTsMs format', async () => {
    db.collection({
      name: 'chart_test',
      fields: [
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
    const repo = db.getRepository('chart_test');
    await repo.create({
      values: {
        unixTsMs: '2023-01-01T04:34:56Z',
      },
    });
    const ctx = {
      app,
      db,
      timezone: '+05:30',
      action: {
        params: {
          values: {
            collection: 'chart_test',
            dimensions: [
              {
                field: ['unixTsMs'],
                format: 'YYYY-MM-DD hh:mm:ss',
              },
            ],
          },
        },
      },
    } as any;
    const queryParser = createQueryParser(db);
    await compose([parseFieldAndAssociations, queryParser.parse(), queryData])(ctx, async () => {});
    expect(ctx.action.params.values.data).toBeDefined();
    expect(ctx.action.params.values.data).toMatchObject([{ unixTsMs: '2023-01-01 10:04:56' }]);
  });
});
