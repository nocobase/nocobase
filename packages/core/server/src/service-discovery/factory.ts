import { ServiceDiscoveryClient } from './client';
import { RedisDiscoveryServerClient } from './redis-server-client';

export class ServiceDiscoveryClientFactory {
  static build(): ServiceDiscoveryClient {
    const ServerURI = process.env['APP_DISCOVERY_SERVER'];
    if (!ServerURI) {
      throw new Error('APP_DISCOVERY_SERVER is not set');
    }

    if (ServerURI.startsWith('redis://')) {
      const client = new RedisDiscoveryServerClient();
      client.setServerURI(ServerURI);
      return client;
    }

    throw new Error(`Unsupported discovery server ${ServerURI}`);
  }
}
