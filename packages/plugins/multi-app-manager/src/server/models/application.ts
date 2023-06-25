import { Model, Transactionable } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { AppOptionsFactory } from '../server';

export interface registerAppOptions extends Transactionable {
  skipInstall?: boolean;
  appOptionsFactory: AppOptionsFactory;
}

export class ApplicationModel extends Model {
  registerToSupervisor(mainApp: Application, options: registerAppOptions) {
    const appName = this.get('name') as string;
    const appOptions = (this.get('options') as any) || {};

    const subAppOptions = {
      ...options.appOptionsFactory(appName, mainApp),
      ...appOptions,
      name: appName,
    };

    return new Application(subAppOptions);
  }
}
