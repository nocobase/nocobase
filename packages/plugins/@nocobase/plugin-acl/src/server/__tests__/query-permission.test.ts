/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { NoPermissionError } from '@nocobase/acl';
import { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { applyQueryPermission } from '../query/apply-query-permission';
import { prepareApp } from './prepare';

describe('query permission', () => {
  let app: MockServer;
  let db: Database;

  beforeAll(async () => {
    app = await prepareApp();
    db = app.db;

    db.collection({
      name: 'orders',
      fields: [
        { name: 'id', type: 'bigInt' },
        { name: 'price', type: 'double' },
        {
          name: 'user',
          type: 'belongsTo',
          target: 'users',
          foreignKey: 'userId',
          targetKey: 'id',
        },
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

  it('should sanitize query fields and merge ACL filter without pruning user filter', async () => {
    const role = app.acl.define({ role: 'query-viewer' });
    role.grantAction('orders:view', {
      fields: ['id', 'user'],
      filter: { id: { $gt: 0 } },
    });
    role.grantAction('users:view', {
      fields: ['nickname'],
    });

    const result = await applyQueryPermission({
      acl: app.acl,
      db,
      resourceName: 'orders',
      currentRole: 'query-viewer',
      currentRoles: ['query-viewer'],
      query: {
        collection: 'orders',
        measures: [
          { field: ['id'], aggregation: 'count', alias: 'total' },
          { field: ['price'], aggregation: 'sum', alias: 'priceSum' },
        ],
        dimensions: [{ field: ['user', 'nickname'] }, { field: ['user', 'email'] }],
        orders: [{ field: ['user', 'nickname'] }, { field: ['price'] }],
        filter: {
          price: { $gt: 50 },
          user: {
            nickname: {
              $eq: 'demo',
            },
            email: {
              $eq: 'demo@example.com',
            },
          },
        },
        having: {
          total: { $gt: 0 },
          priceSum: { $gt: 100 },
          'user.nickname': { $ne: null },
        },
      },
    });

    expect(result.query.measures).toEqual([{ field: ['id'], aggregation: 'count', alias: 'total' }]);
    expect(result.query.dimensions).toEqual([{ field: ['user', 'nickname'] }]);
    expect(result.query.orders).toEqual([{ field: ['user', 'nickname'] }]);
    expect(result.query.filter).toEqual({
      price: { $gt: 50 },
      user: {
        nickname: {
          $eq: 'demo',
        },
        email: {
          $eq: 'demo@example.com',
        },
      },
      id: { $gt: 0 },
    });
    expect(result.query.having).toEqual({
      total: { $gt: 0 },
      'user.nickname': { $ne: null },
    });
  });

  it('should apply ACL own scope with variables', async () => {
    const user = await db.getRepository('users').findOne();
    const role = app.acl.define({ role: 'query-owner' });
    role.grantAction('orders:view', { own: true });

    const result = await applyQueryPermission({
      acl: app.acl,
      db,
      resourceName: 'orders',
      currentRole: 'query-owner',
      currentRoles: ['query-owner'],
      currentUser: user,
      state: {
        currentRole: 'query-owner',
        currentRoles: ['query-owner'],
        currentUser: user,
      },
      query: {
        collection: 'orders',
        measures: [{ field: ['id'], aggregation: 'count', alias: 'total' }],
      },
    });

    expect(result.query.filter.createdById).toBe(user.id);
  });

  it('should fallback to anonymous role when current role info is missing', async () => {
    const role = app.acl.define({ role: 'anonymous' });
    role.grantAction('orders:view', {
      fields: ['id'],
    });

    const result = await applyQueryPermission({
      acl: app.acl,
      db,
      resourceName: 'orders',
      query: {
        collection: 'orders',
        dimensions: [{ field: ['id'] }, { field: ['price'] }],
      },
    });

    expect(result.query.dimensions).toEqual([{ field: ['id'] }]);
  });

  it('should throw when resource has no view permission', async () => {
    await expect(
      applyQueryPermission({
        acl: app.acl,
        db,
        resourceName: 'orders',
        currentRole: 'forbidden',
        currentRoles: ['forbidden'],
        query: {
          collection: 'orders',
          measures: [{ field: ['id'], aggregation: 'count', alias: 'total' }],
        },
      }),
    ).rejects.toBeInstanceOf(NoPermissionError);
  });

  it('should keep selections when root resource has unrestricted view fields', async () => {
    const role = app.acl.define({ role: 'unrestricted-viewer' });
    role.grantAction('orders:view', {});

    const result = await applyQueryPermission({
      acl: app.acl,
      db,
      resourceName: 'orders',
      currentRole: 'unrestricted-viewer',
      currentRoles: ['unrestricted-viewer'],
      query: {
        collection: 'orders',
        measures: [{ field: ['price'], aggregation: 'sum', alias: 'priceSum' }],
        dimensions: [{ field: ['id'] }],
        orders: [{ field: ['price'] }],
        having: {
          priceSum: { $gt: 100 },
        },
      },
    });

    expect(result.query.measures).toEqual([{ field: ['price'], aggregation: 'sum', alias: 'priceSum' }]);
    expect(result.query.dimensions).toEqual([{ field: ['id'] }]);
    expect(result.query.orders).toEqual([{ field: ['price'] }]);
    expect(result.query.having).toEqual({
      priceSum: { $gt: 100 },
    });
  });

  it('should support string field paths and field-name having keys without alias', async () => {
    const role = app.acl.define({ role: 'string-field-viewer' });
    role.grantAction('orders:view', {
      fields: ['id'],
    });

    const result = await applyQueryPermission({
      acl: app.acl,
      db,
      resourceName: 'orders',
      currentRole: 'string-field-viewer',
      currentRoles: ['string-field-viewer'],
      query: {
        collection: 'orders',
        measures: [{ field: 'id', aggregation: 'count' }],
        dimensions: [{ field: 'id' }, { field: 'price' }],
        having: {
          id: { $gt: 0 },
          'orders.id': { $gt: 0 },
          price: { $gt: 100 },
        },
      },
    });

    expect(result.query.measures).toEqual([{ field: 'id', aggregation: 'count' }]);
    expect(result.query.dimensions).toEqual([{ field: 'id' }]);
    expect(result.query.having).toEqual({
      id: { $gt: 0 },
      'orders.id': { $gt: 0 },
    });
  });

  it('should prune association selections when target resource permission is missing', async () => {
    const role = app.acl.define({ role: 'root-only-viewer' });
    role.grantAction('orders:view', {
      fields: ['id', 'user'],
    });

    const result = await applyQueryPermission({
      acl: app.acl,
      db,
      resourceName: 'orders',
      currentRole: 'root-only-viewer',
      currentRoles: ['root-only-viewer'],
      query: {
        collection: 'orders',
        measures: [{ field: ['id'], aggregation: 'count', alias: 'total' }],
        dimensions: [{ field: ['user', 'nickname'] }],
        orders: [{ field: ['user', 'nickname'] }],
      },
    });

    expect(result.query.measures).toEqual([{ field: ['id'], aggregation: 'count', alias: 'total' }]);
    expect(result.query.dimensions).toBeUndefined();
    expect(result.query.orders).toBeUndefined();
  });

  it('should allow association selections when both relation field and target field are in fields', async () => {
    const role = app.acl.define({ role: 'association-field-viewer' });
    role.grantAction('orders:view', {
      fields: ['id', 'user'],
    });
    role.grantAction('users:view', {
      fields: ['nickname'],
    });

    const result = await applyQueryPermission({
      acl: app.acl,
      db,
      resourceName: 'orders',
      currentRole: 'association-field-viewer',
      currentRoles: ['association-field-viewer'],
      query: {
        collection: 'orders',
        dimensions: [{ field: ['user', 'nickname'] }],
        orders: [{ field: ['user', 'nickname'] }],
      },
    });

    expect(result.query.dimensions).toEqual([{ field: ['user', 'nickname'] }]);
    expect(result.query.orders).toEqual([{ field: ['user', 'nickname'] }]);
  });

  it('should union permissions across multiple roles', async () => {
    const role1 = app.acl.define({ role: 'query-role-1' });
    role1.grantAction('orders:view', {
      fields: ['user'],
    });
    const role2 = app.acl.define({ role: 'query-role-2' });
    role2.grantAction('orders:view', {
      fields: ['id'],
    });
    role2.grantAction('users:view', {
      fields: ['nickname'],
    });

    const result = await applyQueryPermission({
      acl: app.acl,
      db,
      resourceName: 'orders',
      currentRoles: ['query-role-1', 'query-role-2'],
      query: {
        collection: 'orders',
        measures: [{ field: ['id'], aggregation: 'count', alias: 'total' }],
        dimensions: [{ field: ['user', 'nickname'] }],
      },
    });

    expect(result.query.measures).toEqual([{ field: ['id'], aggregation: 'count', alias: 'total' }]);
    expect(result.query.dimensions).toEqual([{ field: ['user', 'nickname'] }]);
  });

  it('should prune nested having branches for removed selections', async () => {
    const role = app.acl.define({ role: 'having-viewer' });
    role.grantAction('orders:view', {
      fields: ['id'],
    });

    const result = await applyQueryPermission({
      acl: app.acl,
      db,
      resourceName: 'orders',
      currentRole: 'having-viewer',
      currentRoles: ['having-viewer'],
      query: {
        collection: 'orders',
        measures: [
          { field: ['id'], aggregation: 'count', alias: 'total' },
          { field: ['price'], aggregation: 'sum', alias: 'priceSum' },
        ],
        having: {
          $and: [{ total: { $gt: 0 } }, { priceSum: { $gt: 100 } }],
        },
      },
    });

    expect(result.query.measures).toEqual([{ field: ['id'], aggregation: 'count', alias: 'total' }]);
    expect(result.query.having).toEqual({
      $and: [{ total: { $gt: 0 } }],
    });
  });

  it('should drop having completely when all referenced selections are removed', async () => {
    const role = app.acl.define({ role: 'having-empty-viewer' });
    role.grantAction('orders:view', {
      fields: ['id'],
    });

    const result = await applyQueryPermission({
      acl: app.acl,
      db,
      resourceName: 'orders',
      currentRole: 'having-empty-viewer',
      currentRoles: ['having-empty-viewer'],
      query: {
        collection: 'orders',
        measures: [{ field: ['id'], aggregation: 'count', alias: 'total' }],
        having: {
          priceSum: { $gt: 100 },
        },
      },
    });

    expect(result.query.having).toBeUndefined();
  });

  it('should prune invalid and empty field paths from selections', async () => {
    const role = app.acl.define({ role: 'invalid-field-viewer' });
    role.grantAction('orders:view', {});

    const result = await applyQueryPermission({
      acl: app.acl,
      db,
      resourceName: 'orders',
      currentRole: 'invalid-field-viewer',
      currentRoles: ['invalid-field-viewer'],
      query: {
        collection: 'orders',
        dimensions: [{ field: [] }, { field: ['missing'] }, { field: ['id'] }],
      },
    });

    expect(result.query.dimensions).toEqual([{ field: ['id'] }]);
  });

  it('should prune paths that continue through a non-relation field', async () => {
    const role = app.acl.define({ role: 'non-relation-path-viewer' });
    role.grantAction('orders:view', {});

    const result = await applyQueryPermission({
      acl: app.acl,
      db,
      resourceName: 'orders',
      currentRole: 'non-relation-path-viewer',
      currentRoles: ['non-relation-path-viewer'],
      query: {
        collection: 'orders',
        dimensions: [{ field: ['price', 'nickname'] }, { field: ['id'] }],
      },
    });

    expect(result.query.dimensions).toEqual([{ field: ['id'] }]);
  });

  it('should throw when query becomes empty after pruning', async () => {
    const role = app.acl.define({ role: 'limited-field' });
    role.grantAction('orders:view', {
      fields: ['id'],
    });

    await expect(
      applyQueryPermission({
        acl: app.acl,
        db,
        resourceName: 'orders',
        currentRole: 'limited-field',
        currentRoles: ['limited-field'],
        query: {
          collection: 'orders',
          measures: [{ field: ['price'], alias: 'price' }],
        },
      }),
    ).rejects.toBeInstanceOf(NoPermissionError);
  });

  it('should throw when only orders are provided and all of them are pruned', async () => {
    const role = app.acl.define({ role: 'order-limited-field' });
    role.grantAction('orders:view', {
      fields: ['id'],
    });

    await expect(
      applyQueryPermission({
        acl: app.acl,
        db,
        resourceName: 'orders',
        currentRole: 'order-limited-field',
        currentRoles: ['order-limited-field'],
        query: {
          collection: 'orders',
          orders: [{ field: ['price'] }],
        },
      }),
    ).rejects.toBeInstanceOf(NoPermissionError);
  });
});
