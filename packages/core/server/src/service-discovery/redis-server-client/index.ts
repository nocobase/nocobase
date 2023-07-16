import { createClient } from 'redis';
import { ConnectionInfo, RemoteServiceInfo, ServiceDiscoveryClient, ServiceType } from '../client';

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

  async getServicesByName(serverType: ServiceType, name: string): Promise<RemoteServiceInfo[]> {
    const keyPrefix = `nocobase:${serverType}:${name}`;
    const client = await this.getRedisClient();
    const values = await client.sMembers(keyPrefix);

    return values.map((value) => {
      const [host, port] = value.split(':');
      return {
        type: serverType,
        name,
        host,
        port: parseInt(port),
      };
    });
  }

  async listServicesByType(serverType: ServiceType): Promise<Map<string, RemoteServiceInfo[]>> {
    const keyPrefix = `nocobase:${serverType}:*`;
    const client = await this.getRedisClient();
    const keys = await client.keys(keyPrefix);
    const servicesName = keys.map((key) => key.split(':')[2]);
    const services = new Map<string, RemoteServiceInfo[]>();

    for (const name of servicesName) {
      const servicesInfo = await this.getServicesByName(serverType, name);
      services.set(name, servicesInfo);
    }

    return services;
  }

  async registerService(serviceInfo: RemoteServiceInfo): Promise<boolean> {
    const key = this.serviceKey(serviceInfo);
    const client = await this.getRedisClient();
    const serviceValue = this.serviceValue(serviceInfo);
    console.log(`register service ${key} ${serviceValue}`);
    await client.sAdd(key, serviceValue);
    return true;
  }

  async unregisterService(serviceInfo: RemoteServiceInfo): Promise<boolean> {
    const key = this.serviceKey(serviceInfo);
    const client = await this.getRedisClient();
    await client.sRem(key, this.serviceValue(serviceInfo));
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

  async destroy() {
    if (this.client) {
      await this.client.disconnect();
    }
  }
}
