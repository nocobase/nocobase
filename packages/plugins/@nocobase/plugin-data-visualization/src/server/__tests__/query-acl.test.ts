/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import compose from 'koa-compose';
import { Database } from '@nocobase/database';
import { checkPermission, parseFieldAndAssociations, queryData, postProcess, parseVariables } from '../actions/query';
import { createQueryParser } from '../query-parser';

describe('query acl scope', () => {
  let app: MockServer;
  let db: Database;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['field-sort', 'data-source-manager', 'users', 'acl'],
    });
    db = app.db;

    db.collection({
      name: 'orders',
      fields: [
        { name: 'id', type: 'bigInt' },
        { name: 'price', type: 'double' },
      ],
      createdBy: true,
    });

    await db.sync();

    await db.getRepository('orders').create({
      values: [
        { id: 1, price: 40 },
        { id: 2, price: 60 },
      ],
    });
  });

  afterAll(async () => {
    await app.destroy();
  });

  it('should apply ACL scope filter', async () => {
    const role = app.acl.define({ role: 'viewer' });
    role.grantAction('orders:view', {
      filter: { price: { $gt: 50 } },
    });

    const context: any = {
      app,
      db,
      state: { currentRoles: ['viewer'] },
      action: {
        params: {
          values: {
            collection: 'orders',
            measures: [{ field: ['price'], alias: 'price' }],
            dimensions: [{ field: ['id'], alias: 'id' }],
          },
        },
      },
      throw: () => {},
    };

    await checkPermission(context, async () => {});
    const merged = context.action.params.values.filter as any;
    expect(merged.price.$gt).toBe(50);
    expect(merged.price.$lt).toBeUndefined();

    const queryParser = createQueryParser(db);
    await compose([parseFieldAndAssociations, queryParser.parse(), queryData, postProcess])(context, async () => {});
    const data = context.body as any[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].price).toBe(60);
  });

  it('should merge ACL scope filter with chart filter', async () => {
    const role = app.acl.define({ role: 'reporter' });
    role.grantAction('orders:view', {
      filter: { price: { $gt: 50 } },
    });

    const context: any = {
      app,
      db,
      state: { currentRoles: ['reporter'] },
      action: {
        params: {
          values: {
            collection: 'orders',
            measures: [{ field: ['price'], alias: 'price' }],
            dimensions: [{ field: ['id'], alias: 'id' }],
            filter: { price: { $lt: 100 } },
          },
        },
      },
      throw: () => {},
    };

    const queryParser = createQueryParser(db);

    await checkPermission(context, async () => {});
    const merged = context.action.params.values.filter as any;
    expect(merged.price.$gt).toBe(50);
    expect(merged.price.$lt).toBe(100);

    await compose([parseFieldAndAssociations, queryParser.parse(), queryData, postProcess])(context, async () => {});
    const data = context.body as any[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].price).toBe(60);
  });

  it('should apply ACL scope filter with variables', async () => {
    const role = app.acl.define({ role: 'analyst' });
    role.grantAction('orders:view', {
      filter: { id: '{{$user.id}}' },
    });

    const user = await db.getRepository('users').findOne();

    const context: any = {
      app,
      db,
      state: { currentRoles: ['analyst'], currentUser: user },
      get: (key: string) => ({ 'x-timezone': '' })[key],
      action: {
        params: {
          values: {
            collection: 'orders',
            measures: [{ field: ['price'], alias: 'price' }],
            dimensions: [{ field: ['id'], alias: 'id' }],
          },
        },
      },
      throw: () => {},
    };

    await checkPermission(context, async () => {});
    await parseVariables(context, async () => {});
    const merged = context.action.params.values.filter as any;
    expect(merged.id).toBe(user.id);

    const queryParser = createQueryParser(db);
    await compose([parseFieldAndAssociations, queryParser.parse(), queryData, postProcess])(context, async () => {});
    const data = context.body as any[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(user.id);
  });

  it('should apply ACL own scope for chart query', async () => {
    const user = await db.getRepository('users').findOne();
    const other = await db.getRepository('users').create({ values: { nickname: 'other' } });

    await db.getRepository('orders').create({
      values: { id: 100, price: 10 },
      context: { state: { currentUser: user } },
    });
    await db.getRepository('orders').create({
      values: { id: 200, price: 20 },
      context: { state: { currentUser: other } },
    });

    const role = app.acl.define({ role: 'owner' });
    role.grantAction('orders:view', { own: true });

    const context: any = {
      app,
      db,
      state: { currentRoles: ['owner'], currentUser: user },
      get: (key: string) => ({ 'x-timezone': '' })[key],
      action: {
        params: {
          values: {
            collection: 'orders',
            measures: [{ field: ['price'], alias: 'price' }],
            dimensions: [{ field: ['id'], alias: 'id' }],
          },
        },
      },
      throw: () => {},
    };

    await checkPermission(context, async () => {});
    await parseVariables(context, async () => {});
    const mergedOwn = context.action.params.values.filter as any;
    expect(mergedOwn.createdById).toBe(user.id);

    const queryParser = createQueryParser(db);
    await compose([parseFieldAndAssociations, queryParser.parse(), queryData, postProcess])(context, async () => {});
    const data = context.body as any[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].id).toBe(100);
  });
});
