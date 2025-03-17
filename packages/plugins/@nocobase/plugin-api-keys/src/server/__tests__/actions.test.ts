/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Repository } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

describe('actions', () => {
  let app: MockServer;
  let db: Database;
  let repo: Repository;
  let agent;
  let userAgent;
  let resource;

  afterEach(async () => {
    await app.destroy();
  });

  let user;
  let testUser;
  let role;
  let testRole;
  let createData;
  const expiresIn = 60 * 60 * 24;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['field-sort', 'users', 'auth', 'api-keys', 'acl', 'data-source-manager', 'system-settings'],
    });

    db = app.db;

    repo = db.getRepository('apiKeys');
    agent = app.agent();
    resource = agent.set('X-Role', 'admin').resource('apiKeys');
    const userRepo = app.db.getRepository('users');

    user = await userRepo.findOne({
      appends: ['roles'],
    });

    testUser = await userRepo.create({
      values: {
        nickname: 'test',
        roles: user.roles,
      },
    });
    const roleRepo = await app.db.getRepository('roles');
    testRole = await roleRepo.create({
      values: {
        name: 'TEST_ROLE',
      },
    });

    role = await (app.db.getRepository('users.roles', user.id) as unknown as Repository).findOne({
      where: {
        default: true,
      },
    });
    createData = {
      values: {
        name: 'TEST',
        role,
        expiresIn,
      },
    };
    userAgent = await agent.login(user);
  });

  describe('create', () => {
    let result;
    let tokenData;

    beforeEach(async () => {
      result = (await resource.create(createData)).body.data;
      tokenData = await app.authManager.jwt.decode(result.token);
    });

    it('basic', async () => {
      expect(result).toHaveProperty('token');
    });

    it('the role that does not belong to you should throw error', async () => {
      const res = await resource.create({
        values: {
          ...createData,
          role: testRole,
        },
      });
      expect(res.status).toBe(400);
      expect(res.text).toBe('Role not found');
    });

    it('token should work', async () => {
      const checkRes = await agent.set('Authorization', `Bearer ${result.token}`).resource('auth').check();
      expect(checkRes.body.data.nickname).toBe(user.nickname);
    });
    it('token sercurity config should not affect api key auth', async () => {
      const res = await userAgent.resource('tokenControlConfig').update({
        filterByTk: 'token-policy-config',
        values: {
          config: {
            tokenExpirationTime: '1s',
            sessionExpirationTime: '1s',
            expiredTokenRenewLimit: '1s',
          },
        },
      });
      expect(res.body.data.find((item) => item.key === 'token-policy-config').config.tokenExpirationTime).toBe('1s');
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const checkRes = await agent.set('Authorization', `Bearer ${result.token}`).resource('auth').check();
      expect(checkRes.body.data.nickname).toBe(user.nickname);
    });

    it('token expiresIn correctly', async () => {
      expect(tokenData.exp - tokenData.iat).toBe(expiresIn);
    });

    it('token roleName correctly', async () => {
      expect(tokenData.roleName).toBe(role.name);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await resource.create(createData);
    });

    it('basic', async () => {
      const res = await resource.list();
      expect(res.body.data.length).toBe(1);
      const data = res.body.data[0];
      expect(data.name).toContain(createData.values.name);
      expect(data.roleName).toContain(createData.values.role.name);
    });

    it("Only show current user's API keys", async () => {
      expect((await resource.list()).body.data.length).toBe(1);
      await agent.login(testUser);
      expect((await resource.list()).body.data.length).toBe(0);
      const values = {
        name: 'TEST_USER_KEY',
        expiresIn: 180 * 24 * 60 * 60,
        role,
      };
      await resource.create({
        values,
      });
      const listData = (await resource.list()).body.data;
      expect(listData.length).toBe(1);
      expect(listData[0].name).toBe(values.name);
    });
  });

  describe('destroy', () => {
    let result;

    beforeEach(async () => {
      result = (await resource.create(createData)).body.data;
    });

    it('basic', async () => {
      const res = await resource.list();
      expect(res.body.data.length).toBe(1);
      const data = res.body.data[0];
      await resource.destroy({
        filterByTk: data.id,
      });
      expect((await resource.list()).body.data.length).toBe(0);
    });

    it("Cannot delete other user's API keys", async () => {
      const res = await resource.list();
      expect(res.body.data.length).toBe(1);
      const data = res.body.data[0];
      await agent.login(testUser);
      await resource.destroy({
        filterByTk: data.id,
      });
      await agent.login(user);
      expect((await resource.list()).body.data.length).toBe(1);
    });

    it('The token should not work after removing the api key', async () => {
      const res = await resource.list();
      expect(res.body.data.length).toBe(1);
      const data = res.body.data[0];
      await resource.destroy({
        filterByTk: data.id,
      });
      const response = await agent.set('Authorization', `Bearer ${result.token}`).resource('auth').check();
      expect(response.status).toBe(401);
    });
  });
});
