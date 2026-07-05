/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ensureMarkdownRegistry } from '@nocobase/client-v2';
import {
  DisplayVditorFieldModel,
  MarkdownBlockModel,
  MarkdownVditor,
  MarkdownVditorFieldInterface,
  MarkdownVditorRuntime,
  registerMarkdownVditorContext,
  type MarkdownVditorRuntimeApp,
  VditorFieldModel,
} from '@nocobase/plugin-markdown/client-v2';
import 'vditor/dist/index.css';

type PluginOptionsLike = {
  name?: string;
  packageName?: string;
  [key: string]: unknown;
};

type LegacyAppLike = MarkdownVditorRuntimeApp & {
  addComponents?: (components: Record<string, unknown>) => void;
  dataSourceManager?: {
    addFieldInterfaces?: (interfaces: unknown[]) => void;
  };
  flowEngine?: {
    context: {
      defineProperty?: (key: string, options: { get?: () => unknown; value?: unknown }) => void;
    };
    registerModels: (models: Record<string, unknown>) => void;
  };
  getPublicPath: () => string;
};

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
    if (!app) {
      return;
    }
    this.runtime = new MarkdownVditorRuntime(app, () => app.getPublicPath());
    app.addComponents?.({ MarkdownVditor });
    app.dataSourceManager?.addFieldInterfaces?.([MarkdownVditorFieldInterface]);
    if (app.flowEngine) {
      ensureMarkdownRegistry(app.flowEngine.context).register(this.runtime, { default: true });
      registerMarkdownVditorContext(app.flowEngine.context, this.runtime);
      app.flowEngine.registerModels({
        MarkdownBlockModel,
        VditorFieldModel,
        DisplayVditorFieldModel,
      });
    }
  }

  getCDN() {
    return this.runtime?.getCDN() || 'https://cdn.jsdelivr.net/npm/vditor@3.11.2';
  }

  initVditorDependency() {
    return this.runtime?.initVditorDependency();
  }
}
