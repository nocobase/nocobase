import * as process from 'process';
import { AppSupervisor } from '../app-supervisor';
import { LocalBroker } from './local-broker';
import { RemoteBroker } from './remote-broker';

export class RpcBrokerFactory {
  static build(appSupervisor: AppSupervisor) {
    if (process.env['APP_DISCOVERY_SERVER']) {
      return new RemoteBroker(appSupervisor);
    } else {
      return new LocalBroker(appSupervisor);
    }
  }
}
