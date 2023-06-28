import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import { EventEmitter } from 'events';
import type Application from './application';

type BootOptions = {
  appName: string;
  options: any;
  appSupervisor: AppSupervisor;
};

type AppBootstrapper = (bootOptions: BootOptions) => Promise<void>;

export class AppSupervisor extends EventEmitter implements AsyncEmitter {
  private static instance: AppSupervisor;
  public runningMode: 'single' | 'multiple' = 'multiple';
  public singleAppName: string | null = null;
  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;
  public apps: {
    [key: string]: Application;
  } = {};

  private appBootstrapper: AppBootstrapper = null;

  private constructor() {
    super();

    if (process.env.STARTUP_SUBAPP) {
      this.runningMode = 'single';
      this.singleAppName = process.env.STARTUP_SUBAPP;
    }
  }

  public static getInstance(): AppSupervisor {
    if (!AppSupervisor.instance) {
      AppSupervisor.instance = new AppSupervisor();
    }

    return AppSupervisor.instance;
  }

  async reset() {
    const appNames = Object.keys(this.apps);
    for (const appName of appNames) {
      await this.removeApp(appName);
    }

    this.appBootstrapper = null;
    this.removeAllListeners();
  }

  async destroy() {
    await this.reset();
    AppSupervisor.instance = null;
  }

  async bootStrapApp(appName: string, options = {}) {
    if (!this.hasApp(appName) && this.appBootstrapper) {
      await this.appBootstrapper({
        appSupervisor: this,
        appName,
        options,
      });
    }
  }

  async getApp(appName: string, options = {}) {
    await this.bootStrapApp(appName, options);
    return this.apps[appName];
  }

  setAppBootstrapper(appBootstrapper: AppBootstrapper) {
    this.appBootstrapper = appBootstrapper;
  }

  hasApp(appName: string): boolean {
    return !!this.apps[appName];
  }

  addApp(app: Application) {
    // if there is already an app with the same name, throw error
    if (this.apps[app.name]) {
      throw new Error(`app ${app.name} already exists`);
    }

    console.log(`add app ${app.name} into supervisor`);

    this.apps[app.name] = app;

    // listen afterDestroy event, after app destroyed, remove it from supervisor
    const afterDestroy = () => {
      delete this.apps[app.name];
    };

    // set alwaysBind to true, so that afterDestroy will always be listened after application reload
    afterDestroy.alwaysBind = true;

    app.on('afterDestroy', afterDestroy);
    this.emit('afterAppAdded', app);

    return app;
  }

  async removeApp(appName: string) {
    if (!this.apps[appName]) {
      console.log(`app ${appName} not exists`);
      return;
    }

    // call app.destroy
    await this.apps[appName].destroy();
  }

  subApps() {
    return Object.values(this.apps).filter((app) => app.name !== 'main');
  }

  on(eventName: string | symbol, listener: (...args: any[]) => void): this {
    const listeners = this.listeners(eventName);
    const listenerName = listener.name;

    if (listenerName !== '') {
      const exists = listeners.find((l) => l.name === listenerName);

      if (exists) {
        super.removeListener(eventName, exists as any);
      }
    }

    return super.on(eventName, listener);
  }

  async rpcCall(appName: string, method: string, ...args: any[]) {
    const app = this.apps[appName];
    if (!app) {
      throw new Error(`rpc call failed, app ${appName} not exists`);
    }

    return await app.handleDynamicCall(method, ...args);
  }
}

applyMixins(AppSupervisor, [AsyncEmitter]);
