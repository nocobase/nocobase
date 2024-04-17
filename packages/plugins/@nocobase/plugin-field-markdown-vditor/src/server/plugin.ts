import { Plugin } from '@nocobase/server';
import { MarkdownVditorField } from './markdown-vditor-field';

export class PluginFieldMarkdownVditorServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    this.db.registerFieldTypes({
      vditor: MarkdownVditorField,
    });
  }

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginFieldMarkdownVditorServer;
