abstract class ServiceDiscoveryClient {
  abstract registerService(service: string, serviceInfo: any): Promise<void>;
  abstract unregisterService(service: string): Promise<void>;
  abstract getServices(): Promise<string[]>;
}
