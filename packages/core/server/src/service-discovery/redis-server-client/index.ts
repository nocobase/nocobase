import { createClient } from 'redis';
import { ConnectionInfo, RemoteServiceInfo, ServiceDiscoveryClient } from '../client';

export class RedisDiscoveryServerClient extends ServiceDiscoveryClient {
  serverURI: string;

  client: any;

  setServerURI(serverURI: string) {
    this.serverURI = serverURI;
  }

  async getRedisClient() {
    if (!this.client) {
      this.client = createClient({
        url: this.serverURI,
      });

      await this.client.connect();
    }

    return this.client;
  }

  getServices(namespace: string): Promise<RemoteServiceInfo[]> {
    return Promise.resolve([]);
  }

  async registerService(serviceInfo: RemoteServiceInfo): Promise<boolean> {
    const key = this.serviceKey(serviceInfo);
    const client = await this.getRedisClient();
    await client.sAdd(key, this.serviceValue(serviceInfo));
    return true;
  }

  async unregisterService(serviceInfo: RemoteServiceInfo): Promise<boolean> {
    const key = this.serviceKey(serviceInfo);
    const client = await this.getRedisClient();
    await client.sREM(key, this.serviceValue(serviceInfo));
    return true;
  }

  clientConnectionInfo(): Promise<ConnectionInfo> {
    return Promise.resolve(undefined);
  }

  private serviceKey(serviceInfo: RemoteServiceInfo) {
    return `nocobase:${serviceInfo.type}:${serviceInfo.name}`;
  }

  private serviceValue(serviceInfo: RemoteServiceInfo) {
    return `${serviceInfo.host}:${serviceInfo.port}`;
  }
}
