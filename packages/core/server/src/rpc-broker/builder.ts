import { AppSupervisor } from '@nocobase/server';
import * as process from 'process';
import { LocalBroker } from './local-broker';

export class RpcBrokerBuilder {
  static build(appSupervisor: AppSupervisor) {
    if (process.env['APP_DISCOVERY_SERVER']) {
    } else {
      return new LocalBroker(appSupervisor);
    }
  }
}
