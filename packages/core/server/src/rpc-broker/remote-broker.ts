import { AppSupervisor } from '@nocobase/server';
import Application from '../application';
import { RemoteServiceInfo, ServiceDiscoveryClient } from '../service-discovery/client';
import { ServiceDiscoveryClientFactory } from '../service-discovery/factory';
import { RpcBrokerInterface } from './interface';

export class RemoteBroker extends RpcBrokerInterface {
  serviceDiscoverClient: ServiceDiscoveryClient;

  constructor(appSupervisor: AppSupervisor) {
    super(appSupervisor);

    this.serviceDiscoverClient = ServiceDiscoveryClientFactory.build();

    appSupervisor.on('afterAppAdded', (app: Application) => {
      app.on('afterStart', async () => {
        await this.serviceDiscoverClient.registerService(this.getAppServiceInfo(app));
      });
    });
  }

  getAppServiceInfo(app: Application): RemoteServiceInfo {
    return {
      type: 'remote',
      host: 'localhost',
      port: 123,
      name: app.name,
    };
  }

  broadcast(caller: Application, event: string, eventOptions?: any) {}

  callApp(appName: string, method: string, ...args: any[]): Promise<{ result: any }> {
    return Promise.resolve({ result: undefined });
  }

  pushToApp(appName: string, event: string, options?: any): Promise<boolean> {
    return Promise.resolve(false);
  }
}
