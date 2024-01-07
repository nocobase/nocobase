import { AppSupervisor, Gateway } from '@nocobase/server';
import { MockServer, createMockServer, createWsClient, startServerWithRandomPort, waitSecond } from '@nocobase/test';
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
