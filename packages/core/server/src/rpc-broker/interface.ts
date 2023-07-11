import { AppSupervisor } from '../app-supervisor';
import Application from '../application';

export abstract class RpcBrokerInterface {
  appSupervisor: AppSupervisor;

  constructor(appSupervisor: AppSupervisor) {
    this.appSupervisor = appSupervisor;
  }

  abstract callApp(appName: string, method: string, ...args: any[]): Promise<{ result: any }>;

  abstract pushToApp(appName: string, event: string, options?: any): Promise<boolean>;

  abstract broadcast(caller: Application, event: string, eventOptions?: any);
}
