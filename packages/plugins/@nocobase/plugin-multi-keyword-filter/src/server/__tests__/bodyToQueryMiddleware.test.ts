/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import supertest from 'supertest';
import { bodyToQueryMiddleware } from '../middlewares';

describe('filter-operator-multiple-keywords > GET to POST middleware', () => {
  let app: Koa;
  let agent: supertest.SuperAgentTest;

  beforeEach(() => {
    app = new Koa();

    // Add basic middleware
    app.use(bodyParser());

    // Add middleware to be tested
    app.use(bodyToQueryMiddleware);

    // Add test response middleware
    app.use(async (ctx) => {
      ctx.body = {
        method: ctx.method,
        query: ctx.query,
        body: ctx.request.body,
      };
    });

    agent = supertest.agent(app.callback());
  });

  it('should convert POST with __params__ and __method__ flags to GET', async () => {
    const response = await agent
      .post('/api/test:list')
      .query({ param1: 'value1' })
      .send({
        __params__: { param2: 'value2' },
        __method__: 'get',
        otherData: 'data',
      });

    expect(response.status).toBe(200);
    expect(response.body.method).toBe('GET');
    expect(response.body.query).toMatchObject({
      param1: 'value1',
      param2: 'value2',
    });
    expect(response.body.body).toMatchObject({
      otherData: 'data',
    });
  });

  it('should keep POST as POST without __params__ flag', async () => {
    const response = await agent.post('/api/test:list').query({ param1: 'value1' }).send({ param2: 'value2' });

    expect(response.status).toBe(200);
    expect(response.body.method).toBe('POST');
    expect(response.body.query).toMatchObject({
      param1: 'value1',
    });
    expect(response.body.body).toMatchObject({
      param2: 'value2',
    });
  });

  it('should handle complex objects in __params__ correctly', async () => {
    const complexParams = {
      filter: {
        $and: [{ field1: { $eq: 'value1' } }, { field2: { $gt: 100 } }],
      },
      sort: ['field1', '-field2'],
      page: 1,
      pageSize: 20,
    };

    const response = await agent
      .post('/api/test:list')
      .query({ simple: 'query' })
      .send({ __params__: complexParams, __method__: 'get' });

    expect(response.status).toBe(200);
    expect(response.body.method).toBe('GET');

    // Verify complex objects are preserved correctly in query
    const query = response.body.query;
    expect(query).toMatchInlineSnapshot(`
      {
        "filter[$and][][field1][$eq]": "value1",
        "filter[$and][][field2][$gt]": "100",
        "page": "1",
        "pageSize": "20",
        "simple": "query",
        "sort[]": [
          "field1",
          "-field2",
        ],
      }
    `);
  });

  it('should handle empty body', async () => {
    const response = await agent.post('/api/test:list').query({ param1: 'value1' });

    expect(response.status).toBe(200);
    expect(response.body.method).toBe('POST');
    expect(response.body.query).toMatchObject({
      param1: 'value1',
    });
  });

  it('should handle different HTTP methods via __method__', async () => {
    const response = await agent.post('/api/test:list').send({
      __params__: { filter: { name: 'test' } },
      __method__: 'put',
    });

    expect(response.status).toBe(200);
    expect(response.body.method).toBe('PUT');
    expect(response.body.query).toMatchInlineSnapshot(`
      {
        "filter[name]": "test",
      }
    `);
  });

  it('should default to GET if __method__ is not specified', async () => {
    const response = await agent.post('/api/test:list').send({
      __params__: { filter: { name: 'test' } },
    });

    expect(response.status).toBe(200);
    expect(response.body.method).toBe('GET');
    expect(response.body.query).toMatchInlineSnapshot(`
      {
        "filter[name]": "test",
      }
    `);
  });
});
