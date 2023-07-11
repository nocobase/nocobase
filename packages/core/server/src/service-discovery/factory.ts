import { ServiceDiscoveryClient } from './client';
import { RedisServerClient } from './redis-server-client';

export class ServiceDiscoveryClientFactory {
  static build(): ServiceDiscoveryClient {
    return new RedisServerClient();
  }
}
