import { Model, Transactionable } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { AppOptionsFactory } from '../server';
import { merge } from '@nocobase/utils';

export interface registerAppOptions extends Transactionable {
  skipInstall?: boolean;
  appOptionsFactory: AppOptionsFactory;
}

export class ApplicationModel extends Model {
  registerToSupervisor(mainApp: Application, options: registerAppOptions) {
    const appName = this.get('name') as string;
    const appModelOptions = (this.get('options') as any) || {};

    const appOptions = options.appOptionsFactory(appName, mainApp);

    const subAppOptions = {
      ...(merge(appOptions, appModelOptions) as object),
      name: appName,
    };

    return new Application(subAppOptions);
  }
}
