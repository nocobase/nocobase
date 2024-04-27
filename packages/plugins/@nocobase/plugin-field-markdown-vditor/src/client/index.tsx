import { Plugin } from '@nocobase/client';
import { MarkdownVditor } from './components';
import { MarkdownVditorFieldInterface } from './interfaces/markdown-vditor';
import 'vditor/dist/index.css';
import { cdn } from './components/const';
export class PluginFieldMarkdownVditorClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.addComponents({ MarkdownVditor });
    this.initVditorDependency();
    this.app.dataSourceManager.addFieldInterfaces([MarkdownVditorFieldInterface]);
  }

  initVditorDependency() {
    const vditorDepdencePrefix = 'plugin-field-markdown-vditor-dep';
    const vditorDependence = {
      [`${vditorDepdencePrefix}.katex`]: `${cdn}/dist/js/katex/katex.min.js?v=0.16.9`,
      [`${vditorDepdencePrefix}.ABCJS`]: `${cdn}/dist/js/abcjs/abcjs_basic.min`,
      [`${vditorDepdencePrefix}.plantumlEncoder`]: `${cdn}/dist/js/plantuml/plantuml-encoder.min`,
      [`${vditorDepdencePrefix}.echarts`]: `${cdn}/dist/js/echarts/echarts.min`,
      [`${vditorDepdencePrefix}.flowchart`]: `${cdn}/dist/js/flowchart.js/flowchart.min`,
      [`${vditorDepdencePrefix}.Viz`]: `${cdn}/dist/js/graphviz/viz`,
      [`${vditorDepdencePrefix}.mermaid`]: `${cdn}/dist/js/mermaid/mermaid.min`,
    };
    this.app.requirejs.require.config({
      paths: vditorDependence,
    });
    Object.keys(vditorDependence).forEach((key) => {
      this.app.requirejs.require([key], (m) => {
        window[key.split('.')[1]] = m;
      });
    });
  }
}

export default PluginFieldMarkdownVditorClient;
