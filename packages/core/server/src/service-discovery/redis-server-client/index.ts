import { nanoid } from 'nanoid';
import { createClient, RedisClientType } from 'redis';
import { AcquireLockOptions } from '../../rpc-broker/mutex-interface';
import { ConnectionInfo, RemoteServiceInfo, ServiceDiscoveryClient, ServiceType } from '../client';

export class RedisDiscoveryServerClient extends ServiceDiscoveryClient {
  serverURI: string;

  client: RedisClientType;

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

  getInstanceIdFromKey(key) {
    return key.split(':').pop();
  }

  async getServicesByName(serverType: ServiceType, name: string): Promise<RemoteServiceInfo[]> {
    const keyPrefix = `nocobase:${serverType}:${name}:*`;
    const client = await this.getRedisClient();
    const keys = await client.keys(keyPrefix);

    const services: RemoteServiceInfo[] = [];

    for (const key of keys) {
      const value = await client.get(key);
      const [host, port] = value.split(':');

      services.push({
        instanceId: this.getInstanceIdFromKey(key),
        type: serverType,
        name,
        host,
        port: parseInt(port),
      });
    }

    return services;
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
    await client.set(key, serviceValue);

    // service will expire after 10 seconds
    await client.expire(key, 10);
    return true;
  }

  async unregisterService(serviceInfo: RemoteServiceInfo): Promise<boolean> {
    const key = this.serviceKey(serviceInfo);
    const client = await this.getRedisClient();
    console.log(`unregister service ${key}`);

    await client.del(key);
    return true;
  }

  clientConnectionInfo(): Promise<ConnectionInfo> {
    return Promise.resolve(undefined);
  }

  private serviceKey(serviceInfo: RemoteServiceInfo) {
    return `nocobase:${serviceInfo.type}:${serviceInfo.name}:${serviceInfo.instanceId}`;
  }

  private serviceValue(serviceInfo: RemoteServiceInfo) {
    return `${serviceInfo.host}:${serviceInfo.port}`;
  }

  async destroy() {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  async acquireLock(options: AcquireLockOptions): Promise<string | null> {
    const { lockName, timeout = 10000, retryDelay = 100, maxRetries = 10 } = options;

    const client = await this.getRedisClient();
    const identifier = nanoid();
    const lockKey = `nocobase:lock:${lockName}`;

    for (let i = 0; i < maxRetries; i++) {
      const result = await client.sendCommand(['SET', lockKey, identifier, 'NX', 'PX', `${timeout}`]);

      if (result) {
        return identifier;
      }

      console.log(`acquire lock ${lockName} failed, retry ${i + 1} times`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    return null;
  }

  async releaseLock(lockName: string, identifier: string): Promise<boolean> {
    lockName = `nocobase:lock:${lockName}`;

    const client = await this.getRedisClient();

    try {
      await client.watch(lockName);

      const result = await client.get(lockName);

      if (result === identifier) {
        const multi = client.multi();
        multi.del(lockName);
        await multi.exec();
      }

      await client.unwatch();
    } catch (err) {
      console.error(err);
      return false;
    }

    return true;
  }
}
