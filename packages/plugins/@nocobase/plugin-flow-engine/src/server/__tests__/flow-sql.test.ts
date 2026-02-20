/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';

describe.skipIf(() => {
  return process.env.DB_DIALECT !== 'sqlite';
})('flow sql', async () => {
  let app: MockServer;
  let db: MockDatabase;
  let agent: any;

  beforeEach(async () => {
    app = await createMockServer({
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
});
