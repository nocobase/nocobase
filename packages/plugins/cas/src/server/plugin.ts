import { InstallOptions, Plugin } from '@nocobase/server';
import { getAuthUrl } from './actions/getAuthUrl';
import { authType } from '../constants';
import { CASAuth } from './auth';

export class CasPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.app.authManager.registerTypes(authType, {
      auth: CASAuth,
    });

    // // 注册接口
    this.app.resource({
      name: 'cas',
      actions: {
        getAuthUrl,
      },
    });

    this.app.acl.allow('cas', '*', 'public');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default CasPlugin;
//
