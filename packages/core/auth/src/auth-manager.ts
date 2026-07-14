/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { getAuthCookieName, getAuthCookieOptions, Registry, storagePathJoin } from '@nocobase/utils';
import { Auth, AuthExtend } from './auth';
import { JwtOptions, JwtService } from './base/jwt-service';
import { ITokenBlacklistService } from './base/token-blacklist-service';
import { ITokenControlService } from './base/token-control-service';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export interface Authenticator {
  authType: string;
  options: Record<string, any>;
  [key: string]: any;
}

export type BuiltInAuthenticator = Authenticator & {
  name: string;
  enabled?: boolean;
};

export interface Storer {
  get: (name: string) => Promise<Authenticator>;
}

export type AuthManagerOptions = {
  authKey: string;
  default?: string;
  jwt?: JwtOptions;
};

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

type AuthConfig = {
  auth: AuthExtend<Auth>; // The authentication class.
  title?: string; // The display name of the authentication type.
  hidden?: boolean; // Whether to hide from the authenticator type list.
  getPublicOptions?: (options: Record<string, any>) => Record<string, any>; // Get the public options.
};

export class AuthManager {
  /**
   * @internal
   */
  jwt: JwtService;
  tokenController: ITokenControlService;

  protected options: AuthManagerOptions;
  protected authTypes: Registry<AuthConfig> = new Registry();
  // authenticators collection manager.
  protected storer: Storer;
  protected builtInAuthenticators = new Map<string, BuiltInAuthenticator>();

  constructor(options: AuthManagerOptions) {
    this.options = options;
    const jwtOptions = options.jwt || ({} as JwtOptions);
    if (!jwtOptions.secret) {
      jwtOptions.secret = this.getDefaultJWTSecret();
    }
    this.jwt = new JwtService(jwtOptions);
  }

  setStorer(storer: Storer) {
    this.storer = storer;
  }

  registerBuiltInAuthenticator(authenticator: BuiltInAuthenticator) {
    this.builtInAuthenticators.set(authenticator.name, {
      enabled: true,
      options: {},
      ...authenticator,
    });
  }

  unregisterBuiltInAuthenticator(name: string) {
    this.builtInAuthenticators.delete(name);
  }

  getBuiltInAuthenticator(name: string) {
    const authenticator = this.builtInAuthenticators.get(name);
    if (!authenticator?.enabled) {
      return null;
    }
    return authenticator;
  }

  private createAuth(authenticator: Authenticator, ctx: Context) {
    const { auth } = this.authTypes.get(authenticator.authType) || {};
    if (!auth) {
      throw new Error(`AuthType [${authenticator.authType}] is not found.`);
    }
    return new auth({ authenticator, options: authenticator.options, ctx });
  }

  setTokenBlacklistService(service: ITokenBlacklistService) {
    this.jwt.blacklist = service;
  }

  setTokenControlService(service: ITokenControlService) {
    this.tokenController = service;
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
    return Array.from(this.authTypes.getEntities())
      .filter(([, authConfig]) => !authConfig.hidden)
      .map(([authType, authConfig]) => ({
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
    const builtInAuthenticator = this.getBuiltInAuthenticator(name);
    if (builtInAuthenticator) {
      return this.createAuth(builtInAuthenticator, ctx);
    }

    if (!this.storer) {
      throw new Error('AuthManager.storer is not set.');
    }
    const authenticator = await this.storer.get(name);
    if (!authenticator) {
      throw new Error(`Authenticator [${name}] is not found.`);
    }
    return this.createAuth(authenticator, ctx);
  }

  /**
   * middleware
   * @description Auth middleware, used to check the user status.
   */
  middleware() {
    const self = this;

    return async function AuthManagerMiddleware(ctx: Context & { auth: Auth }, next: Next) {
      const headerAuthenticator = ctx.get(self.options.authKey);
      const cookieName = getAuthCookieName('authenticator', ctx.app.name);
      const cookieAuthenticator = headerAuthenticator ? null : ctx.cookies.get(cookieName);
      const name = headerAuthenticator || cookieAuthenticator || self.options.default;
      let authenticator: Auth;
      try {
        authenticator = await ctx.app.authManager.get(name, ctx);
        ctx.auth = authenticator;
      } catch (err) {
        if (cookieAuthenticator && !headerAuthenticator && self.options.default && name !== self.options.default) {
          ctx.cookies.set(cookieName, null, getAuthCookieOptions(ctx));
          try {
            authenticator = await ctx.app.authManager.get(self.options.default, ctx);
            ctx.auth = authenticator;
          } catch (defaultErr) {
            ctx.auth = {} as Auth;
            ctx.logger.warn(defaultErr.message, { method: 'check', authenticator: self.options.default });
            return next();
          }
        } else {
          ctx.auth = {} as Auth;
          ctx.logger.warn(err.message, { method: 'check', authenticator: name });
          return next();
        }
      }

      if (!authenticator) {
        ctx.auth = {} as Auth;
        return next();
      }

      if (await ctx.auth.skipCheck()) {
        return next();
      }

      let user;
      try {
        user = await ctx.auth.check();
      } catch (err) {
        if (
          ctx.state?.optionalAuth === true &&
          ctx.state?.pendingAuthTokenSource === 'cookie' &&
          (err.status === 401 || err.statusCode === 401)
        ) {
          const authTokenCookieName = getAuthCookieName('authToken', ctx.app.name);
          const authCookieOptions = getAuthCookieOptions(ctx);
          ctx.cookies.set(authTokenCookieName, null, authCookieOptions);
          // Cookies written by older deployments may carry the raw APP_PUBLIC_PATH (with a
          // trailing slash) as path; that variant shadows the canonical cookie in browsers,
          // so it has to be expired explicitly as well.
          const rawPublicPath = process.env.APP_PUBLIC_PATH;
          if (rawPublicPath && rawPublicPath !== authCookieOptions.path) {
            ctx.cookies.set(authTokenCookieName, null, { ...authCookieOptions, path: rawPublicPath });
          }
          ctx.state.currentUser = undefined;
          ctx.state.authTokenSource = undefined;
          ctx.state.pendingAuthTokenSource = undefined;
          try {
            return await next();
          } catch (anonymousErr) {
            // koa's onerror strips response headers from unhandled errors; re-attach the
            // cookie cleanup so it still reaches the browser on error responses.
            const setCookieHeader = ctx.res.getHeader('set-cookie');
            if (setCookieHeader) {
              anonymousErr.headers = { ...anonymousErr.headers, 'set-cookie': setCookieHeader };
            }
            throw anonymousErr;
          }
        }
        throw err;
      }
      if (user) {
        ctx.auth.user = user;
      }
      await next();
    };
  }

  private getDefaultJWTSecret(): Buffer | string {
    if (process.env.UNSAFE_USE_DEFAULT_JWT_SECRET === 'true') {
      return process.env.APP_KEY;
    }
    const jwtSecretPath = storagePathJoin('apps', 'main', 'jwt_secret.dat');
    const jwtSecretExists = fs.existsSync(jwtSecretPath);
    if (jwtSecretExists) {
      const key = fs.readFileSync(jwtSecretPath);
      if (key.length !== 32) {
        throw new Error('Invalid api key length in file');
      }
      return key;
    }
    const envKey = process.env.APP_KEY;
    if (envKey && envKey !== 'your-secret-key' && envKey !== 'test-key') {
      return envKey;
    }
    const key = crypto.randomBytes(32);
    fs.mkdirSync(path.dirname(jwtSecretPath), { recursive: true });
    fs.writeFileSync(jwtSecretPath, key, { mode: 0o600 });
    return key;
  }
}

export async function csrfMiddleware(ctx: Context, next: Next) {
  if (SAFE_METHODS.has(ctx.method)) {
    return next();
  }

  if (ctx.state?.authTokenSource !== 'cookie' || !ctx.state?.currentUser) {
    return next();
  }

  const cookieToken = ctx.cookies.get(getAuthCookieName('csrfToken', ctx.app.name));
  const headerToken = ctx.get('X-CSRF-Token');
  if (!cookieToken || cookieToken.length < 16 || headerToken !== cookieToken) {
    return ctx.throw(403, ctx.t('Invalid CSRF token', { ns: 'auth' }));
  }

  await next();
}
