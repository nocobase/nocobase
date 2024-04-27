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
    const vditorDependence = {
      katex: `${cdn}/dist/js/katex/katex.min.js?v=0.16.9`,
      ABCJS: `${cdn}/dist/js/abcjs/abcjs_basic.min`,
      plantumlEncoder: `${cdn}/dist/js/plantuml/plantuml-encoder.min`,
      echarts: `${cdn}/dist/js/echarts/echarts.min`,
      flowchart: `${cdn}/dist/js/flowchart.js/flowchart.min`,
      Viz: `${cdn}/dist/js/graphviz/viz`,
      mermaid: `${cdn}/dist/js/mermaid/mermaid.min`,
    };
    this.app.requirejs.require.config({
      paths: vditorDependence,
    });
    Object.keys(vditorDependence).forEach((key) => {
      this.app.requirejs.require([key], (m) => {
        window[key] = m;
      });
    });
  }
}

export default PluginFieldMarkdownVditorClient;
