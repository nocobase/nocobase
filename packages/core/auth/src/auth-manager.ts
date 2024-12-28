/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { Registry } from '@nocobase/utils';
import { Auth, AuthExtend } from './auth';
import { JwtOptions, JwtService } from './base/jwt-service';
import { ITokenBlacklistService } from './base/token-blacklist-service';
import { IAccessControlService } from './base/access-control-service';

export interface Authenticator {
  authType: string;
  options: Record<string, any>;
  [key: string]: any;
}

export interface Storer {
  get: (name: string) => Promise<Authenticator>;
}

export type AuthManagerOptions = {
  authKey: string;
  default?: string;
  jwt?: JwtOptions;
};

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
  title?: string; // The display name of the authentication type.
  getPublicOptions?: (options: Record<string, any>) => Record<string, any>; // Get the public options.
};

export class AuthManager {
  /**
   * @internal
   */
  jwt: JwtService;
  accessController: IAccessControlService;

  protected options: AuthManagerOptions;
  protected authTypes: Registry<AuthConfig> = new Registry();
  // authenticators collection manager.
  protected storer: Storer;

  constructor(options: AuthManagerOptions) {
    this.options = options;
    this.jwt = new JwtService(options.jwt);
  }

  setStorer(storer: Storer) {
    this.storer = storer;
  }

  setTokenBlacklistService(service: ITokenBlacklistService) {
    this.jwt.blacklist = service;
  }

  setAccessControlService(service: IAccessControlService) {
    this.accessController = service;
  }

  /**
   * registerTypes
   * @description Add a new authenticate type and the corresponding authenticator.
   * The types will show in the authenticators list of the admin panel.
   *
   * @param authType - The type of the authenticator. It is required to be unique.
   * @param authConfig - Configurations of the kind of authenticator.
   */
  registerTypes(authType: string, authConfig: AuthConfig) {
    this.authTypes.register(authType, authConfig);
  }

  listTypes() {
    return Array.from(this.authTypes.getEntities()).map(([authType, authConfig]) => ({
      name: authType,
      title: authConfig.title,
    }));
  }

  getAuthConfig(authType: string) {
    return this.authTypes.get(authType);
  }

  /**
   * get
   * @description Get authenticator instance by name.
   * @param name - The name of the authenticator.
   * @return authenticator instance.
   */
  async get(name: string, ctx: Context) {
    if (!this.storer) {
      throw new Error('AuthManager.storer is not set.');
    }
    const authenticator = await this.storer.get(name);
    if (!authenticator) {
      throw new Error(`Authenticator [${name}] is not found.`);
    }
    const { auth } = this.authTypes.get(authenticator.authType) || {};
    if (!auth) {
      throw new Error(`AuthType [${authenticator.authType}] is not found.`);
    }
    return new auth({ authenticator, options: authenticator.options, ctx });
  }

  /**
   * checkMiddleware
   * @description Auth middleware, used to check the user status.
   */
  checkMiddleware() {
    const self = this;

    return async function (ctx: Context & { auth: Auth }, next: Next) {
      const token = ctx.getBearerToken();
      const name = ctx.get(self.options.authKey) || self.options.default;

      let authenticator: Auth;
      try {
        authenticator = await ctx.app.authManager.get(name, ctx);
        ctx.auth = authenticator;
      } catch (err) {
        ctx.auth = {} as Auth;
        ctx.logger.warn(err.message, { method: 'check', authenticator: name });
        return next();
      }
      if (authenticator) {
        const user = await ctx.auth.check();
        if (user) {
          ctx.auth.user = user;
        }
      }
      await next();
    };
  }
  /**
   * checkMiddleware
   * @description Auth middleware, used to authenication the user status.
   */
  authMiddleware() {
    const self = this;
    return async function (ctx: Context & { auth: Auth }, next: Next) {
      try {
        const token = ctx.getBearerToken();
        if (token && (await ctx.app.authManager.jwt.blacklist?.has(token))) {
          return ctx.throw(401, {
            code: 'TOKEN_INVALID',
            message: ctx.t('Token is invalid'),
          });
        }
        const { resourceName, actionName } = ctx.action;
        const isPublicAction = ctx.dataSource.acl.isPublicAction(resourceName, actionName);
        const name = ctx.get(self.options.authKey) || self.options.default;

        if (!isPublicAction) {
          let authenticator: Auth;
          try {
            authenticator = await ctx.app.authManager.get(name, ctx);
            ctx.auth = authenticator;
          } catch (err) {
            ctx.auth = {} as Auth;
            ctx.logger.warn(err.message, { method: 'check', authenticator: name });
            return next();
          }
          if (authenticator) await authenticator.authenticate();
        }
        return next();
      } catch (error) {
        ctx.throw(401, error.message);
      }
    };
  }
}
