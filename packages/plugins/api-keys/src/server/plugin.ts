import { HandlerType } from '@nocobase/resourcer';
import { Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';
import { resolve } from 'path';
import { NAMESPACE } from '../constants';
import { ApiKeysAuth } from './api-keys-auth';
import { AUTH_KEY } from './constants';
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
  }

  async load() {
    this.app.authManager.registerTypes(AUTH_KEY, {
      auth: ApiKeysAuth,
    });

    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
  }

  async install(options) {
    const apiKeys = this.db.getCollection('apiKeys');
  }
}
