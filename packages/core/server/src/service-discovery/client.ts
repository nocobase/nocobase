export interface ConnectionInfo {
  port: number;
  host: string;
}

export interface RemoteServiceInfo extends ConnectionInfo {
  type: 'apps';
  name: string;
}

export type ServiceInfo = RemoteServiceInfo;

export abstract class ServiceDiscoveryClient {
  // register service to service discovery server
  // service name must contain namespace, form: namespace:service
  // e.g. apps:main, apps:admin
  abstract registerService(serviceInfo: RemoteServiceInfo): Promise<boolean>;

  abstract unregisterService(serviceInfo: RemoteServiceInfo): Promise<boolean>;

  abstract getServices(namespace: string): Promise<RemoteServiceInfo[]>;

  abstract clientConnectionInfo(): Promise<ConnectionInfo>;

  async fetchSingleService(namespace: string, name: string): Promise<RemoteServiceInfo> {
    const services = await this.getServices(namespace);
    return this.randomSelectArrayItem(services);
  }

  protected randomSelectArrayItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
