import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import { EventEmitter } from 'events';
import type Application from './application';

export class AppSupervisor extends EventEmitter implements AsyncEmitter {
  private static instance: AppSupervisor;
  public runningMode: 'single' | 'multiple' = 'multiple';
  public singleAppName: string | null = null;
  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;
  public apps: {
    [key: string]: Application;
  } = {};

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
  }

  async destroy() {
    await this.reset();
    AppSupervisor.instance = null;
  }

  async getApp(appName: string, options = {}) {
    await this.emitAsync('beforeGetApplication', {
      appSupervisor: this,
      name: appName,
      options,
    });

    return this.apps[appName];
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

    const afterDestroy = () => {
      delete this.apps[app.name];
    };

    afterDestroy.alwaysBind = true;

    app.on('afterDestroy', afterDestroy);
    this.emit('afterAppAdded', app);
  }

  async removeApp(appName: string) {
    if (!this.apps[appName]) {
      console.log(`app ${appName} not exists`);
      return;
    }

    await this.apps[appName].destroy();
  }
}

applyMixins(AppSupervisor, [AsyncEmitter]);
