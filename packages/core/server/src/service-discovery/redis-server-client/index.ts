import { RemoteServiceInfo, ServiceDiscoveryClient } from '../client';

export class RedisDiscoveryServerClient extends ServiceDiscoveryClient {
  serverURI: string;

  setServerURI(serverURI: string) {
    this.serverURI = serverURI;
  }

  getRedisClient() {
    return null;
  }

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
