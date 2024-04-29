import { Plugin } from '@nocobase/client';
import 'vditor/dist/index.css';
import { MarkdownVditor } from './components';
import { MarkdownVditorFieldInterface } from './interfaces/markdown-vditor';
export class PluginFieldMarkdownVditorClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.addComponents({ MarkdownVditor });
    this.initVditorDependency();
    this.app.dataSourceManager.addFieldInterfaces([MarkdownVditorFieldInterface]);
  }

  getCDN() {
    if (process.env.NODE_ENV !== 'production') {
      // 开发模式下使用远程 cdn
      return 'https://unpkg.com/vditor@3.10.4';
    }
    // 生产环境，使用本地链接，支持内网
    // 需要支持子目录，比如应用部署在 /xxx/ 目录下
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
