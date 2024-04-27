import { Plugin } from '@nocobase/client';
import { MarkdownVditor } from './components';
import { MarkdownVditorFieldInterface } from './interfaces/markdown-vditor';
import 'vditor/dist/index.css';
import katex from 'katex';
export class PluginFieldMarkdownVditorClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.app.addComponents({ MarkdownVditor });
    this.initKatexDependency();
    this.app.dataSourceManager.addFieldInterfaces([MarkdownVditorFieldInterface]);
  }

  initKatexDependency() {
    window['katex'] = katex;
  }
}

export default PluginFieldMarkdownVditorClient;
