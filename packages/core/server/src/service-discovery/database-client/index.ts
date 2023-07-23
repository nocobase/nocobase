import { Database } from '@nocobase/database';
import { AcquireLockOptions } from '../../rpc-broker/mutex-interface';
import { ConnectionInfo, RemoteServiceInfo, ServiceDiscoveryClient, ServiceType } from '../client';

export class DatabaseDiscoveryClient extends ServiceDiscoveryClient {
  db: Database;

  getDb() {
    if (!this.db) {
    }

    return this.db;
  }

  acquireLock(options: AcquireLockOptions): Promise<string | null> {
    return Promise.resolve(undefined);
  }

  clientConnectionInfo(): Promise<ConnectionInfo> {
    return Promise.resolve(undefined);
  }

  getServicesByName(serverType: ServiceType, name: string): Promise<RemoteServiceInfo[]> {
    return Promise.resolve([]);
  }

  listServicesByType(serverType: ServiceType): Promise<Map<string, RemoteServiceInfo[]>> {
    return Promise.resolve(undefined);
  }

  registerService(serviceInfo: RemoteServiceInfo): Promise<boolean> {
    return Promise.resolve(false);
  }

  releaseLock(lockName: string, identifier: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  unregisterService(serviceInfo: RemoteServiceInfo): Promise<boolean> {
    return Promise.resolve(false);
  }
}
