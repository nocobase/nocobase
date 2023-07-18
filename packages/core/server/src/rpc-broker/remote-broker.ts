import http from 'http';
import { AppSupervisor } from '../app-supervisor';
import Application from '../application';
import { RemoteServiceInfo, ServiceDiscoveryClient } from '../service-discovery/client';
import { ServiceDiscoveryClientFactory } from '../service-discovery/factory';
import { AppAliveMonitor } from './app-alive-monitor';
import { RpcBrokerInterface, RpcBrokerOptions } from './interface';
import { RpcHttpClient, createRpcClient } from './rpc-http-client';
import { createRpcHttpServer } from './rpc-http-server';

export class RemoteBroker extends RpcBrokerInterface {
  serviceDiscoverClient: ServiceDiscoveryClient;
  rpcServer: http.Server;
  rpcClient: RpcHttpClient;
  appAliveMonitor: AppAliveMonitor;

  constructor(appSupervisor: AppSupervisor, options: RpcBrokerOptions = {}) {
    super(appSupervisor, options);

    this.serviceDiscoverClient = ServiceDiscoveryClientFactory.build({
      serverURI: options.discoveryServerURI,
    });
    this.rpcClient = createRpcClient();
    this.appAliveMonitor = new AppAliveMonitor(this);

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

        await this.registerApp(app);

        // start app alive monitor
        this.appAliveMonitor.startMonitor(app.name);
      });

      app.on('afterStop', async () => {
        await this.unregisterApp(app);
        this.appAliveMonitor.stopMonitor(app.name);
      });
    });
  }

  async registerApp(app: Application) {
    await this.serviceDiscoverClient.registerService(await this.getAppServiceInfo(app));
  }

  async unregisterApp(app: Application) {
    await this.serviceDiscoverClient.unregisterService(await this.getAppServiceInfo(app));
  }

  async getAppServiceInfo(app: Application): Promise<RemoteServiceInfo> {
    return {
      type: 'apps',
      host: '127.0.0.1',
      port: parseInt(process.env['RPC_PORT']) || 23000,
      name: app.name,
      instanceId: app.instanceId,
    };
  }

  async broadcast(caller: Application, event: string, eventOptions?: any) {
    const callerInfo = await this.getAppServiceInfo(caller);
    console.log(`broadcast ${caller.name} ${event} ${JSON.stringify(callerInfo)}`);

    const apps = await this.serviceDiscoverClient.listServicesByType('apps');
    const targets = [...apps.values()]
      .flat()
      .filter(
        (app) => !(callerInfo.name == callerInfo.name && app.host == callerInfo.host && app.port == callerInfo.port),
      );

    await Promise.all(
      targets.map((remoteServiceInfo: RemoteServiceInfo) => {
        const pushArgs = {
          remoteAddr: `http://${remoteServiceInfo.host}:${remoteServiceInfo.port}`,
          appName: remoteServiceInfo.name,
          event,
          options: eventOptions,
        };

        console.log(`broadcast ${JSON.stringify(pushArgs)}`);
        return this.rpcClient.push(pushArgs);
      }),
    );
  }

  async callApp(appName: string, method: string, ...args: any[]): Promise<{ result: any }> {
    const remoteAddr = await this.serviceDiscoverClient.fetchSingleService('apps', appName);

    if (!remoteAddr) {
      throw new Error(`failed to call app, app ${appName} not found`);
    }

    return await this.rpcClient.call({
      remoteAddr: `http://${remoteAddr.host}:${remoteAddr.port}`,
      appName,
      method,
      args,
    });
  }

  async pushToApp(appName: string, event: string, options?: any): Promise<boolean> {
    const remoteAddrs = await this.serviceDiscoverClient.getServicesByName('apps', appName);

    return (
      await Promise.all(
        remoteAddrs.map((remoteAddr) => {
          return this.rpcClient.push({
            remoteAddr: `http://${remoteAddr.host}:${remoteAddr.port}`,
            appName,
            event,
            options,
          });
        }),
      )
    ).every(Boolean);
  }

  async destroy() {
    // close rpc server
    this.rpcServer?.close();
    // stop app alive monitor
    this.appAliveMonitor.stop();
    // destroy service discovery client
    await this.serviceDiscoverClient.destroy();
  }
}
