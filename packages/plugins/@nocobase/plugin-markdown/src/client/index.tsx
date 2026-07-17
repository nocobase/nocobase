/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DisplayVditorFieldModel,
  getMarkdownRegistry,
  MarkdownBlockModel,
  MarkdownVditorRuntime,
  registerMarkdownVditorContext,
  VditorFieldModel,
} from '../client-v2';
import type { MarkdownVditorRuntimeApp } from '../client-v2';

type PluginOptionsLike = {
  name?: string;
  packageName?: string;
  [key: string]: unknown;
};

type LegacyAppLike = MarkdownVditorRuntimeApp & {
  flowEngine?: {
    context: {
      defineProperty?: (key: string, options: { get?: () => unknown; value?: unknown }) => void;
    };
    registerModels: (models: Record<string, unknown>) => void;
  };
  getPublicPath: () => string;
};

/**
 * The legacy shell also hosts modern Flow pages under routes such as /admin.
 * Register the shared FlowEngine models for those pages, but do not register
 * v2 field interfaces or components in the legacy v1 managers.
 */
export default class PluginMarkdownClient {
  options: PluginOptionsLike;
  app?: LegacyAppLike;
  runtime?: MarkdownVditorRuntime;

  constructor(options: PluginOptionsLike = {}, app?: LegacyAppLike) {
    this.options = options;
    this.app = app;
  }

  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    const app = this.app;
    if (!app?.flowEngine) {
      return;
    }

    this.runtime = new MarkdownVditorRuntime(app, () => app.getPublicPath());
    getMarkdownRegistry(app.flowEngine.context).register(this.runtime, { default: true });
    registerMarkdownVditorContext(app.flowEngine.context, this.runtime);
    app.flowEngine.registerModels({
      MarkdownBlockModel,
      VditorFieldModel,
      DisplayVditorFieldModel,
    });
  }

  getCDN() {
    return this.runtime?.getCDN();
  }

  initVditorDependency() {
    return this.runtime?.initVditorDependency();
  }
}

export { MarkdownBlockModel } from '../client-v2';
