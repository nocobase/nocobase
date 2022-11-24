import UsersPlugin from '@nocobase/plugin-users';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { namespace } from '..';
import { oidc } from './authenticators/oidc';
import { getAuthUrl } from './actions/getAuthUrl';
import { redirect } from './actions/redirect';

export class OidcPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    // 导入 collection
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    // 获取 User 插件
    const userPlugin = this.app.getPlugin('users') as UsersPlugin;

    // 注册 OIDC 验证器
    userPlugin.authenticators.register('oidc', oidc);

    // 注册接口
    this.app.resource({
      name: 'oidc',
      actions: {
        getAuthUrl,
        redirect,
      },
    });

    // 开放访问权限
    this.app.acl.allow('oidcProviders', '*');
    this.app.acl.allow('oidc', '*');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default OidcPlugin;
