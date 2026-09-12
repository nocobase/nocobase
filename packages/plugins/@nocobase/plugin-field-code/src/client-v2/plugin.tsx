/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import { CodeFieldInterface } from './interface';

export class PluginFieldCodeClient extends Plugin<any, Application> {
  declare app: any;

  async load() {
    this.app.addFieldInterfaces([CodeFieldInterface]);
    this.flowEngine.registerModelLoaders({
      CodeFieldModel: {
        loader: () => import('./models/CodeFieldModel'),
      },
      DisplayCodeFieldModel: {
        loader: () => import('./models/DisplayCodeFieldModel'),
      },
    });
  }
}

export default PluginFieldCodeClient;
