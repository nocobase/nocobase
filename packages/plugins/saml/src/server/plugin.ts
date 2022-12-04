import {InstallOptions, Plugin} from '@nocobase/server';
import {resolve} from 'path';
import {getAuthUrl} from './actions/getAuthUrl';
import {getEnabledProviders} from './actions/getEnabledProviders';
import {metadata} from './actions/metadata';
import {redirect} from './actions/redirect';
import {saml} from './authenticators/saml';

export class SAMLPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    // 导入 collection
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    // 获取 User 插件
    const userPlugin = this.app.getPlugin<any>('users');

    // 注册 SAML 验证器
    userPlugin.authenticators.register('saml', saml);

    // 注册接口
    this.app.resource({
      name: 'saml',
      actions: {
        redirect,
        metadata,
        getAuthUrl,
        getEnabledProviders,
      },
    });

    // 开放访问权限
    this.app.acl.skip('samlProviders', '*', 'allowConfigure');
    this.app.acl.skip('saml', '*');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default SAMLPlugin;
