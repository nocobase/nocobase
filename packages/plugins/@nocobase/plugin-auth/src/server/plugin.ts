import { Model } from '@nocobase/database';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { namespace, presetAuthenticator, presetAuthType } from '../preset';
import authActions from './actions/auth';
import authenticatorsActions from './actions/authenticators';
import { BasicAuth } from './basic-auth';
import { enUS, zhCN } from './locale';
import { AuthModel } from './model/authenticator';
import { TokenBlacklistService } from './token-blacklist';

export class AuthPlugin extends Plugin {
  afterAdd() {}
  async beforeLoad() {
    this.app.i18n.addResources('zh-CN', namespace, zhCN);
    this.app.i18n.addResources('en-US', namespace, enUS);

    this.app.db.registerModels({ AuthModel });
  }

  async load() {
    // Set up database
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
    this.db.addMigrations({
      namespace: 'auth',
      directory: resolve(__dirname, 'migrations'),
      context: {
        plugin: this,
      },
    });
    // Set up auth manager and register preset auth type
    this.app.authManager.setStorer({
      get: async (name: string) => {
        const repo = this.db.getRepository('authenticators');
        const authenticators = await repo.find({ filter: { enabled: true } });
        const authenticator = authenticators.find((authenticator: Model) => authenticator.name === name);
        return authenticator || authenticators[0];
      },
    });

    if (!this.app.authManager.jwt.blacklist) {
      // If blacklist service is not set, should configure default blacklist service
      this.app.authManager.setTokenBlacklistService(new TokenBlacklistService(this));
    }

    this.app.authManager.registerTypes(presetAuthType, {
      auth: BasicAuth,
      title: 'Password',
    });
    // Register actions
    Object.entries(authActions).forEach(
      ([action, handler]) => this.app.resourcer.getResource('auth')?.addAction(action, handler),
    );
    Object.entries(authenticatorsActions).forEach(([action, handler]) =>
      this.app.resourcer.registerAction(`authenticators:${action}`, handler),
    );
    // Set up ACL
    ['check', 'signIn', 'signUp'].forEach((action) => this.app.acl.allow('auth', action));
    ['signOut', 'changePassword'].forEach((action) => this.app.acl.allow('auth', action, 'loggedIn'));
    this.app.acl.allow('authenticators', 'publicList');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.authenticators`,
      actions: ['authenticators:*'],
    });
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
        description: 'Sign in with username/email.',
        enabled: true,
        options: {
          public: {
            allowSignUp: true,
          },
        },
      },
    });
  }
  async remove() {}
}

export default AuthPlugin;
