import Application from '@nocobase/server';
import { AppSupervisor } from '../../app-supervisor';
import { RpcBrokerFactory } from '../../rpc-broker/factory';
import { RemoteBroker } from '../../rpc-broker/remote-broker';
import { RemoteServiceInfo, ServiceDiscoveryClient } from '../../service-discovery/client';
import { ServiceDiscoveryClientFactory } from '../../service-discovery/factory';

class MockServiceDiscoveryClient extends ServiceDiscoveryClient {
  services = new Map<string, Set<string>>();

  async getServices(namespace: string): Promise<RemoteServiceInfo[]> {
    return [...this.services.values()]
      .map((info) => [...info])
      .flat()
      .map((info) => JSON.parse(info) as RemoteServiceInfo);
  }

  async registerService(serviceInfo: RemoteServiceInfo): Promise<boolean> {
    const info = JSON.stringify(serviceInfo);
    const exists = this.services.get(serviceInfo.name);
    if (!exists) {
      this.services.set(serviceInfo.name, new Set());
    }

    this.services.get(serviceInfo.name).add(info);

    return true;
  }

  unregisterService(serviceInfo: RemoteServiceInfo): Promise<void> {
    const info = JSON.stringify(serviceInfo);
    const exists = this.services.get(serviceInfo.name);
    if (!exists) {
      return;
    }

    this.services.get(serviceInfo.name).delete(info);
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

    const registerService = jest.spyOn(mockServiceDiscoveryClient, 'registerService');

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

    expect(registerService).toHaveBeenCalled();
    const services = await mockServiceDiscoveryClient.getServices('apps');
    expect(services.length).toBe(1);
    await app.destroy();
    const services2 = await mockServiceDiscoveryClient.getServices('apps');
    expect(services2.length).toBe(0);
  });
});
