export interface RemoteServiceInfo {
  type: 'remote';
  host: 'string';
  port: number;
  name: string;
}

interface LocalServiceInfo {
  type: 'local';
}

export type ServiceInfo = RemoteServiceInfo | LocalServiceInfo;

export abstract class ServiceDiscoveryClient {
  // register service to service discovery server
  // service name must contain namespace, form: namespace:service
  // e.g. apps:main, apps:admin
  abstract registerService(serviceInfo: RemoteServiceInfo): Promise<boolean>;

  abstract unregisterService(serviceInfo: RemoteServiceInfo): Promise<void>;

  abstract getServices(namespace: string): Promise<RemoteServiceInfo[]>;
}
