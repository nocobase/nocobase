import { Plugin } from '@nocobase/client';
import { MarkdownVditor } from './components';
import { MarkdownVditorFieldInterface } from './interfaces/markdown-vditor';
import 'vditor/dist/index.css';
export class PluginFieldMarkdownVditorClient extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.initKatexDependency();
    this.app.addComponents({ MarkdownVditor });

    this.app.dataSourceManager.addFieldInterfaces([MarkdownVditorFieldInterface]);
  }

  initKatexDependency() {
    const scriptElement = document.createElement('script');
    scriptElement.innerHTML = `import katex from 'https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.mjs'; window['katex'] = katex;`;
    scriptElement.type = 'module';
    scriptElement.async = true;
    scriptElement.id = 'vditorKatexScript';
    document.head.appendChild(scriptElement);
  }
}

export default PluginFieldMarkdownVditorClient;
