/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer } from '@nocobase/test';
import { createFlowEngineMockServer } from './test-utils';
import PluginFlowEngineServer from '../plugin';

describe('flow sql data source proxy', () => {
  it('runs SQL through data source collection manager db runSQL method', async () => {
    const runSQL = vi.fn(async () => [{ count: 1 }]);
    const plugin = Object.create(PluginFlowEngineServer.prototype) as PluginFlowEngineServer;

    Object.defineProperty(plugin, 'app', {
      value: {
        dataSourceManager: {
          get: (key: string) =>
            key === 'external'
              ? {
                  collectionManager: {
                    db: {
                      runSQL,
                    },
                  },
                }
              : undefined,
        },
      },
    });

    const result = await plugin.runSQLByDataSourceKey('external', 'select count(*) as count from orders', {
      type: 'selectRows',
    });

    expect(result).toEqual([{ count: 1 }]);
    expect(runSQL).toHaveBeenCalledWith('select count(*) as count from orders', {
      type: 'selectRows',
    });
  });

  it('rejects non-database data source without runSQL method', async () => {
    const plugin = Object.create(PluginFlowEngineServer.prototype) as PluginFlowEngineServer;

    Object.defineProperty(plugin, 'app', {
      value: {
        dataSourceManager: {
          get: (key: string) =>
            key === 'external'
              ? {
                  collectionManager: {},
                }
              : undefined,
        },
      },
    });

    await expect(plugin.runSQLByDataSourceKey('external', 'select 1')).rejects.toThrow(
      'data source "external" does not support SQL',
    );
  });
});

describe.skipIf(() => {
  return process.env.DB_DIALECT !== 'sqlite';
})('flow sql', async () => {
  let app: MockServer;
  let db: MockDatabase;
  let agent: any;

  beforeEach(async () => {
    app = await createFlowEngineMockServer({
      plugins: ['flow-engine'],
    });
    db = app.db;
    agent = app.agent();

    // Create test table test
    const Test = db.collection({
      name: 'test',
      timestamps: false,
      fields: [
        { type: 'integer', name: 'num' },
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    await Test.sync();

    // Insert test data
    await db.getRepository('test').create({
      values: [
        { num: 1, name: 'Alice', age: 25 },
        { num: 2, name: 'Bob', age: 30 },
        { num: 3, name: 'Charlie', age: 35 },
      ],
    });
  });

  afterEach(async () => {
    await db.clean({ drop: true });
  });

  it('run by id with template', async () => {
    const sql = `
select * from test
{% if ctx.user.name %}
  where name = {{ctx.user.name}}
{% endif %}
`;
    const res1 = await agent.resource('flowSql').save({
      values: {
        uid: 'test-sql',
        sql,
      },
    });
    expect(res1.status).toBe(200);
    const res2 = await agent.resource('flowSql').getBind({
      uid: 'test-sql',
    });
    expect(res2.status).toBe(200);
    expect(res2.body.data.bind).toMatchObject({
      __var1: '{{ctx.user.name}}',
    });
    expect(res2.body.data.liquidContext).toMatchObject({
      user: {
        name: '{{ctx.user.name}}',
      },
    });
    const res3 = await agent.resource('flowSql').runById({
      values: {
        uid: 'test-sql',
        bind: {
          __var1: 'Alice',
        },
        liquidContext: {
          user: {
            name: 'Alice',
          },
        },
      },
    });
    expect(res3.status).toBe(200);
    expect(res3.body.data).toHaveLength(1);
    expect(res3.body.data[0]).toMatchObject({
      name: 'Alice',
    });
    const res4 = await agent.resource('flowSql').runById({
      values: {
        uid: 'test-sql',
        bind: {
          __var1: 'Alice',
        },
        liquidContext: {
          user: {},
        },
      },
    });
    expect(res4.status).toBe(200);
    expect(res4.body.data).toHaveLength(3);
  });

  it('runs SQL through non-database data source proxy', async () => {
    const runSQL = vi.fn(async (sql, options) => ({
      rows: [{ count: 1 }],
      sql,
      options,
    }));

    app.dataSourceManager.dataSources.set('external', {
      collectionManager: {
        db: {
          runSQL,
        },
      },
    } as any);

    const response = await agent.resource('flowSql').run({
      values: {
        dataSourceKey: 'external',
        sql: 'select count(*) as count from orders',
        type: 'selectRows',
        filter: {
          count: {
            $gt: 0,
          },
        },
        bind: {
          count: 0,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      rows: [{ count: 1 }],
      sql: 'select count(*) as count from orders',
      options: {
        type: 'selectRows',
        filter: {
          count: {
            $gt: 0,
          },
        },
        bind: {
          count: 0,
        },
      },
    });
    expect(runSQL).toHaveBeenCalledWith('select count(*) as count from orders', {
      type: 'selectRows',
      filter: {
        count: {
          $gt: 0,
        },
      },
      bind: {
        count: 0,
      },
    });
  });
});
