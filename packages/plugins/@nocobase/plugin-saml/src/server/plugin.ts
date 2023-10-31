import { InstallOptions, Plugin } from '@nocobase/server';
import { getAuthUrl } from './actions/getAuthUrl';
import { metadata } from './actions/metadata';
import { redirect } from './actions/redirect';
import { SAMLAuth } from './saml-auth';
import { authType } from '../constants';
import { resolve } from 'path';

export class SAMLPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.db.addMigrations({
      namespace: 'auth',
      directory: resolve(__dirname, 'migrations'),
      context: {
        plugin: this,
      },
    });

    this.app.authManager.registerTypes(authType, {
      auth: SAMLAuth,
    });

    // 注册接口
    this.app.resource({
      name: 'saml',
      actions: {
        redirect,
        metadata,
        getAuthUrl,
      },
    });

    // 开放访问权限
    this.app.acl.allow('saml', '*', 'public');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default SAMLPlugin;
