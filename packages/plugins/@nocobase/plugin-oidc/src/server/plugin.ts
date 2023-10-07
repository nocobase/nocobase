import { InstallOptions, Plugin } from '@nocobase/server';
import { getAuthUrl } from './actions/getAuthUrl';
import { redirect } from './actions/redirect';
import { authType } from '../constants';
import { OIDCAuth } from './oidc-auth';
import { resolve } from 'path';

export class OidcPlugin extends Plugin {
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
      auth: OIDCAuth,
    });

    // 注册接口
    this.app.resource({
      name: 'oidc',
      actions: {
        getAuthUrl,
        redirect,
      },
    });

    this.app.acl.allow('oidc', '*', 'public');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default OidcPlugin;
