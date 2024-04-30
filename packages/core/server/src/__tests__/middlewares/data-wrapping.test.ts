/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import supertest from 'supertest';
import { Application } from '../../application';
import { dataWrapping } from '../../middlewares';

describe('data wrapping middleware', () => {
  it('should not wrap when ctx.withoutDataWrapping is true', async () => {
    const wrappingMiddleware = dataWrapping();
    const ctx: any = {
      withoutDataWrapping: true,
      body: [1, 2],
    };
    await wrappingMiddleware(ctx, async () => {});
    expect(ctx.body).toEqual([1, 2]);
  });

  it('should wrap ctx.body', async () => {
    const wrappingMiddleware = dataWrapping();
    const ctx: any = {
      body: [1, 2],
      state: {},
    };
    await wrappingMiddleware(ctx, async () => {});
    expect(ctx.body).toEqual({
      data: [1, 2],
    });
  });

  it('should wrap with pagination data', async () => {
    const wrappingMiddleware = dataWrapping();
    const ctx: any = {
      body: {
        rows: [1, 2],
        count: 2,
      },
      state: {},
    };
    await wrappingMiddleware(ctx, async () => {});
    expect(ctx.body).toEqual({
      data: [1, 2],
      meta: {
        count: 2,
      },
    });
  });

  it('should set body meta through ctx.bodyMeta', async () => {
    const wrappingMiddleware = dataWrapping();
    const ctx: any = {
      body: {
        key1: 'value1',
      },
      bodyMeta: {
        foo: 'bar',
      },
      state: {},
    };
    await wrappingMiddleware(ctx, async () => {});
    expect(ctx.body).toMatchObject({
      data: {
        key1: 'value1',
      },
      meta: {
        foo: 'bar',
      },
    });
  });
});

describe('application', () => {
  let app: Application;
  let agent;

  beforeEach(() => {
    app = new Application({
      database: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT as any,
        dialect: process.env.DB_DIALECT as any,
        dialectOptions: {
          charset: 'utf8mb4',
          collate: 'utf8mb4_unicode_ci',
        },
      },
      acl: false,
      resourcer: {
        prefix: '/api',
      },
      dataWrapping: true,
    });

    app.resourcer.registerActionHandlers({
      list: async (ctx, next) => {
        ctx.body = [1, 2];
        await next();
      },
      get: async (ctx, next) => {
        ctx.body = [3, 4];
        await next();
      },
      'foo2s.bar2s:list': async (ctx, next) => {
        ctx.body = [5, 6];
        await next();
      },
    });
    agent = supertest.agent(app.callback());
  });

  afterEach(async () => {
    return app.destroy();
  });

  it('resourcer.define', async () => {
    app.resourcer.define({
      name: 'test',
    });
    const response = await agent.get('/api/test');
    expect(response.body).toEqual({
      data: [1, 2],
    });
  });
});
