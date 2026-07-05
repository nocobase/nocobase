/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, ensureMarkdownRegistry, Plugin } from '@nocobase/client-v2';
import 'vditor/dist/index.css';
import { MarkdownVditor } from './components';
import { MarkdownVditorFieldInterface } from './interface';
import { MarkdownVditorRuntime, registerMarkdownVditorContext, type MarkdownVditorRuntimeApp } from './runtime';

export class PluginMarkdownClient extends Plugin<Record<string, never>, Application> {
  declare app: Application & MarkdownVditorRuntimeApp;
  dependencyLoaded = false;
  runtime: MarkdownVditorRuntime;

  async load() {
    this.runtime = new MarkdownVditorRuntime(this.app, () => this.app.getPublicPath());
    this.app.addComponents({ MarkdownVditor });
    this.app.addFieldInterfaces([MarkdownVditorFieldInterface]);
    ensureMarkdownRegistry(this.flowEngine.context).register(this.runtime, { default: true });
    registerMarkdownVditorContext(this.flowEngine.context, this.runtime);
    this.flowEngine.registerModelLoaders({
      MarkdownBlockModel: {
        loader: () => import('./models/MarkdownBlockModel'),
      },
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

export default PluginMarkdownClient;
