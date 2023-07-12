import { AppSupervisor } from '@nocobase/server';
import http from 'http';
import Application from '../application';
import { RemoteServiceInfo, ServiceDiscoveryClient } from '../service-discovery/client';
import { ServiceDiscoveryClientFactory } from '../service-discovery/factory';
import { RpcBrokerInterface } from './interface';
import { createRpcHttpServer } from './rpc-http-server';

export class RemoteBroker extends RpcBrokerInterface {
  serviceDiscoverClient: ServiceDiscoveryClient;
  rpcServer: http.Server;

  constructor(appSupervisor: AppSupervisor) {
    super(appSupervisor);

    this.serviceDiscoverClient = ServiceDiscoveryClientFactory.build();

    appSupervisor.on('afterAppAdded', (app: Application) => {
      app.on('afterStart', async () => {
        // start rpc server at least one app is started
        if (!this.rpcServer) {
          this.rpcServer = createRpcHttpServer({
            port: parseInt(process.env['RPC_PORT']) || 23000,
            appSupervisor,
            host: '127.0.0.1',
          });
        }

        await this.serviceDiscoverClient.registerService(await this.getAppServiceInfo(app));
      });

      app.on('afterStop', async () => {
        await this.serviceDiscoverClient.unregisterService(await this.getAppServiceInfo(app));
      });
    });
  }

  async getAppServiceInfo(app: Application): Promise<RemoteServiceInfo> {
    return {
      type: 'apps',
      host: '127.0.0.1',
      port: parseInt(process.env['RPC_PORT']) || 23000,
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
