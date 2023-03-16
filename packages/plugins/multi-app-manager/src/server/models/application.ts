import { Model, Transactionable } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { AppDbCreator, AppOptionsFactory } from '../server';

export interface registerAppOptions extends Transactionable {
  skipInstall?: boolean;
  appOptionsFactory: AppOptionsFactory;
}

export class ApplicationModel extends Model {
  registerToMainApp(mainApp: Application, options: registerAppOptions) {
    const appName = this.get('name') as string;
    const appOptions = (this.get('options') as any) || {};

    const subApp = new Application({
      ...options.appOptionsFactory(appName, mainApp),
      ...appOptions,
      name: appName,
    });

    mainApp.appManager.addSubApp(subApp);

    return subApp;
  }
}
