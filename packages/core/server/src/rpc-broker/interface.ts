import { AppSupervisor } from '../app-supervisor';
import Application from '../application';

export interface RpcBrokerOptions {
  discoveryServerURI?: string;
}

export abstract class RpcBrokerInterface {
  appSupervisor: AppSupervisor;
  options: RpcBrokerOptions;

  constructor(appSupervisor: AppSupervisor, options: RpcBrokerOptions) {
    this.appSupervisor = appSupervisor;
    this.options = options;
  }

  abstract callApp(appName: string, method: string, ...args: any[]): Promise<{ result: any }>;

  abstract pushToApp(appName: string, event: string, options?: any): Promise<boolean>;

  abstract broadcast(caller: Application, event: string, eventOptions?: any);
}
