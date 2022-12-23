import { InstallOptions, Plugin } from '@nocobase/server';
import path from 'path';
import { createHtml, getHtml, getJson, updateHtml } from './actions';

export class IframeBlockPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    await this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });
    this.app.acl.allow('iframeHtml', 'getJson');
    this.app.acl.allow('iframeHtml', 'get');
    this.app.acl.allow('iframeHtml', 'create');
    this.app.acl.allow('iframeHtml', 'update');
    this.app.resource({
      name: 'iframeHtml',
      actions: {
        getJson,
        get: getHtml,
        create: createHtml,
        update: updateHtml,
      },
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default IframeBlockPlugin;
