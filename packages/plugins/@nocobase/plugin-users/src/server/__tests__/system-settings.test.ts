/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';

describe('user system settings', () => {
  let app: MockServer;
  let db: MockDatabase;
  let agent: any;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['acl', 'field-sort', 'users', 'data-source-manager', 'system-settings'],
    });
    db = app.db;
    agent = app.agent();
  });

  afterAll(async () => {
    await db.clean({ drop: true });
    await db.close();
    await app.destroy();
  });

  it('it should update and get user system settings', async () => {
    const res = await agent.resource('users').updateSystemSettings({ values: {} });
    expect(res.status).toBe(400);
    const res0 = await agent.resource('users').updateSystemSettings({
      values: {
        enableEditProfile: true,
        enableChangePassword: true,
      },
    });
    expect(res0.status).toBe(200);
    const res1 = await agent.resource('users').getSystemSettings();
    expect(res1.status).toBe(200);
    expect(res1.body.data.enableEditProfile).toBe(true);
    expect(res1.body.data.enableChangePassword).toBe(true);
    const res2 = await agent.resource('users').updateSystemSettings({
      values: {
        enableEditProfile: false,
      },
    });
    expect(res2.status).toBe(200);
    const res3 = await agent.resource('users').getSystemSettings();
    expect(res3.status).toBe(200);
    expect(res3.body.data.enableEditProfile).toBe(false);
  });
});
