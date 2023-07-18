import { Mutex } from 'async-mutex';
import { nanoid } from 'nanoid';
import Application from '../application';
import { RpcBrokerInterface } from './interface';
import { AcquireLockOptions } from './mutex-interface';

export class LocalBroker extends RpcBrokerInterface {
  private lockInfoMap = new Map();

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

    app.handleEventPush(event, options);

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

  async acquireLock(options: AcquireLockOptions): Promise<string | null> {
    const { lockName, timeout = 10000, retryDelay = 1000, maxRetries = 10 } = options;

    for (let i = 0; i < maxRetries; i++) {
      if (!this.lockInfoMap.has(lockName)) {
        const lockInfo = {
          mutex: new Mutex(),
          identifier: null,
          timeoutId: null,
        };

        this.lockInfoMap.set(lockName, lockInfo);

        const release = await lockInfo.mutex.acquire();
        const identifier = nanoid();
        lockInfo.identifier = identifier;

        lockInfo.timeoutId = setTimeout(() => {
          release();
          this.lockInfoMap.delete(lockName);
        }, timeout);

        return identifier;
      }

      console.log(`try to acquire lock ${lockName} failed, retry ${i + 1}/${maxRetries} times`);

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    return null;
  }

  async releaseLock(lockName: string, identifier: string): Promise<boolean> {
    const lockInfo = this.lockInfoMap.get(lockName);

    if (lockInfo && lockInfo.identifier === identifier) {
      clearTimeout(lockInfo.timeoutId);
      lockInfo.mutex.release();
      this.lockInfoMap.delete(lockName);
      return true;
    }

    return false;
  }

  async destroy() {
    // clear lock

    for (const lockName of this.lockInfoMap.keys()) {
      const lockInfo = this.lockInfoMap.get(lockName);
      clearTimeout(lockInfo.timeoutId);
      lockInfo.mutex.release();
      this.lockInfoMap.delete(lockName);
    }
  }
}
