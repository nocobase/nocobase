import { Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { NAMESPACE } from '../constants';
import { create, destroy, list } from './actions/api-keys';
import { enUS, zhCN } from './locale';

export interface ApiKeysPluginConfig {
  name?: string;
}

export default class ApiKeysPlugin extends Plugin<ApiKeysPluginConfig> {
  constructor(app, options) {
    super(app, options);
  }

  async beforeLoad() {
    this.app.i18n.addResources('zh-CN', NAMESPACE, zhCN);
    this.app.i18n.addResources('en-US', NAMESPACE, enUS);

    await this.app.resourcer.define({
      name: 'apiKeys',
      actions: {
        create,
        list,
        destroy,
      },
      only: ['list', 'create', 'destroy'],
    });

    this.app.acl.registerSnippet({
      name: ['pm', this.name, 'configuration'].join('.'),
      actions: ['apiKeys:list', 'apiKeys:create', 'apiKeys:destroy'],
    });
  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, '../collections'),
    });
  }
}
