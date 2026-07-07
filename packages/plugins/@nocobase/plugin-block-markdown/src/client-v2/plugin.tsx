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
  getMarkdownRegistry,
  MarkdownVditorRuntime,
  registerMarkdownVditorContext,
  type MarkdownVditorRuntimeApp,
} from '@nocobase/plugin-markdown/client-v2';

export class PluginBlockMarkdownClient extends Plugin<Record<string, never>, Application> {
  declare app: Application & MarkdownVditorRuntimeApp;
  dependencyLoaded = false;
  runtime: MarkdownVditorRuntime;

  async load() {
    this.runtime = new MarkdownVditorRuntime(this.app, () => this.app.getPublicPath());
    getMarkdownRegistry(this.flowEngine.context).register(this.runtime, { default: true });
    registerMarkdownVditorContext(this.flowEngine.context, this.runtime);
    this.flowEngine.registerModelLoaders({
      MarkdownBlockModel: {
        loader: () =>
          import('@nocobase/plugin-markdown/client-v2').then((module) => ({
            MarkdownBlockModel: module.MarkdownBlockModel,
          })),
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
export default PluginBlockMarkdownClient;
