import http from 'http';
import { AppSupervisor } from '../../app-supervisor';
import Application from '../../application';
import { createRpcClient } from '../../rpc-broker/rpc-http-client';
import { createRpcHttpServer } from '../../rpc-broker/rpc-http-server';

describe('rpc http server', () => {
  let app: Application;
  let rpcHttpServer: http.Server;

  let serverPort: string;

  beforeEach(async () => {
    app = new Application({
      database: {
        dialect: 'sqlite',
        dialectModule: require('sqlite3'),
        storage: ':memory:',
        logging: false,
      },
      resourcer: {
        prefix: '/api',
      },
      acl: false,
      dataWrapping: false,
      registerActions: false,
    });

    await app.start();

    //random http port in test
    const port = 0;

    [rpcHttpServer, serverPort] = await new Promise((resolve) => {
      createRpcHttpServer({
        port,
        appSupervisor: AppSupervisor.getInstance(),
        listenCallback(server) {
          resolve([server, (server.address() as any).port]);
        },
      });
    });
  });

  afterEach(async () => {
    await rpcHttpServer.close();
    await app.destroy();
  });

  it('should handle rpc client call request', async () => {
    const rpcClient = createRpcClient();

    const callResponse = await rpcClient.call({
      remoteAddr: `http://localhost:${serverPort}`,
      appName: app.name,
      method: 'name',
      args: [],
    });

    expect(callResponse.result).toEqual(app.name);
  });

  it('should handle rpc client push request', async () => {
    const rpcClient = createRpcClient();

    const appTestHandler = jest.fn();

    app.on('rpc:test', () => {
      appTestHandler();
    });

    const pushResponse = await rpcClient.push({
      remoteAddr: `http://localhost:${serverPort}`,
      appName: app.name,
      event: 'test',
      options: {},
    });

    expect(pushResponse).toEqual(true);

    expect(appTestHandler).toBeCalled();
  });
});
