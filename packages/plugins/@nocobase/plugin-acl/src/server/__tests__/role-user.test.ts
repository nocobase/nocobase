/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { BelongsToManyRepository } from '@nocobase/database';
import UsersPlugin from '@nocobase/plugin-users';
import { createMockServer, MockServer } from '@nocobase/test';
import jwt from 'jsonwebtoken';
import { SystemRoleMode } from '../enum';
import { UNION_ROLE_KEY } from '../constants';

describe('role', () => {
  let api: MockServer;
  let db: Database;

  let usersPlugin: UsersPlugin;

  beforeEach(async () => {
    api = await createMockServer({
      plugins: ['field-sort', 'users', 'acl', 'auth', 'data-source-manager', 'system-settings', 'ui-schema-storage'],
    });
    db = api.db;
    usersPlugin = api.getPlugin('users');
  });

  afterEach(async () => {
    await api.destroy();
  });

  it.skip('should create user with roles', async () => {
    const role1 = await db.getRepository('roles').create({
      values: {
        name: 'test1',
        title: 'Admin User',
      },
    });

    const role2 = await db.getRepository('roles').create({
      values: {
        name: 'test2',
        title: 'test2 user',
      },
    });

    const resp = await api
      .agent()
      .resource('users')
      .create({
        values: {
          username: 'testUser',
          roles: [
            {
              name: 'test1',
            },
            {
              name: 'test2',
            },
          ],
        },
      });
    console.log('resp.body', JSON.stringify(resp.body, null, 2));

    expect(resp.body.data.roles[0].name).toBeDefined();
  });

  it('should set default role', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'test1',
        title: 'Admin User',
        allowConfigure: true,
        default: true,
      },
    });

    const user = await db.getRepository('users').create({});

    // @ts-ignore
    const roles = await user.getRoles();

    expect(roles.length).toEqual(1);
    expect(roles[0].get('name')).toEqual('test1');
  });

  it('should not add role when user has role', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'test1',
        default: true,
      },
    });

    await db.getRepository('roles').create({
      values: {
        name: 'test2',
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        roles: [
          {
            name: 'test2',
          },
        ],
      },
    });

    // @ts-ignore
    const roles = await user.getRoles();

    expect(roles.length).toEqual(1);
    expect(roles[0].get('name')).toEqual('test2');
  });

  it('should set users default role', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'test1',
        title: 'Admin User',
        allowConfigure: true,
        default: true,
      },
    });

    await db.getRepository('roles').create({
      values: {
        name: 'test2',
        title: 'test2 user',
        allowConfigure: true,
      },
    });

    const user = await db.getRepository('users').create({
      values: {
        token: '123',
      },
    });

    const userRolesRepo = db.getRepository<BelongsToManyRepository>('users.roles', user.get('id') as string);
    await userRolesRepo.add('test1');
    await userRolesRepo.add('test2');

    const userToken = jwt.sign({ userId: user.get('id') }, 'test-key');
    const response = await api
      .agent()
      .post('/users:setDefaultRole')
      .send({
        roleName: 'test2',
      })
      .set({
        Authorization: `Bearer ${userToken}`,
        'X-Authenticator': 'basic',
      });

    expect(response.statusCode).toEqual(200);

    const userRoles = await userRolesRepo.find();
    const defaultRole = userRoles.find((userRole) => userRole.get('rolesUsers').default);

    expect(defaultRole['name']).toEqual('test2');
  });

  it('should set users default role is __union__', async () => {
    const role = await db.getRepository('roles').create({
      values: {
        name: 'test',
        title: 'test user',
        allowConfigure: true,
      },
    });
    const user = await db.getRepository('users').create({
      values: {
        token: '123',
        roles: [role.name],
      },
    });

    const repo = db.getRepository('systemSettings');
    await repo.update({
      filter: { id: 1 },
      values: {
        roleMode: SystemRoleMode.allowUseUnion,
      },
    });
    const userToken = jwt.sign({ userId: user.get('id') }, 'test-key');
    const response = await api
      .agent()
      .post('/users:setDefaultRole')
      .send({
        roleName: UNION_ROLE_KEY,
      })
      .set({
        Authorization: `Bearer ${userToken}`,
        'X-Authenticator': 'basic',
      });

    expect(response.statusCode).toEqual(200);
    let userRole = await db.getRepository('rolesUsers').findOne({ where: { userId: user.get('id'), default: true } });
    expect(userRole.roleName).toEqual(UNION_ROLE_KEY);

    // switch
    const response1 = await api
      .agent()
      .post('/users:setDefaultRole')
      .send({
        roleName: role.name,
      })
      .set({
        Authorization: `Bearer ${userToken}`,
        'X-Authenticator': 'basic',
      });

    expect(response1.statusCode).toEqual(200);
    userRole = await db.getRepository('rolesUsers').findOne({ where: { userId: user.get('id'), default: true } });
    expect(userRole.roleName).toEqual(role.name);

    const response2 = await api
      .agent()
      .post('/users:setDefaultRole')
      .send({
        roleName: UNION_ROLE_KEY,
      })
      .set({
        Authorization: `Bearer ${userToken}`,
        'X-Authenticator': 'basic',
      });

    expect(response2.statusCode).toEqual(200);
    userRole = await db.getRepository('rolesUsers').findOne({ where: { userId: user.get('id'), default: true } });
    expect(userRole.roleName).toEqual(UNION_ROLE_KEY);
    const agent = await api.agent().login(user);
    const response3 = await agent.resource('roles').check();
    expect(response3.statusCode).toEqual(200);
  });
});
