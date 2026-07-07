/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import {
  DisplayVditorFieldModel,
  getMarkdownRegistry,
  MarkdownVditor,
  MarkdownVditorFieldInterface,
  MarkdownVditorRuntime,
  registerMarkdownVditorContext,
  type MarkdownVditorRuntimeApp,
  VditorFieldModel,
} from '@nocobase/plugin-markdown/client-v2';
import 'vditor/dist/index.css';

export class PluginFieldMarkdownVditorClient extends Plugin<Record<string, never>, Application> {
  declare app: Application & MarkdownVditorRuntimeApp;
  dependencyLoaded = false;
  runtime: MarkdownVditorRuntime;

  async load() {
    this.runtime = new MarkdownVditorRuntime(this.app, () => this.app.getPublicPath());
    this.app.addComponents({ MarkdownVditor });
    this.app.addFieldInterfaces([MarkdownVditorFieldInterface]);
    getMarkdownRegistry(this.flowEngine.context).register(this.runtime, { default: true });
    registerMarkdownVditorContext(this.flowEngine.context, this.runtime);
    this.flowEngine.registerModels({
      VditorFieldModel,
      DisplayVditorFieldModel,
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
