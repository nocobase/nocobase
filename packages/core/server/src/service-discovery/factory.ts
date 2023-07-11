import { ServiceDiscoveryClient } from './client';
import { SingleProcessClient } from './single-process-client';

export class ServiceDiscoveryClientFactory {
  static build(): ServiceDiscoveryClient {
    return new SingleProcessClient();
  }
}
