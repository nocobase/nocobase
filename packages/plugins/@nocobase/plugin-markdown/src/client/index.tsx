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
  MarkdownVditor,
  MarkdownVditorFieldInterface,
  MarkdownVditorRuntime,
  registerMarkdownVditorContext,
  VditorFieldModel,
} from '../client-v2';
import type { MarkdownVditorRuntimeApp } from '../client-v2';
import 'vditor/dist/index.css';

export { MarkdownBlockModel } from '../client-v2';

const VDITOR_VERSION = '3.11.2';

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
  getCdnUrl?: () => string;
};

function getLegacyVditorCDN(app?: LegacyAppLike) {
  if (process.env.NODE_ENV === 'production') {
    const base = app?.getCdnUrl?.() || app?.getPublicPath?.() || '/';
    return `${base}static/plugins/@nocobase/plugin-markdown/dist/client-v2/vditor`;
  }
  return `https://cdn.jsdelivr.net/npm/vditor@${VDITOR_VERSION}`;
}

function initLegacyVditorDependency(app: LegacyAppLike, cdn: string) {
  try {
    const vditorDepdencePrefix = 'plugin-markdown-dep';
    const vditorDepdence = {
      [`${vditorDepdencePrefix}.katex`]: `${cdn}/dist/js/katex/katex.min.js?v=0.16.9`,
      [`${vditorDepdencePrefix}.ABCJS`]: `${cdn}/dist/js/abcjs/abcjs_basic.min`,
      [`${vditorDepdencePrefix}.plantumlEncoder`]: `${cdn}/dist/js/plantuml/plantuml-encoder.min`,
      [`${vditorDepdencePrefix}.echarts`]: `${cdn}/dist/js/echarts/echarts.min`,
      [`${vditorDepdencePrefix}.flowchart`]: `${cdn}/dist/js/flowchart.js/flowchart.min`,
      [`${vditorDepdencePrefix}.Viz`]: `${cdn}/dist/js/graphviz/viz`,
      [`${vditorDepdencePrefix}.mermaid`]: `${cdn}/dist/js/mermaid/mermaid.min`,
    };
    app.requirejs.require.config({
      waitSeconds: 120,
      paths: vditorDepdence,
    });
    Object.keys(vditorDepdence).forEach((key) => {
      app.requirejs.require([key], (m) => {
        window[key.split('.')[1]] = m;
      });
    });
  } catch (e) {
    console.log('initVditorDependency failed', e);
  }
}

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
      getMarkdownRegistry(app.flowEngine.context).register(this.runtime, { default: true });
      registerMarkdownVditorContext(app.flowEngine.context, this.runtime);
      app.flowEngine.registerModels({
        MarkdownBlockModel,
        VditorFieldModel,
        DisplayVditorFieldModel,
      });
    }
  }

  getCDN() {
    return this.runtime?.getCDN() || getLegacyVditorCDN(this.app);
  }

  initVditorDependency() {
    if (this.runtime) {
      return this.runtime.initVditorDependency();
    }
    if (this.app) {
      return initLegacyVditorDependency(this.app, this.getCDN());
    }
  }
}
