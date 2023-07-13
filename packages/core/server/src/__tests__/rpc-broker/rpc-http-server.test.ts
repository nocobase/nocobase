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

  it('should handle rpc client request', async () => {
    const rpcClient = createRpcClient();

    const response = await rpcClient.call({
      remoteAddr: `http://localhost:${serverPort}`,
      appName: app.name,
      method: 'name',
      args: [],
    });

    expect(response.result).toEqual(app.name);
  });
});
