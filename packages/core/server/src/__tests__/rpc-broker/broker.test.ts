import Application from '@nocobase/server';
import { AppSupervisor } from '../../app-supervisor';
import { RpcBrokerFactory } from '../../rpc-broker/factory';
import { RemoteBroker } from '../../rpc-broker/remote-broker';
import { RemoteServiceInfo, ServiceDiscoveryClient } from '../../service-discovery/client';
import { ServiceDiscoveryClientFactory } from '../../service-discovery/factory';

class MockServiceDiscoveryClient extends ServiceDiscoveryClient {
  getServices(namespace: string): Promise<RemoteServiceInfo[]> {
    return Promise.resolve([]);
  }

  registerService(serviceInfo: RemoteServiceInfo): Promise<boolean> {
    return Promise.resolve(false);
  }

  unregisterService(serviceInfo: RemoteServiceInfo): Promise<void> {
    return Promise.resolve(undefined);
  }
}

describe('rpc broker', function () {
  beforeEach(async () => {});

  it('should register app after appStarted', async () => {
    // always use remote broker
    jest.spyOn(RpcBrokerFactory, 'build').mockImplementation((appSupervisor) => {
      return new RemoteBroker(appSupervisor);
    });

    const mockServiceDiscoveryClient = new MockServiceDiscoveryClient();

    // always use mock service discovery client
    jest.spyOn(ServiceDiscoveryClientFactory, 'build').mockReturnValue(mockServiceDiscoveryClient);

    const appSupervisor = AppSupervisor.getInstance();
    const rpcBroker = appSupervisor.getRpcBroker();
    expect(rpcBroker).toBeInstanceOf(RemoteBroker);

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
    
    expect(mockServiceDiscoveryClient.registerService).toHaveBeenCalled();
    await app.destroy();
  });
});
