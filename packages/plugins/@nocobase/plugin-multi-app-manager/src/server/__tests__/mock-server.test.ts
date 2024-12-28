/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import { MockServer, createMockServer } from '@nocobase/test';

describe('sub app', async () => {
  let app: MockServer;
  let agent: any;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['multi-app-manager', 'client', 'ui-schema-storage', 'system-settings'],
    });
    await app.db.getRepository('applications').create({
      values: {
        name: 'test_sub',
        options: {
          plugins: ['client', 'ui-schema-storage', 'system-settings'],
        },
      },
      context: {
        waitSubAppInstall: true,
      },
    });

    agent = app.agent();
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('sub agent', async () => {
    const res = await agent.get('/app:getInfo');
    expect(res.body.data.name).toBe('main');
    const subAgent = agent.set('X-App', 'test_sub');
    const res1 = await subAgent.get('/app:getInfo');
    expect(res1.body.data.name).toBe('test_sub');
  });
});
