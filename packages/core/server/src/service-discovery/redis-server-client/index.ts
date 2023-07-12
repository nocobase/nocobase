import { RemoteServiceInfo, ServiceDiscoveryClient } from '../client';

export class RedisServerClient extends ServiceDiscoveryClient {
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
