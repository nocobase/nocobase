/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayFieldRepository, Database, Model } from '@nocobase/database';
import UsersPlugin from '@nocobase/plugin-users';
import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';

describe('role api', () => {
  let app: MockServer;
  let db: Database;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
  });

  describe('grant', () => {
    let role: Model;
    let admin: Model;
    let adminAgent;

    beforeEach(async () => {
      role = await db.getRepository('roles').findOne({
        filter: {
          name: 'admin',
        },
      });

      const UserRepo = db.getCollection('users').repository;
      admin = await UserRepo.create({
        values: {
          roles: ['admin'],
        },
      });

      const userPlugin = app.getPlugin('users') as UsersPlugin;
      adminAgent = await app.agent().login(admin);
    });

    it('should have permission to users collection with strategy', async () => {
      await db.getRepository('roles').create({
        values: {
          name: 'tests',
          strategy: {
            actions: ['view'],
          },
        },
      });

      const user1 = await db.getRepository('users').create({
        values: {
          roles: ['tests'],
        },
      });

      const userAgent = await app.agent().login(user1);

      const response = await userAgent.resource('users').list();
      expect(response.statusCode).toBe(200);
    });

    it('should list actions', async () => {
      const response = await adminAgent.resource('availableActions').list();
      expect(response.statusCode).toEqual(200);
    });

    it('should grant universal role actions', async () => {
      // grant role actions
      const response = await adminAgent.resource('roles').update({
        forceUpdate: true,
        values: {
          strategy: {
            actions: ['create:all', 'view:own'],
          },
        },
      });

      expect(response.statusCode).toEqual(200);

      await role.reload();

      expect(role.get('strategy')).toMatchObject({
        actions: ['create:all', 'view:own'],
      });
    });
  });

  it('should works with default option', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'role1',
        title: 'admin 1',
        default: true,
      },
    });

    await db.getRepository('roles').create({
      values: {
        name: 'role2',
        default: true,
      },
    });

    const defaultRole = await db.getRepository('roles').find({
      filter: {
        default: true,
      },
    });

    expect(defaultRole.length).toEqual(1);
    expect(defaultRole[0].get('name')).toEqual('role2');
  });

  it('should sync snippet patterns', async () => {
    app.acl.registerSnippet({
      name: 'collections',
      actions: ['collection:*'],
    });

    await db.getRepository('roles').create({
      values: {
        name: 'role1',
      },
    });

    await db.getRepository<ArrayFieldRepository>('roles.snippets', 'role1').set({
      values: ['collections'],
    });

    const role1Instance = await db.getRepository('roles').findOne({
      filterByTk: 'role1',
    });

    const role1 = app.acl.getRole('role1');

    expect(role1.toJSON()['snippets']).toEqual(['collections']);
  });
});
