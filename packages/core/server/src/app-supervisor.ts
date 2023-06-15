import type Application from './application';

export class AppSupervisor {
  private static instance: AppSupervisor;
  private apps: {
    [key: string]: Application;
  } = {};

  private constructor() {}

  public static getInstance(): AppSupervisor {
    if (!AppSupervisor.instance) {
      AppSupervisor.instance = new AppSupervisor();
    }
    return AppSupervisor.instance;
  }

  getApp(appName: string) {
    return this.apps[appName];
  }

  startApp(appName: string) {}

  stopApp(appName: string) {}

  restartApp(appName: string) {}

  getStatus(appName: string) {}

  addApp(app: Application) {
    // if there is already an app with the same name, throw error
    if (this.apps[app.name]) {
      throw new Error(`app ${app.name} already exists`);
    }

    this.apps[app.name] = app;
  }

  removeApp(appName: string) {
    delete this.apps[appName];
  }
}
