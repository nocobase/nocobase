import { HandlerType } from '@nocobase/resourcer';
import { Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';
import { resolve } from 'path';
import { NAMESPACE } from '../constants';
import { create } from './actions/api-keys';
import { enUS, zhCN } from './locale';

export interface ApiKeysPluginConfig {
  name?: string;
}

export default class ApiKeysPlugin extends Plugin<ApiKeysPluginConfig> {
  public authenticators: Registry<HandlerType> = new Registry();

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
