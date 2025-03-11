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

  beforeEach(async () => {
    process.env.INIT_ROOT_EMAIL = 'test@nocobase.com';
    process.env.INIT_ROOT_PASSWORD = '123456';
    process.env.INIT_ROOT_NICKNAME = 'Test';
    app = await createMockServer({
      plugins: ['auth', 'users', 'acl', 'data-source-manager', 'system-settings', 'theme-editor', 'field-sort'],
    });
    db = app.db;

    adminUser = await db.getRepository('users').findOne({
      filter: {
        email: process.env.INIT_ROOT_EMAIL,
      },
    });

    agent = app.agent();
    adminAgent = await app.agent().login(adminUser);
  });

  afterEach(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('update theme', async () => {
    const res = await adminAgent.resource('users').updateTheme({
      values: {
        themeId: 2,
      },
    });
    expect(res.status).toBe(200);
    const user = await db.getRepository('users').findOne({
      filterByTk: adminUser.id,
    });
    expect(user.systemSettings).toMatchObject({
      ...user.systemSettings,
      themeId: 2,
    });
  });
});
