/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

    const subApp = new Application(subAppOptions);

    subApp.on('afterStart', () => {
      mainApp.emit('subAppStarted', subApp);
    });

    return subApp;
  }
}
