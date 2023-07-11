import Application from '../application';

interface RemoteServiceInfo {
  type: 'remote';
  host: 'string';
  port: number;
}

interface LocalServiceInfo {
  type: 'local';
}

export type ServiceInfo = RemoteServiceInfo | LocalServiceInfo;

export abstract class ServiceDiscoveryClient {
  abstract registerAppService(service: string, app: Application): Promise<boolean>;

  abstract unregisterService(service: string): Promise<void>;

  abstract getServices(): Promise<ServiceInfo[]>;
}
