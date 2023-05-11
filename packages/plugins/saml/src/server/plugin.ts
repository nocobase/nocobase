import { InstallOptions, Plugin } from '@nocobase/server';
import { getAuthUrl } from './actions/getAuthUrl';
import { metadata } from './actions/metadata';
import { redirect } from './actions/redirect';
import { SAMLAuth } from './saml-auth';

export class SAMLPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.app.authManager.registerTypes('SAML', {
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
