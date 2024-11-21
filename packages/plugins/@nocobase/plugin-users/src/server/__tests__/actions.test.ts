/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

describe('actions', () => {
  let app: MockServer;
  let db: Database;
  let adminUser;
  let agent;
  let adminAgent;
  let pluginUser;

  beforeEach(async () => {
    process.env.INIT_ROOT_EMAIL = 'test@nocobase.com';
    process.env.INIT_ROOT_PASSWORD = '123456';
    process.env.INIT_ROOT_NICKNAME = 'Test';
    app = await createMockServer({
      plugins: ['field-sort', 'auth', 'users', 'acl', 'data-source-manager'],
    });
    db = app.db;

    pluginUser = app.getPlugin('users');
    adminUser = await db.getRepository('users').findOne({
      filter: {
        email: process.env.INIT_ROOT_EMAIL,
      },
      appends: ['roles'],
    });

    agent = app.agent();
    adminAgent = app.agent().login(adminUser);
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('update profile', async () => {
    const res1 = await agent.resource('users').updateProfile({
      filterByTk: adminUser.id,
      values: {
        nickname: 'a',
      },
    });
    expect(res1.status).toBe(401);

    const res2 = await adminAgent.resource('users').updateProfile({
      filterByTk: adminUser.id,
      values: {
        nickname: 'a',
      },
    });
    expect(res2.status).toBe(200);
  });

  it('update profile, but not roles', async () => {
    expect(adminUser.roles.length).not.toBe(0);
    const res2 = await adminAgent.resource('users').updateProfile({
      filterByTk: adminUser.id,
      values: {
        nickname: 'a',
        username: 'a',
        email: 'test@nocobase.com',
        phone: '12345678901',
        systemSettings: {
          ...adminUser.systemSettings,
          themeId: 1,
        },
        appLang: 'zh-CN',
        roles: [],
      },
    });
    expect(res2.status).toBe(200);
    const user = await db.getRepository('users').findOne({
      filterByTk: adminUser.id,
      appends: ['roles'],
    });
    expect(user.nickname).toBe('a');
    expect(user.username).toBe('a');
    expect(user.email).toBe('test@nocobase.com');
    expect(user.phone).toBe('12345678901');
    expect(user.systemSettings.themeId).toBe(1);
    expect(user.appLang).toBe('zh-CN');
    expect(user.roles.length).not.toBe(0);
  });
});
