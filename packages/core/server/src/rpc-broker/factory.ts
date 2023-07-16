import { AppSupervisor } from '../app-supervisor';
import { RpcBrokerOptions } from './interface';
import { LocalBroker } from './local-broker';
import { RemoteBroker } from './remote-broker';

export class RpcBrokerFactory {
  static build(appSupervisor: AppSupervisor, options: RpcBrokerOptions = {}) {
    if (options.discoveryServerURI) {
      return new RemoteBroker(appSupervisor, options);
    } else {
      return new LocalBroker(appSupervisor, options);
    }
  }
}
