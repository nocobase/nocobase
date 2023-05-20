import type { Transactionable } from '@nocobase/database';
import { Model } from '@nocobase/database';
import { Application } from '@nocobase/server';
import type { AppOptionsFactory } from '../server';

export interface registerAppOptions extends Transactionable {
  skipInstall?: boolean;
  appOptionsFactory: AppOptionsFactory;
}

export class ApplicationModel extends Model {
  async registerToMainApp(mainApp: Application, options: registerAppOptions) {
    const appName = this.get('name') as string;
    const appOptions = (this.get('options') as any) || {};

    const subAppOptions = {
      ...options.appOptionsFactory(appName, mainApp),
      ...appOptions,
      name: appName,
    };

    const subApp = new Application(subAppOptions);
    await subApp.pm.waitPluginsLoaded();

    mainApp.appManager.addSubApp(subApp);

    console.log(`register application ${appName} to main app`);
    return subApp;
  }
}
