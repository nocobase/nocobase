import UsersPlugin from '@nocobase/plugin-users';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { generators } from 'openid-client';
import { oidc } from './authenticators/oidc';
import { getAuthUrl } from './actions/getAuthUrl';
import { redirect } from './actions/redirect';

export class OidcPlugin extends Plugin {
  #OIDC_NONCE = null;

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

    // 注册中间件，处理 nonce 值
    this.app.use(async (ctx, next) => {
      if (ctx.url.startsWith('/api/users:signin?authenticator=oidc')) {
        ctx.OIDC_NONCE = this.#OIDC_NONCE;
      }
      if (ctx.url.startsWith('/api/oidc:getAuthUrl')) {
        ctx.OIDC_NONCE = this.#OIDC_NONCE = generators.nonce();
      }
      await next();
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
