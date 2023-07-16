import { ServiceDiscoveryClient } from './client';
import { RedisDiscoveryServerClient } from './redis-server-client';

interface ServiceDiscoveryClientBuildOptions {
  serverURI: string;
}

export class ServiceDiscoveryClientFactory {
  static build(options: ServiceDiscoveryClientBuildOptions): ServiceDiscoveryClient {
    const ServerURI = options.serverURI;

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
