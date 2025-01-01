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
import { JTIStatus } from './base/token-control-service';
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};

type CheckResult = {
  token: { status: 'valid' | 'expired' | 'invalid' | 'empty'; type?: 'API' | 'user'; newToken?: string };
  jti?: { status: JTIStatus };
  user?: any;
  message?: string;
};

type AuthErrorType =
  | 'empty-token'
  | 'expired-token'
  | 'invalid-token'
  | 'renewed-token'
  | 'missing-jti'
  | 'inactive-jti'
  | 'renewed-jti'
  | 'unrenewable-jti'
  | 'blocked-jti'
  | 'login-timeout-jti';

type AhthErrorData = {
  newToken?: string;
};
export class AuthError extends Error {
  type: AuthErrorType;
  data: AhthErrorData;
  constructor(message: string, type: AuthErrorType, data: AhthErrorData = {}) {
    super(message);
    this.name = 'AuthError';
    this.type = type;
    this.data = data;
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

  // The abstract methods are required to be implemented by all authentications.
  abstract check(): Promise<Model>;
  // The following methods are mainly designed for user authentications.

  async signIn(): Promise<any> {}
  async signUp(): Promise<any> {}
  async signOut(): Promise<any> {}
}
