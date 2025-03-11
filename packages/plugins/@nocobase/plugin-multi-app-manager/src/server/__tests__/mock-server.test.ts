/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import { createMockServer, MockServer } from '@nocobase/test';

describe('sub app', async () => {
  let app: MockServer;
  let agent: any;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['multi-app-manager', 'client', 'ui-schema-storage', 'system-settings', 'field-sort'],
    });
    await app.db.getRepository('applications').create({
      values: {
        name: 'test_sub',
        options: {
          plugins: ['client', 'ui-schema-storage', 'system-settings', 'field-sort'],
        },
      },
      context: {
        waitSubAppInstall: true,
      },
    });

    agent = app.agent();
  });

  afterEach(async () => {
    const subApp = await AppSupervisor.getInstance().getApp('test_sub');
    await subApp.db.clean({ drop: true });
    await subApp.destroy();
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  test('sub agent', async () => {
    const res = await agent.get('/app:getInfo');
    expect(res.body.data.name).toBe('main');

    const subApp = await AppSupervisor.getInstance().getApp('test_sub');

    const res1 = await app.agent(subApp.callback()).get('/api/app:getInfo');
    expect(res1.body.data.name).toBe('test_sub');
  });
});
