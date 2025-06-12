/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache } from '@nocobase/cache';
import { Model } from '@nocobase/database';
import { InstallOptions, Plugin } from '@nocobase/server';
import { tval } from '@nocobase/utils';
import { tokenPolicyCollectionName, tokenPolicyRecordKey } from '../constants';
import { namespace, presetAuthType, presetAuthenticator } from '../preset';
import authActions from './actions/auth';
import authenticatorsActions from './actions/authenticators';
import { BasicAuth } from './basic-auth';
import { AuthModel } from './model/authenticator';
import { Storer } from './storer';
import { TokenBlacklistService } from './token-blacklist';
import { TokenController } from './token-controller';

export class PluginAuthServer extends Plugin {
  cache: Cache;

  afterAdd() {
    this.app.on('afterLoad', async () => {
      if (this.app.authManager.tokenController) {
        return;
      }
      const cache = await this.app.cacheManager.createCache({
        name: 'auth-token-controller',
        prefix: 'auth-token-controller',
      });
      const tokenController = new TokenController({ cache, app: this.app, logger: this.app.log });

      this.app.authManager.setTokenControlService(tokenController);
      const tokenPolicyRepo = this.app.db.getRepository(tokenPolicyCollectionName);
      try {
        const res = await tokenPolicyRepo.findOne({ filterByTk: tokenPolicyRecordKey });
        if (res) {
          this.app.authManager.tokenController.setConfig(res.config);
        }
      } catch (error) {
        this.app.logger.warn('access control config not exist, use default value');
      }
    });
  }

  async beforeLoad() {
    this.app.db.registerModels({ AuthModel });
  }

  async load() {
    this.cache = await this.app.cacheManager.createCache({
      name: 'auth',
      prefix: 'auth',
      store: 'memory',
    });
    // Set up auth manager
    const storer = new Storer({
      app: this.app,
      db: this.db,
      cache: this.cache,
      authManager: this.app.authManager,
    });
    this.app.authManager.setStorer(storer);

    if (!this.app.authManager.jwt.blacklist) {
      // If blacklist service is not set, should configure default blacklist service
      this.app.authManager.setTokenBlacklistService(new TokenBlacklistService(this));
    }
    // register preset auth type
    this.app.authManager.registerTypes(presetAuthType, {
      auth: BasicAuth,
      title: tval('Password', { ns: namespace }),
      getPublicOptions: (options) => {
        const usersCollection = this.db.getCollection('users');
        let signupForm = options?.public?.signupForm || [];
        signupForm = signupForm.filter((item: { show: boolean }) => item.show);
        if (
          !(
            signupForm.length &&
            signupForm.some(
              (item: { field: string; show: boolean; required: boolean }) =>
                ['username', 'email'].includes(item.field) && item.show && item.required,
            )
          )
        ) {
          // At least one of the username or email fields is required
          signupForm.unshift({ field: 'username', show: true, required: true });
        }
        signupForm = signupForm
          .filter((field: { show: boolean }) => field.show)
          .map((item: { field: string; required: boolean }) => {
            const field = usersCollection.getField(item.field);
            return {
              ...item,
              uiSchema: {
                ...field?.options?.uiSchema,
                required: item.required,
              },
            };
          });
        return {
          ...options?.public,
          signupForm,
        };
      },
    });
    // Register actions
    Object.entries(authActions).forEach(
      ([action, handler]) => this.app.resourceManager.getResource('auth')?.addAction(action, handler),
    );
    Object.entries(authenticatorsActions).forEach(([action, handler]) =>
      this.app.resourceManager.registerActionHandler(`authenticators:${action}`, handler),
    );
    // Set up ACL
    ['signIn', 'signUp'].forEach((action) => this.app.acl.allow('auth', action));
    ['check', 'signOut', 'changePassword'].forEach((action) => this.app.acl.allow('auth', action, 'loggedIn'));
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
    this.app.on('cache:del:auth', async ({ userId }) => {
      await this.cache.del(`auth:${userId}`);
    });

    this.app.on('ws:message:auth:token', async ({ clientId, payload }) => {
      if (!payload || !payload.token) {
        this.app.emit(`ws:removeTag`, {
          clientId,
          tagKey: 'userId',
        });
        return;
      }

      const auth = await this.app.authManager.get(payload.authenticator || 'basic', {
        getBearerToken: () => payload.token,
        app: this.app,
        db: this.app.db,
        cache: this.app.cache,
        logger: this.app.logger,
        log: this.app.log,
        throw: (...args) => {
          throw new Error(...args);
        },
        t: this.app.i18n.t,
      } as any);

      let user: Model;
      try {
        user = (await auth.checkToken()).user;
      } catch (error) {
        if (!user) {
          this.app.logger.error(error);
          this.app.emit(`ws:removeTag`, {
            clientId,
            tagKey: 'userId',
          });
          return;
        }
      }

      this.app.emit(`ws:setTag`, {
        clientId,
        tagKey: 'userId',
        tagValue: user.id,
      });

      this.app.emit(`ws:authorized`, {
        clientId,
        userId: user.id,
      });
    });

    this.app.auditManager.registerActions([
      {
        name: 'auth:signIn',
        getMetaData: async (ctx: any) => {
          let body = {};
          if (ctx.status === 200) {
            body = {
              data: {
                ...ctx.body.data,
                token: undefined,
              },
            };
          } else {
            body = ctx.body;
          }
          return {
            request: {
              body: {
                ...ctx.request?.body,
                password: undefined,
              },
            },
          };
        },
        getUserInfo: async (ctx: any) => {
          if (!ctx.body?.data?.user) {
            return null;
          }
          // 查询用户角色
          const userId = ctx.body.data.user.id;
          const user = await ctx.db.getRepository('users').findOne({
            filterByTk: userId,
          });
          const roles = await user?.getRoles();
          if (roles && roles.length === 1) {
            return {
              userId,
              roleName: roles[0].name,
            };
          }
          // 多角色的情况下暂时不返回角色名
          return {
            userId,
          };
        },
      },
      {
        name: 'auth:signUp',
        getMetaData: async (ctx: any) => {
          return {
            request: {
              body: {
                ...ctx.request?.body,
                password: undefined,
                confirm_password: undefined,
              },
            },
          };
        },
      },
      {
        name: 'auth:changePassword',
        getMetaData: async (ctx: any) => {
          return {
            request: {
              body: {},
            },
            response: {
              body: {},
            },
          };
        },
        getSourceAndTarget: async (ctx: any) => {
          return {
            targetCollection: 'users',
            targetRecordUK: ctx.auth.user.id,
          };
        },
      },
      'auth:signOut',
    ]);
    this.app.acl.registerSnippet({
      name: `pm.security.token-policy`,
      actions: [`${tokenPolicyCollectionName}:*`],
    });

    this.app.db.on(`${tokenPolicyCollectionName}.afterSave`, async (model) => {
      this.app.authManager.tokenController?.setConfig(model.config);
    });
  }

  async install(options?: InstallOptions) {
    const authRepository = this.db.getRepository('authenticators');
    const exist = await authRepository.findOne({ filter: { name: presetAuthenticator } });
    if (!exist) {
      await authRepository.create({
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

    const tokenPolicyRepo = this.app.db.getRepository(tokenPolicyCollectionName);
    const res = await tokenPolicyRepo.findOne({ filterByTk: tokenPolicyRecordKey });
    if (res) {
      return;
    }
    const config = {
      tokenExpirationTime: '1d',
      sessionExpirationTime: '7d',
      expiredTokenRenewLimit: '1d',
    };
    await tokenPolicyRepo.create({
      values: {
        key: tokenPolicyRecordKey,
        config,
      },
    });
  }

  async remove() {}
}

export default PluginAuthServer;
