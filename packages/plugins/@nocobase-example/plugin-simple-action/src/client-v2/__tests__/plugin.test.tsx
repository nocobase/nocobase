/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import PluginSimpleActionClientV2 from '../plugin';

async function loadPlugin() {
  const app = createMockClient({
    plugins: [PluginSimpleActionClientV2],
  });
  app.apiMock.onGet('app:getInfo').reply(200, { data: { name: 'demo-app' } });
  await app.load();
  return app;
}

describe('plugin-simple-action client-v2', () => {
  it('should register the /v2-demo/ homepage route', async () => {
    const app = await loadPlugin();

    expect(app.router.getRoutes()['simple-action-v2.homepage']).toMatchObject({
      path: '/v2-demo/',
    });
  });

  it('should register the /v2-demo/app-info route', async () => {
    const app = await loadPlugin();

    expect(app.router.getRoutes()['simple-action-v2.app-info']).toMatchObject({
      path: '/v2-demo/app-info',
    });
  });

  it('should register the /v2-demo/flow-settings-component-loader route and lazy field', async () => {
    const app = await loadPlugin();

    expect(app.router.getRoutes()['simple-action-v2.flow-settings-component-loader']).toMatchObject({
      path: '/v2-demo/flow-settings-component-loader',
    });
    expect(app.flowEngine.flowSettings.components.DemoFlowSettingsLazyField).toBeDefined();
  });
});
