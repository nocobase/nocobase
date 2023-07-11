import Application from '../application';
import { RpcBrokerInterface } from './interface';

export class LocalBroker extends RpcBrokerInterface {
  async callApp(appName: string, method: string, ...args: any[]): Promise<{ result: any }> {
    const app = this.appSupervisor.apps[appName];

    if (!app) {
      throw new Error(`rpc call failed, app ${appName} not exists`);
    }

    return await app.handleDynamicCall(method, ...args);
  }

  async pushToApp(appName: string, event: string, options?: any): Promise<boolean> {
    const app = this.appSupervisor.apps[appName];
    if (!app) {
      throw new Error(`rpc call failed, app ${appName} not exists`);
    }

    await app.handleEventPush(event, options);

    return true;
  }

  async broadcast(caller: Application, event: string, eventOptions?: any) {
    const appNames = Object.keys(this.appSupervisor.apps);
    for (const appName of appNames) {
      if (appName === caller.name) {
        continue;
      }

      console.log(`broadcast ${event} to ${appName}`);
      await this.pushToApp(appName, event, eventOptions);
    }
  }
}
