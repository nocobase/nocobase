import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { BasicAuth } from './basic-auth';
import { presetAuthType, presetAuthenticator } from '../preset';
import authActions from './actions/auth';
import authenticatorsActions from './actions/authenticators';

export class AuthPlugin extends Plugin {
  afterAdd() {}

  async beforeLoad() {}

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.app.authManager.registerTypes(presetAuthType, {
      auth: BasicAuth,
    });
    this.app.authManager.setStorer({
      get: async (name: string) => {
        const repo = this.db.getRepository('authenticators');
        return await repo.findOne({ filter: { name } });
      },
    });

    Object.entries(authActions).forEach(([action, handler]) =>
      this.app.resourcer.registerAction(`auth:${action}`, handler),
    );
    Object.entries(authenticatorsActions).forEach(([action, handler]) =>
      this.app.resourcer.registerAction(`authenticators:${action}`, handler),
    );

    ['check', 'signIn', 'signUp', 'lostPassword', 'resetPassword', 'getUserByResetToken'].forEach((action) =>
      this.app.acl.allow('auth', action),
    );
    ['signOut', 'changePassword'].forEach((action) => this.app.acl.allow('auth', action, 'loggedIn'));
    this.app.acl.allow('authenticators', 'publicList');
  }

  async install(options?: InstallOptions) {
    const repository = this.db.getRepository('authenticators');
    const exist = await repository.findOne({ filter: { name: presetAuthenticator } });
    if (exist) {
      return;
    }

    await repository.create({
      values: {
        name: presetAuthenticator,
        authType: presetAuthType,
        description: 'Sign in with email and password.',
        default: true,
        enabled: true,
      },
    });
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default AuthPlugin;
