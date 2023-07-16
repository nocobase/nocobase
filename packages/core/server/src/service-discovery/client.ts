export interface ConnectionInfo {
  port: number;
  host: string;
}

export interface RemoteServiceInfo extends ConnectionInfo {
  type: ServiceType;
  name: string;
}

export type ServiceInfo = RemoteServiceInfo;

export type ServiceType = 'apps';
export abstract class ServiceDiscoveryClient {
  // register service to service discovery server
  // service name must contain namespace, form: namespace:service
  // e.g. apps:main, apps:admin
  abstract registerService(serviceInfo: RemoteServiceInfo): Promise<boolean>;

  abstract unregisterService(serviceInfo: RemoteServiceInfo): Promise<boolean>;

  abstract getServicesByName(serverType: ServiceType, name: string): Promise<RemoteServiceInfo[]>;

  abstract listServicesByType(serverType: ServiceType): Promise<Map<string, RemoteServiceInfo[]>>;

  abstract clientConnectionInfo(): Promise<ConnectionInfo>;

  async fetchSingleService(serverType: ServiceType, name: string): Promise<RemoteServiceInfo> {
    const services = await this.getServicesByName(serverType, name);
    return this.randomSelectArrayItem(services);
  }

  protected randomSelectArrayItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  // destroy client
  async destroy() {}
}
