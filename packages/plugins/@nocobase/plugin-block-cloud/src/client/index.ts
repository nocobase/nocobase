/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { CloudBlockFlowModel } from './CloudBlockFlowModel';

export class PluginBlockCloudClient extends Plugin {
  async load() {
    // Register the CloudBlockFlowModel
    this.flowEngine.registerModels({ CloudBlockFlowModel });

    // Set up requirejs context for cloud components
    const existingContext = this.flowEngine.getContext() || {};
    this.flowEngine.setContext({
      ...existingContext,
      app: this.app,
      requireAsync: async (mod: string): Promise<any> => {
        return new Promise((resolve, reject) => {
          this.app.requirejs.requirejs([mod], (arg: any) => resolve(arg), reject);
        });
      },
    });
  }
}

export default PluginBlockCloudClient;
