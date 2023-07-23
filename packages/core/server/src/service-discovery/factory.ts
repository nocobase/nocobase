import { ServiceDiscoveryClient } from './client';
import { DatabaseDiscoveryClient } from './database-discovery-client';
import { RedisDiscoveryClient } from './redis-discovery-client';

interface ServiceDiscoveryClientBuildOptions {
  serverURI: string;
}

export class ServiceDiscoveryClientFactory {
  static build(options: ServiceDiscoveryClientBuildOptions): ServiceDiscoveryClient {
    const ServerURI = options.serverURI;

    if (!ServerURI) {
      throw new Error('APP_DISCOVERY_SERVER is not set');
    }

    if (ServerURI.startsWith('db')) {
      return new DatabaseDiscoveryClient();
    }

    if (ServerURI.startsWith('redis://')) {
      const client = new RedisDiscoveryClient();
      client.setServerURI(ServerURI);
      return client;
    }

    throw new Error(`Unsupported discovery server ${ServerURI}`);
  }
}
