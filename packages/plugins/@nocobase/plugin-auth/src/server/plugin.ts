/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Cache } from '@nocobase/cache';
import Database, { Model } from '@nocobase/database';
import { InstallOptions, Plugin } from '@nocobase/server';
import { namespace, presetAuthType, presetAuthenticator } from '../preset';
import authActions from './actions/auth';
import authenticatorsActions from './actions/authenticators';
import { BasicAuth } from './basic-auth';
import { AuthModel } from './model/authenticator';
import { Storer } from './storer';
import { TokenBlacklistService } from './token-blacklist';
import { tval } from '@nocobase/utils';
import { createAccessCtrlConfigRecord, saveAccessCtrlConfigToCache } from './collections/access-control-config';
import { secAccessCtrlConfigCollName } from '../constants';
export class PluginAuthServer extends Plugin {
  cache: Cache;

  afterAdd() {}
  async beforeLoad() {
    this.app.db.registerModels({ AuthModel });
  }

  async load() {
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
                ...field.options?.uiSchema,
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
    this.app.on('cache:del:auth', async ({ userId }) => {
      await this.cache.del(`auth:${userId}`);
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
          if (!roles) {
            return {
              userId,
            };
          } else {
            if (roles.length === 1) {
              return {
                userId,
                roleName: roles[0].name,
              };
            } else {
              // 多角色的情况下暂时不返回角色名
              return {
                userId,
              };
            }
          }
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
      name: `pm.security-settings.access`,
      actions: [`${secAccessCtrlConfigCollName}:*`],
    });
    saveAccessCtrlConfigToCache(this.app, this.db, this.app.cache);
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
    createAccessCtrlConfigRecord(this.db);
  }
  async remove() {}
}

export default PluginAuthServer;
