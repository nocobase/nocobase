/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import 'vditor/dist/index.css';
// import { MarkdownVditor } from './components';
import { lazy } from '@nocobase/client';
import { MarkdownVditorEditableFieldModel } from './MarkdownVditorEditableFieldModel';
import { MarkdownVditorReadPrettyFieldModel } from './MarkdownVditorReadPrettyFieldModel';
const { MarkdownVditor } = lazy(() => import('./components'), 'MarkdownVditor');

import { MarkdownVditorFieldInterface } from './interfaces/markdown-vditor';
export class PluginFieldMarkdownVditorClient extends Plugin {
  dependencyLoaded = false;

  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.addComponents({ MarkdownVditor });
    this.app.dataSourceManager.addFieldInterfaces([MarkdownVditorFieldInterface]);
    this.flowEngine.registerModels({
      MarkdownVditorEditableFieldModel,
      MarkdownVditorReadPrettyFieldModel,
    });
  }

  getCDN() {
    return this.app.getPublicPath() + 'static/plugins/@nocobase/plugin-field-markdown-vditor/dist/client/vditor';
  }

  initVditorDependency() {
    const cdn = this.getCDN();
    try {
      const vditorDepdencePrefix = 'plugin-field-markdown-vditor-dep';
      const vditorDepdence = {
        [`${vditorDepdencePrefix}.katex`]: `${cdn}/dist/js/katex/katex.min.js?v=0.16.9`,
        [`${vditorDepdencePrefix}.ABCJS`]: `${cdn}/dist/js/abcjs/abcjs_basic.min`,
        [`${vditorDepdencePrefix}.plantumlEncoder`]: `${cdn}/dist/js/plantuml/plantuml-encoder.min`,
        [`${vditorDepdencePrefix}.echarts`]: `${cdn}/dist/js/echarts/echarts.min`,
        [`${vditorDepdencePrefix}.flowchart`]: `${cdn}/dist/js/flowchart.js/flowchart.min`,
        [`${vditorDepdencePrefix}.Viz`]: `${cdn}/dist/js/graphviz/viz`,
        [`${vditorDepdencePrefix}.mermaid`]: `${cdn}/dist/js/mermaid/mermaid.min`,
      };
      this.app.requirejs.require.config({
        waitSeconds: 120,
        paths: vditorDepdence,
      });
      Object.keys(vditorDepdence).forEach((key) => {
        this.app.requirejs.require([key], (m) => {
          window[key.split('.')[1]] = m;
        });
      });
    } catch (e) {
      console.log('initVditorDependency failed', e);
    }
  }
}

export default PluginFieldMarkdownVditorClient;
