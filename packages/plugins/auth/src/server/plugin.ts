import { Model } from '@nocobase/database';
import { InstallOptions, Plugin } from '@nocobase/server';
import { CronJob } from 'cron';
import { resolve } from 'path';
import { namespace, presetAuthenticator, presetAuthType } from '../preset';
import authActions from './actions/auth';
import authenticatorsActions from './actions/authenticators';
import { BasicAuth } from './basic-auth';
import { enUS, zhCN } from './locale';
import { AuthModel } from './model/authenticator';
import { createTokenBlacklistService } from './token-blacklist';

export class AuthPlugin extends Plugin {
  afterAdd() {}

  private deleteExpiredTokenJob: CronJob;

  async beforeLoad() {
    this.app.i18n.addResources('zh-CN', namespace, zhCN);
    this.app.i18n.addResources('en-US', namespace, enUS);

    this.app.db.registerModels({ AuthModel });
  }

  configureDefaultTokenBlacklistService() {
    if (this.app.authManager.jwt.blacklist) {
      // If blacklist service is set, should not configure default blacklist service
      return;
    }

    const blacklistService = createTokenBlacklistService(this.db.getRepository('tokenBlacklist'));
    this.app.authManager.setTokenBlacklistService(blacklistService);

    this.deleteExpiredTokenJob = new CronJob(
      // every day at 03:00
      '0 3 * * *', //
      async () => {
        this.app.logger.info(`${this.name}: Start delete expired blacklist token`);
        await blacklistService.deleteExpiredToken();
        this.app.logger.info(`${this.name}: End delete expired blacklist token`);
      },
      null,
      this.enabled,
    );

    this.app.once('beforeStop', () => {
      this.deleteExpiredTokenJob.stop();
    });
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

    this.configureDefaultTokenBlacklistService();

    this.app.authManager.registerTypes(presetAuthType, {
      auth: BasicAuth,
    });
    // Register actions
    Object.entries(authActions).forEach(([action, handler]) =>
      this.app.resourcer.registerAction(`auth:${action}`, handler),
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
        description: 'Sign in with email and password.',
        enabled: true,
        options: {
          public: {
            allowSignUp: true,
          },
        },
      },
    });
  }

  async afterEnable() {
    this.deleteExpiredTokenJob?.start();
  }

  async afterDisable() {
    this.deleteExpiredTokenJob?.stop();
  }

  async remove() {}
}

export default AuthPlugin;
