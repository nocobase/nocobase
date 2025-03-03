/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Model } from '@nocobase/database';
import { Authenticator } from './auth-manager';
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
export const AuthErrorCode = {
  EMPTY_TOKEN: 'EMPTY_TOKEN' as const,
  EXPIRED_TOKEN: 'EXPIRED_TOKEN' as const,
  INVALID_TOKEN: 'INVALID_TOKEN' as const,
  TOKEN_RENEW_FAILED: 'TOKEN_RENEW_FAILED' as const,
  BLOCKED_TOKEN: 'BLOCKED_TOKEN' as const,
  EXPIRED_SESSION: 'EXPIRED_SESSION' as const,
  NOT_EXIST_USER: 'NOT_EXIST_USER' as const,
  SKIP_TOKEN_RENEW: 'SKIP_TOKEN_RENEW' as const,
};

export type AuthErrorType = keyof typeof AuthErrorCode;

export class AuthError extends Error {
  code: AuthErrorType;
  constructor(options: { code: AuthErrorType; message: string }) {
    super(options.message);
    this.code = options.code;
  }
}
export type AuthExtend<T extends Auth> = new (config: AuthConfig) => T;

interface IAuth {
  user: Model;
  // Check the authenticaiton status and return the current user.
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  /**
   * options keys that are not allowed to use environment variables
   */
  public static optionsKeysNotAllowedInEnv: string[];
  abstract user: Model;
  protected authenticator: Authenticator;
  protected options: {
    [key: string]: any;
  };
  protected ctx: Context;

  constructor(config: AuthConfig) {
    const { authenticator, options, ctx } = config;
    this.authenticator = authenticator;
    this.options = options;
    this.ctx = ctx;
  }

  async skipCheck() {
    if (this.ctx.skipAuthCheck === true) {
      return true;
    }
    const token = this.ctx.getBearerToken();
    if (!token && this.ctx.app.options.acl === false) {
      return true;
    }
    const { resourceName, actionName } = this.ctx.action;
    const acl = this.ctx.dataSource.acl;
    const isPublic = await acl.allowManager.isAllowed(resourceName, actionName, this.ctx);
    return isPublic;
  }

  // The abstract methods are required to be implemented by all authentications.
  abstract check(): Promise<Model>;
  abstract checkToken(): Promise<{
    tokenStatus: 'valid' | 'expired' | 'invalid';
    user: Awaited<ReturnType<Auth['check']>>;
    jti?: string;
    temp: any;
    roleName?: any;
    signInTime?: number;
  }>;
  // The following methods are mainly designed for user authentications.

  async signIn(): Promise<any> {}
  async signUp(): Promise<any> {}
  async signOut(): Promise<any> {}
}
