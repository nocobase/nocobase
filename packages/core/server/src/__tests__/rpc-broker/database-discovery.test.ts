import { Database } from '@nocobase/database';
import { Application, AppSupervisor } from '../../';
import { RemoteBroker } from '../../rpc-broker/remote-broker';
import { DatabaseDiscoveryClient } from '../../service-discovery/database-discovery-client';

export const sleep = async (timeout = 0) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

describe('database discovery', () => {
  let app: Application;

  let db: Database;
  beforeEach(async () => {
    AppSupervisor.getInstance().buildRpcBroker({
      discoveryServerURI: 'db',
    });

    const remoteBroker = AppSupervisor.getInstance().getRpcBroker() as RemoteBroker;
    const discoveryClient = remoteBroker.serviceDiscoverClient as DatabaseDiscoveryClient;

    db = await discoveryClient.getDb({
      beforeSync: async (db) => {
        await db.clean({ drop: true });
      },
    });

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
  });

  afterEach(async () => {
    await sleep(100);
    await AppSupervisor.getInstance().destroy();
  });

  it('should create database discovery client', async () => {
    const remoteBroker = AppSupervisor.getInstance().getRpcBroker() as RemoteBroker;
    const discoveryClient = remoteBroker.serviceDiscoverClient;
    expect(discoveryClient).toBeInstanceOf(DatabaseDiscoveryClient);
  });

  it('should register app', async () => {
    const remoteBroker = AppSupervisor.getInstance().getRpcBroker() as RemoteBroker;
    const discoveryClient = remoteBroker.serviceDiscoverClient;

    const serviceInfo = await discoveryClient.getServicesByName('apps', app.name);
    expect(serviceInfo.length).toBe(1);
    const allServices = await discoveryClient.listServicesByType('apps');
    expect(allServices.size).toBe(1);
    expect(allServices.get(app.name).length).toBe(1);

    remoteBroker.appAliveMonitor.stopMonitor(app.name);

    // should expire after 10 seconds
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const serviceInfo2 = await discoveryClient.getServicesByName('apps', app.name);
    expect(serviceInfo2.length).toBe(0);
  });

  it('should keep alive', async () => {
    const remoteBroker = AppSupervisor.getInstance().getRpcBroker() as RemoteBroker;
    const discoveryClient = remoteBroker.serviceDiscoverClient;
    const serviceInfo = await discoveryClient.getServicesByName('apps', app.name);
    expect(serviceInfo.length).toBe(1);
    const allServices = await discoveryClient.listServicesByType('apps');
    expect(allServices.size).toBe(1);
    expect(allServices.get(app.name).length).toBe(1);

    await new Promise((resolve) => setTimeout(resolve, 15000));
    const serviceInfo3 = await discoveryClient.getServicesByName('apps', app.name);
    expect(serviceInfo3.length).toBe(1);
  });
});
