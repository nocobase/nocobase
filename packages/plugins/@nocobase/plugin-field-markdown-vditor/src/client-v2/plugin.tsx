/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import 'vditor/dist/index.css';
import { MarkdownVditor } from './components';
import { MarkdownVditorFieldInterface } from './interface';
import { MarkdownVditorRuntime } from './runtime';

export class PluginFieldMarkdownVditorClient extends Plugin<any, Application> {
  declare app: any;
  dependencyLoaded = false;
  runtime: MarkdownVditorRuntime;

  async load() {
    this.runtime = new MarkdownVditorRuntime(this.app, () => this.app.getPublicPath());
    this.app.addComponents({ MarkdownVditor });
    this.app.addFieldInterfaces([MarkdownVditorFieldInterface]);
    this.flowEngine.context.defineProperty('markdownVditor', {
      get: () => this.runtime,
    });
    this.flowEngine.context.defineProperty('markdownVditorDependencies', {
      get: () => this.runtime.dependencies,
    });
    this.flowEngine.registerModelLoaders({
      VditorFieldModel: {
        loader: () => import('./models/VditorFieldModel'),
      },
      DisplayVditorFieldModel: {
        loader: () => import('./models/DisplayVditorFieldModel'),
      },
    });
  }

  getCDN() {
    return this.runtime.getCDN();
  }

  initVditorDependency() {
    return this.runtime.initVditorDependency();
  }
}

export default PluginFieldMarkdownVditorClient;
