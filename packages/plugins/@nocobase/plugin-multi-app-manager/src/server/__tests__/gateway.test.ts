/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor, Gateway } from '@nocobase/server';
import { createMockServer, createWsClient, MockServer, startServerWithRandomPort, waitSecond } from '@nocobase/test';
import { uid } from '@nocobase/utils';

describe('gateway with multiple apps', () => {
  let app: MockServer;
  let gateway: Gateway;
  let wsClient;

  beforeEach(async () => {
    gateway = Gateway.getInstance();

    app = await createMockServer({
      plugins: ['multi-app-manager'],
    });
  });

  afterEach(async () => {
    if (wsClient) {
      await wsClient.stop();
    }

    await app.destroy();
  });

  it.skip('should boot main app with sub apps', async () => {
    const mainStatus = AppSupervisor.getInstance().getAppStatus('main');
    expect(mainStatus).toEqual('running');

    const subAppName = `td_${uid()}`;

    // create app instance
    await app.db.getRepository('applications').create({
      values: {
        name: subAppName,
        options: {
          plugins: [],
        },
      },
    });

    await waitSecond(5000);

    const subApp = await AppSupervisor.getInstance().getApp(subAppName);
    await subApp.destroy();

    // start gateway
    const port = await startServerWithRandomPort(gateway.startHttpServer.bind(gateway));

    // create ws client
    wsClient = await createWsClient({
      serverPort: port,

      options: {
        headers: {
          'x-app': subAppName,
        },
      },
    });

    await waitSecond(3000);
    console.log(wsClient.messages);
    const lastMessage = wsClient.lastMessage();

    expect(lastMessage).toMatchObject({
      type: 'maintaining',
      payload: {
        code: 'APP_RUNNING',
      },
    });
  });
});
