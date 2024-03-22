import { Cache } from '@nocobase/cache';
import { Model } from '@nocobase/database';
import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { namespace, presetAuthType, presetAuthenticator } from '../preset';
import authActions from './actions/auth';
import authenticatorsActions from './actions/authenticators';
import { BasicAuth } from './basic-auth';
import { enUS, zhCN } from './locale';
import { AuthModel } from './model/authenticator';
import { Storer } from './storer';
import { TokenBlacklistService } from './token-blacklist';

export class PluginAuthServer extends Plugin {
  cache: Cache;

  afterAdd() {}
  async beforeLoad() {
    this.app.i18n.addResources('zh-CN', namespace, zhCN);
    this.app.i18n.addResources('en-US', namespace, enUS);

    this.app.db.registerModels({ AuthModel });
  }

  async load() {
    // Set up database
    await this.importCollections(resolve(__dirname, 'collections'));
    this.db.addMigrations({
      namespace: 'auth',
      directory: resolve(__dirname, 'migrations'),
      context: {
        plugin: this,
      },
    });
    this.cache = await this.app.cacheManager.createCache({
      name: 'auth',
      prefix: 'auth',
      store: 'memory',
    });

    // Set up auth manager and register preset auth type
    const storer = new Storer({
      db: this.db,
      cache: this.cache,
    });
    this.app.authManager.setStorer(storer);

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

    // Change cache when user changed
    this.app.db.on('users.afterSave', async (user: Model) => {
      const cache = this.app.cache as Cache;
      await cache.set(`auth:${user.id}`, user.toJSON());
    });
    this.app.db.on('users.afterDestroy', async (user: Model) => {
      const cache = this.app.cache as Cache;
      await cache.del(`auth:${user.id}`);
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

export default PluginAuthServer;
