/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import { SortFieldInterface } from './sort-interface';

export class PluginFieldSortClient extends Plugin<any, Application> {
  async load() {
    this.app.addFieldInterfaces([SortFieldInterface]);
    this.flowEngine.registerModelLoaders({
      SortFieldModel: {
        loader: () => import('./models/SortFieldModel'),
      },
    });
  }
}

export default PluginFieldSortClient;
