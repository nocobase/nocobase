/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { CodeEditor } from './CodeEditor';
import { LowcodeBlockModel } from './LowcodeBlockModel';

export class PluginBlockLowcodeClient extends Plugin {
  async load() {
    // Register CodeEditor component to flowSettings
    this.flowEngine.flowSettings.registerComponents({
      CodeEditor,
    });

    // Register the LowcodeBlockFlowModel
    this.flowEngine.registerModels({ LowcodeBlockModel });

    // Set up requirejs context for lowcode components
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

export default PluginBlockLowcodeClient;
