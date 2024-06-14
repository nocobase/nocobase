/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor, Gateway } from '@nocobase/server';
import {
  MockServer,
  createMockServer,
  createWsClient,
  startServerWithRandomPort,
  supertest,
  waitSecond,
} from '@nocobase/test';
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

  it('should not boot sub app when main app is not running', async () => {
    app.on('beforeStart', async () => {
      await waitSecond(5000);
    });

    const startPromise = app.runCommand('restart');

    const subAppName = `td_${uid()}`;

    await app.db.getRepository('applications').create({
      values: {
        name: subAppName,
        options: {
          plugins: [],
        },
      },
    });

    const gateway = Gateway.getInstance();

    AppSupervisor.getInstance().mainAppHasBeenStarted = false;

    const agent = supertest(gateway.getCallback());

    const mainAppStatus = AppSupervisor.getInstance().getAppStatus('main');
    expect(mainAppStatus).not.toEqual('running');

    const res = await agent.get(`/api/app:getLang?__appName=${subAppName}`);
    const body = res.body;
    const error = body.error;
    expect(error.message).toBe('app reload');

    await startPromise;
  });

  it('should boot main app with sub apps', async () => {
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
      context: {
        waitSubAppInstall: true,
      },
    });

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
