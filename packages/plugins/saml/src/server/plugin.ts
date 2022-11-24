import UsersPlugin from 'packages/plugins/users/src/server';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { saml } from './authenticators/saml';
import { redirect } from './actions/redirect';
import { metadata } from './actions/metadata';
import { getAuthUrl } from './actions/getAuthUrl';

export class SAMLPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    // 导入 collection
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    // 获取 User 插件
    const userPlugin = this.app.getPlugin('users') as UsersPlugin;

    // 注册 SAML 验证器
    userPlugin.authenticators.register('saml', saml);

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
    this.app.acl.allow('samlProviders', '*');
    this.app.acl.allow('saml', '*');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default SAMLPlugin;
