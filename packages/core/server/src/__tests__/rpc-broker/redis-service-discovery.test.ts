import { createClient } from 'redis';
import { AppSupervisor } from '../../app-supervisor';
import { Application } from '../../application';
import { RemoteBroker } from '../../rpc-broker/remote-broker';

describe('redis service discovery', () => {
  let redisClient;
  let app: Application;

  beforeEach(async () => {
    redisClient = createClient();

    await redisClient.connect({
      url: process.env['REDIS_URI'] || 'redis://localhost:6379',
    });
    await redisClient.flushAll();
    await redisClient.disconnect();

    AppSupervisor.getInstance().buildRpcBroker({
      discoveryServerURI: process.env['REDIS_URI'] || 'redis://localhost:6379',
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
    await AppSupervisor.getInstance().destroy();
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

  it('should get client connection info', async () => {
    const remoteBroker = AppSupervisor.getInstance().getRpcBroker() as RemoteBroker;
    const discoveryClient = remoteBroker.serviceDiscoverClient;
    const clientConnectionInfo = await discoveryClient.clientConnectionInfo();

    expect(clientConnectionInfo).toBeDefined();
  });
});
