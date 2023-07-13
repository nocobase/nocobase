import http from 'http';
import { AppSupervisor } from '../app-supervisor';
import Application from '../application';
import { RemoteServiceInfo, ServiceDiscoveryClient } from '../service-discovery/client';
import { ServiceDiscoveryClientFactory } from '../service-discovery/factory';
import { RpcBrokerInterface } from './interface';
import { RpcHttpClient, createRpcClient } from './rpc-http-client';
import { createRpcHttpServer } from './rpc-http-server';

export class RemoteBroker extends RpcBrokerInterface {
  serviceDiscoverClient: ServiceDiscoveryClient;
  rpcServer: http.Server;
  rpcClient: RpcHttpClient;

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
    this.rpcClient = createRpcClient();
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

  async callApp(appName: string, method: string, ...args: any[]): Promise<{ result: any }> {
    const remoteAddr = await this.serviceDiscoverClient.fetchSingleService('apps', appName);
    return await this.rpcClient.call(`${remoteAddr.host}:${remoteAddr.port}`, method, ...args);
  }

  pushToApp(appName: string, event: string, options?: any): Promise<boolean> {
    return Promise.resolve(false);
  }
}
