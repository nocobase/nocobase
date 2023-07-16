import { createClient } from 'redis';
import { AppSupervisor } from '../../app-supervisor';
import { Application } from '../../application';
import { RemoteBroker } from '../../rpc-broker/remote-broker';

describe('redis service discovery', () => {
  let redisClient;

  beforeEach(async () => {
    redisClient = createClient();

    await redisClient.connect({
      url: process.env['REDIS_URL'] || 'redis://localhost:6379',
    });

    await redisClient.flushAll();

    AppSupervisor.getInstance().buildRpcBroker({
      discoveryServerURI: process.env['REDIS_URL'] || 'redis://localhost:6379',
    });
  });

  afterEach(async () => {
    await redisClient.disconnect();
    await AppSupervisor.getInstance().destroy();
  });

  it('should register into app', async () => {
    const app = new Application({
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

    const discoveryClient = (AppSupervisor.getInstance().getRpcBroker() as RemoteBroker).serviceDiscoverClient;
    const serviceInfo = await discoveryClient.getServicesByName('apps', app.name);
    expect(serviceInfo.length).toBe(1);
    const allServices = await discoveryClient.listServicesByType('apps');
    expect(allServices.size).toBe(1);
    expect(allServices.get(app.name).length).toBe(1);
  });
});
